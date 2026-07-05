# Advanced — Lua, Rate Limiting, Vectors

Redis is more than just SET and GET. With advanced features like Lua scripting, transactions, pipelining, rate limiting, and vector search, you can solve complex problems. In this chapter, we'll explore each topic in depth.

## Lua Scripting

A Lua script executes inside the Redis server — it's atomic and finishes in a single round trip. When you need to run multiple commands together and avoid race conditions, Lua is the best option. `EVAL` runs a script, and `EVALSHA` runs a cached version.

The Lua script below implements an atomic conditional counter — it only increments when the current value is less than 100. This kind of conditional logic can't be done with regular commands (race conditions), but in Lua it's atomic.

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

> [!example] Why Use Lua Scripting
> Three reasons: (1) **Atomicity** — no other command can interrupt while the script executes, (2) **Fewer round trips** — multiple commands are sent at once, reducing network latency, (3) **Complex logic** — conditional and loop-based operations are possible. In production, Lua scripts are cached with `SCRIPT LOAD` and then run with `EVALSHA` — this saves bandwidth.

## Rate Limiting — Sliding Window

Rate limiting protects your API from abuse. The sliding window algorithm is implemented using a Sorted Set — each request's timestamp is added as the score, and entries outside the window are removed.

The Python code below shows a sliding window rate limiter. Each request's timestamp is added with ZADD, old timestamps are removed with ZREMRANGEBYSCORE, and the current count is checked with ZCARD.

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

The token bucket algorithm is another popular approach. Tokens are added to the bucket at a fixed rate, and each request consumes one token. If there are no tokens, the request is blocked. It can be implemented atomically with Lua.

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

Redis transactions let you execute multiple commands together without interruption. `MULTI` starts the transaction, commands are queued, and `EXEC` runs them all at once. `WATCH` provides optimistic locking — if a watched key changes, the transaction aborts.

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

The Python code below implements optimistic locking with WATCH. If two people try to change the balance simultaneously, there could be a race condition — WATCH prevents that.

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

Pipelining lets you send many commands at once — without waiting for a response after each one. This reduces network round trips and dramatically improves performance. In redis-py, you use `pipeline()`.

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

Redis 8 has built-in vector search. You can store embeddings and do similarity searches — perfect for RAG, semantic search, and recommendations. `FT.CREATE` creates an index, and `FT.SEARCH` queries it.

The code below shows creating a vector index and doing a similarity search. Cosine similarity is the most common distance metric — perfect for text embeddings.

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

Keyspace notifications let you subscribe to key events (set, expire, delete). For example, you can get a notification when a key expires — great for triggering session timeouts.

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

> [!tip] Pipelining vs Lua — When to Use Which
> Use pipelining when you need to send many independent commands (bulk SET, batch GET). Use Lua when commands are interdependent and you need atomicity (conditional increment, read-modify-write). In pipelining, commands execute separately — other clients' commands can slip in between. In Lua, the entire script is a single atomic unit.