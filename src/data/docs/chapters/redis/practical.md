## রিয়েল ইমপ্লিমেন্টেশন

এতকন আমরা Redis এর concept আর command শিখলাম। এবার সেগুলো ব্যবহার করে real-world application বানানো যাক। Session store, rate limiter, cache decorator, leaderboard, আর Docker Compose setup — সব এক জায়গায়। প্রতিটা pattern production-ready।

## Connection Pooling

Production এ প্রতিটা operation এ নতুন connection খোলা অনেক slow। Connection pool দিয়ে কিছু connection আগেই খোলা থাকে, reuse করা হয়। redis-py তে `ConnectionPool` automatic, কিন্তু ভালোভাবে configure করা গুরুত্বপূর্ণ।

নিচের কোডে production-grade connection pool setup দেখানো হলো। `max_connections` limit রাখা গুরুত্বপূর্ণ — অনেক বেশি থাকলে Redis server এ connection pressure পড়ে।

```python
import redis

# Production connection pool configuration
pool = redis.ConnectionPool(
    host="localhost",
    port=6379,
    db=0,
    max_connections=50,
    socket_timeout=5,
    socket_connect_timeout=5,
    retry_on_timeout=True,
    decode_responses=True
)

# Use across the entire application
r = redis.Redis(connection_pool=pool)

# Verify
print(r.ping())  # True
```

## Session Store

Web application এ session Redis এ রাখলে multiple server এর মধ্যে share করা যায়। প্রতিটা session একটা unique ID পায়, TTL দিয়ে auto-expire হয়। নিচে FastAPI তে session store implement করা হলো।

```python
from fastapi import FastAPI, Request, Response
import redis
import json
import secrets

app = FastAPI()
r = redis.Redis(connection_pool=pool)

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")

    # Generate unique session ID
    session_id = secrets.token_urlsafe(32)

    # Store session data in Redis (expires in 24 hours)
    session_data = {
        "username": username,
        "role": "user",
        "login_time": "2024-01-15T10:30:00"
    }
    r.setex(f"session:{session_id}", 86400, json.dumps(session_data))

    return {"session_id": session_id, "message": "Login successful"}

@app.get("/profile")
async def get_profile(request: Request):
    session_id = request.headers.get("X-Session-ID")
    session = r.get(f"session:{session_id}")

    if not session:
        return {"error": "Not authenticated"}, 401

    user_data = json.loads(session)
    return {"user": user_data["username"], "role": user_data["role"]}

@app.post("/logout")
async def logout(request: Request):
    session_id = request.headers.get("X-Session-ID")
    r.delete(f"session:{session_id}")
    return {"message": "Logged out"}
```

## Rate Limiter Middleware

Rate limiting দিয়ে API কে abuse থেকে রক্ষা করা যায়। নিচের decorator প্রতিটা endpoint এ attach করা যায়। Sliding window algorithm ব্যবহার করে — নির্দিষ্ট সময়ে কত request allowed সেটা control করে।

```python
import time
from functools import wraps
from fastapi import HTTPException

def rate_limit(max_requests=100, window_seconds=60):
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Use client IP as identifier
            client_id = request.client.host
            key = f"ratelimit:{client_id}"
            now = time.time()
            window_start = now - window_seconds

            pipe = r.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()

            request_count = results[2]
            if request_count > max_requests:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit: {max_requests} per {window_seconds}s"
                )
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

# Usage in FastAPI
@app.get("/api/expensive")
@rate_limit(max_requests=10, window_seconds=60)
async def expensive_endpoint(request: Request):
    return {"data": "This endpoint allows 10 requests per minute"}
```

## Cache Decorator

ফাংশনের result অটোমেটিকভাবে cache করার জন্য decorator পারফেক্ট। নিচের `@redis_cache` decorator function signature থেকে cache key generate করে, TTL সেট করে, আর cache miss হলে function call করে result cache করে।

```python
import functools
import json
import hashlib

def redis_cache(ttl=300, prefix="cache"):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_data = json.dumps(
                {"args": str(args), "kwargs": str(kwargs)},
                sort_keys=True
            )
            key_hash = hashlib.md5(cache_data.encode()).hexdigest()
            cache_key = f"{prefix}:{func.__name__}:{key_hash}"

            # Check cache
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)

            # Cache miss - call the actual function
            result = func(*args, **kwargs)

            # Store result in cache
            if result is not None:
                r.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator

# Usage
@redis_cache(ttl=600, prefix="user")
def get_user_profile(user_id):
    # Expensive database query
    print(f"DB query for user {user_id}")
    return {"id": user_id, "name": "Karim", "email": "karim@example.com"}

# First call - DB query, cached
profile = get_user_profile(1001)
# Second call - served from cache
profile = get_user_profile(1001)
```

## Real-time Leaderboard

Sorted Set দিয়ে leaderboard বানানো খুব সহজ। Score update, ranking query, top-N — সব built-in command দিয়ে হয়। নিচে একটা game leaderboard system দেখানো হলো।

```python
class Leaderboard:
    def __init__(self, name):
        self.key = f"leaderboard:{name}"

    def add_score(self, player, score):
        r.zadd(self.key, {player: score})

    def update_score(self, player, additional):
        r.zincrby(self.key, additional, player)

    def get_top(self, count=10):
        return r.zrevrange(
            self.key, 0, count - 1, withscores=True
        )

    def get_rank(self, player):
        rank = r.zrevrank(self.key, player)
        score = r.zscore(self.key, player)
        return {"rank": rank + 1 if rank is not None else None,
                "score": score}

    def get_around(self, player, count=2):
        rank = r.zrevrank(self.key, player)
        if rank is None:
            return []
        start = max(0, rank - count)
        end = rank + count
        return r.zrevrange(self.key, start, end, withscores=True)

# Usage
lb = Leaderboard("game_xyz")
lb.add_score("Karim", 1500)
lb.add_score("Sadia", 2000)
lb.add_score("Rahim", 1200)
lb.add_score("Tania", 1800)

lb.update_score("Karim", 300)  # Karim scored 300 more
print(lb.get_top(3))
print(lb.get_rank("Karim"))
print(lb.get_around("Karim"))
```

## Docker Compose — Full Stack

Production এ Redis একা চলে না — application আর Redis একসাথে থাকে। Docker Compose দিয়ে পুরো stack define করা যায়। RedisInsight হলো Redis এর GUI management tool।

নিচের Docker Compose file তিনটা service define করে — Python app, Redis server, আর RedisInsight (GUI)। `depends_on` দিয়ে startup order নিশ্চিত করা হয়।

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      redis:
        condition: service_healthy

  redis:
    image: redis:8-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  redisinsight:
    image: redis/redisinsight:latest
    ports:
      - "5540:5540"
    depends_on:
      - redis

volumes:
  redis_data:
```

## Best Practices

### Key Naming Convention

Redis এ key name গুরুত্বপূর্ণ — ভালো naming convention থাকলে debugging আর management সহজ হয়। Colon (`:`) separator ব্যবহার করা standard convention।

```text
# Good naming patterns:
user:1001:profile          # User profile
user:1001:sessions         # User's active sessions
session:abc123xyz          # Session by ID
cache:api:users:list       # Cached API response
ratelimit:192.168.1.1      # Rate limit by IP
leaderboard:game_xyz       # Game leaderboard
lock:order:5001            # Distributed lock
stream:orders              # Order processing stream
```

### Serialization — JSON vs MessagePack

ডেটা serialize করার দুটো common option: JSON (human-readable, বড়) আর MessagePack (binary, ছোট আর দ্রুত)। Performance critical system এ MessagePack ভালো।

```python
import json
import msgpack

data = {"name": "Karim", "scores": [95, 87, 92], "active": True}

# JSON - readable, larger size
json_bytes = json.dumps(data).encode()
print(f"JSON size: {len(json_bytes)} bytes")

# MessagePack - binary, smaller, faster
msgpack_bytes = msgpack.packb(data)
print(f"MessagePack size: {len(msgpack_bytes)} bytes")

# Store with MessagePack
r.set("user:1001", msgpack_bytes)
loaded = msgpack.unpackb(r.get("user:1001"))
```

> [!tip] Key Naming — Colon Convention
> # Redis key তে colon (`:`) separator ব্যবহার করো — এটা Redis কমিউনিটির standard। যেমন `user:1001:profile` — এখানে entity type (`user`), ID (`1001`), আর attribute (`profile`) স্পষ্টভাবে আলাদা। এটা debugging সহজ করে, `KEYS user:1001:*` দিয়ে এক user এর সব key খুঁজে পাওয়া যায়। আর namespace prefix ব্যবহার করো — production এ একই Redis এ অনেক app থাকতে পারে, prefix দিলে conflict হয় না।