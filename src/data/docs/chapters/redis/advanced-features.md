## Advanced — Lua, Rate Limit, Vector

Redis শুধু SET/GET এর জায়গা নয়। Lua scripting, transactions, pipelining, rate limiting, vector search — এসব advanced feature দিয়ে জটিল problem solve করা যায়। এই chapter এ প্রতিটা topic গভীরভাবে দেখব।

## Lua Scripting

Lua script Redis server এর ভিতরে execute হয় — atomic আর এক round trip এ শেষ। Multiple command একসাথে run করতে হলে, race condition এড়াতে Lua সবচেয়ে ভালো। `EVAL` দিয়ে script run, `EVALSHA` দিয়ে cached version run করা হয়।

নিচের Lua script atomic counter implement করে — শুধু তখনই increment করবে যখন current value ১০০ এর কম। এই জাতীয় conditional logic সাধারণ command দিয়ে করা যায় না (race condition), কিন্তু Lua তে atomic।

```python
import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

# Lua script for atomic conditional increment
lua_script = """
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current < tonumber(ARGV[1]) then
    redis.call('INCR', KEYS[1])
    return redis.call('GET', KEYS[1])
else
    return -1
end
"""

# Register and run the script
sha = r.script_load(lua_script)
result = r.evalsha(sha, 1, "counter:limit", "100")
print(f"Result: {result}")
```

> [!example] Lua Scripting কেন ব্যবহার করবে
> # তিনটা কারণ: (১) **Atomicity** — script execute হওয়া পর্যন্ত অন্য কোনো command ঢুকতে পারে না, (২) **Fewer round trips** — multiple command একবারে পাঠানো যায়, network latency কমে, (৩) **Complex logic** — conditional, loop সহ জটিল operation সম্ভব। Production এ Lua script cache করা হয় `SCRIPT LOAD` দিয়ে, তারপর `EVALSHA` দিয়ে run করা হয় — bandwidth বাঁচে।

## Rate Limiting — Sliding Window

Rate limiting দিয়ে API কে abuse থেকে বাঁচানো যায়। Sliding window algorithm Sorted Set দিয়ে implement করা হয় — প্রতিটা request এর timestamp score হিসেবে add করা হয়, আর window এর বাইরের গুলো মুছে ফেলা হয়।

নিচের Python কোডে sliding window rate limiter দেখানো হলো। প্রতিটা request এর timestamp ZADD করা হয়, পুরনো timestamp গুলো ZREMRANGEBYSCORE দিয়ে মুছে ফেলা হয়, আর ZCARD দিয়ে বর্তমান count দেখা হয়।

```python
import redis
import time

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

def rate_limit(user_id, max_requests=100, window_seconds=60):
    key = f"ratelimit:{user_id}"
    now = time.time()
    window_start = now - window_seconds

    pipe = r.pipeline()
    # Remove old entries outside the window
    pipe.zremrangebyscore(key, 0, window_start)
    # Add current request timestamp
    pipe.zadd(key, {str(now): now})
    # Count requests in current window
    pipe.zcard(key)
    # Set expiration on the key
    pipe.expire(key, window_seconds)
    results = pipe.execute()

    request_count = results[2]
    if request_count > max_requests:
        return False  # Rate limit exceeded
    return True  # Request allowed

# Usage - allow 100 requests per minute
for i in range(105):
    allowed = rate_limit("user:123", max_requests=100, window_seconds=60)
    status = "ALLOWED" if allowed else "BLOCKED"
    print(f"Request {i+1}: {status}")
```

## Token Bucket Rate Limiter

Token bucket algorithm আরেকটা popular approach। Bucket এ নির্দিষ্ট rate এ token যোগ হয়, প্রতিটা request এ একটা token খরচ হয়। Token না থাকলে request block। Lua দিয়ে atomic ভাবে implement করা যায়।

```python
token_bucket_lua = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])  -- tokens per second
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Refill tokens based on elapsed time
local elapsed = now - last_refill
tokens = math.min(capacity, tokens + elapsed * refill_rate)

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 3600)
    return 1  -- Allowed
else
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    return 0  -- Blocked
end
"""

sha = r.script_load(token_bucket_lua)

def token_bucket_check(user_id, capacity=10, refill_rate=1):
    now = time.time()
    result = r.evalsha(sha, 1, f"bucket:{user_id}",
                       capacity, refill_rate, now)
    return result == 1
```

## Transactions — MULTI/EXEC

Redis transaction দিয়ে multiple command একসাথে execute করা যায় — কোনো বাধা ছাড়া। `MULTI` দিয়ে start, command গুলো queue হয়, `EXEC` দিয়ে সব একসাথে run হয়। `WATCH` দিয়ে optimistic locking — key change হলে transaction abort।

```text
127.0.0.1:6379> WATCH balance:karim
OK
127.0.0.1:6379> GET balance:karim
"1000"
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> DECRBY balance:karim 500
QUEUED
127.0.0.1:6379(TX)> INCRBY balance:rahim 500
QUEUED
127.0.0.1:6379(TX)> EXEC
1) (integer) 500
2) (integer) 1500
```

নিচের Python কোডে WATCH দিয়ে optimistic locking implement করা হয়েছে। দুজন একসাথে balance change করলে race condition হতে পারে — WATCH সেটা prevent করে।

```python
def transfer_money(from_id, to_id, amount):
    from_key = f"balance:{from_id}"
    to_key = f"balance:{to_id}"

    while True:
        try:
            r.watch(from_key)
            current = int(r.get(from_key) or 0)

            if current < amount:
                r.unwatch()
                return False  # Insufficient balance

            pipe = r.pipeline()
            pipe.multi()
            pipe.decrby(from_key, amount)
            pipe.incrby(to_key, amount)
            pipe.execute()
            return True

        except redis.WatchError:
            # Key changed by another client, retry
            print("WatchError: retrying transfer...")
            continue
        finally:
            r.unwatch()
```

## Pipelining

Pipelining দিয়ে একসাথে অনেক command পাঠানো যায় — প্রতিটার জন্য response এর অপেক্ষা না করে। এটা network round trip কমায়, performance অনেক বাড়ে। redis-py তে `pipeline()` দিয়ে করা যায়।

```python
import time

# Without pipelining - slow (each command waits for response)
start = time.time()
for i in range(10000):
    r.set(f"key:{i}", f"value:{i}")
print(f"Without pipeline: {time.time() - start:.2f}s")

# With pipelining - much faster
start = time.time()
pipe = r.pipeline()
for i in range(10000):
    pipe.set(f"key:{i}", f"value:{i}")
pipe.execute()
print(f"With pipeline: {time.time() - start:.2f}s")
```

## Vector Search (RediSearch)

Redis 8 এ built-in vector search আছে। Embedding store করে similarity search করা যায় — RAG, semantic search, recommendation এর জন্য। `FT.CREATE` দিয়ে index, `FT.SEARCH` দিয়ে query করা হয়।

নিচের কোডে vector index তৈরি আর similarity search দেখানো হলো। Cosine similarity সবচেয়ে common distance metric — text embedding এর জন্য পারফেক্ট।

```python
# Create a vector index (requires RediSearch module / Redis Stack)
r.execute_command(
    "FT.CREATE", "doc_index",
    "ON", "HASH",
    "PREFIX", "1", "doc:",
    "SCHEMA",
    "title", "TEXT",
    "embedding", "VECTOR", "FLAT", "6",
    "TYPE", "FLOAT32",
    "DIM", "384",
    "DISTANCE_METRIC", "COSINE"
)

# Store documents with embeddings
import numpy as np

for i, (title, emb) in enumerate(documents):
    r.hset(f"doc:{i}", mapping={
        "title": title,
        "embedding": np.array(emb, dtype=np.float32).tobytes()
    })

# Search for similar vectors
def vector_search(query_embedding, top_k=5):
    query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()

    results = r.execute_command(
        "FT.SEARCH", "doc_index",
        "*=>[KNN 5 @embedding $query_vec]",
        "PARAMS", "2", "query_vec", query_bytes,
        "RETURN", "1", "title",
        "DIALECT", "2"
    )
    return results
```

## Keyspace Notifications

Keyspace notification দিয়ে key event (set, expire, delete) subscribe করা যায়। যেমন key expire হলে notification পাওয়া যায় — session timeout trigger করার জন্য দারুণ।

```python
# Enable keyspace notifications in redis.conf or via command
# notify-keyspace-events Ex = Expired events
r.config_set("notify-keyspace-events", "Ex")

# Subscribe to expiration events
pubsub = r.pubsub()
pubsub.psubscribe("__keyevent@0__:expired")

for message in pubsub.listen():
    if message["type"] == "pmessage":
        expired_key = message["data"]
        print(f"Key expired: {expired_key}")
        # Trigger cleanup, send notification, etc.
```

> [!tip] Pipelining vs Lua কখন কোনটা ব্যবহার করবে
> # Pipelining ব্যবহার করো যখন independent command অনেক পাঠাতে হবে (bulk SET, batch GET)। Lua ব্যবহার করো যখন command গুলো পরস্পরনির্ভরশীল আর atomicity দরকার (conditional increment, read-modify-write)। Pipelining এ command গুলো আলাদাভাবে execute হয় — মাঝে অন্য client এর command ঢুকতে পারে। Lua তে পুরো script একক atomic unit।