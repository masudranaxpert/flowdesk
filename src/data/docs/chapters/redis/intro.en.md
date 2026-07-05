# What is Redis & Installation

## What is Redis?

Redis (Remote Dictionary Server) is an **in-memory key-value data store**. Traditional databases (MySQL, PostgreSQL) store data on hard drives, but Redis keeps data in RAM. That's why read/write operations happen in **microseconds** — 100 to 1000 times faster than a traditional database.

## Why is Redis So Fast?

Reading from RAM is roughly 100,000 times faster than reading from a hard drive. Redis takes full advantage of this. Its architecture is single-threaded but event-driven, so there's no locking overhead.

| Database | Storage | Read Speed | Write Speed |
|----------|---------|------------|-------------|
| PostgreSQL (Disk) | Hard Drive | ~ms | ~ms |
| Redis (RAM) | Memory | ~μs | ~μs |
| Ratio | — | 1000x faster | 1000x faster |

## Redis Use Cases

Redis is not just a cache — it's a versatile data platform:

- **Caching** — Storing database query results to speed up responses
- **Session Store** — User login sessions, shared across multiple servers
- **Real-time Analytics** — Page view counts, active user tracking
- **Message Queue** — Async processing with Pub/Sub and Streams
- **Rate Limiting** — API call limits, request counts per user
- **Leaderboard** — Ranking with Sorted Sets
- **Real-time Chat** — Live messaging with Pub/Sub

> [!note] Redis is Not Just a Cache
> Many people think Redis is only a caching tool. But Redis has Streams (message queue), Sorted Sets (leaderboard), Pub/Sub (real-time), Bitmap (analytics), HyperLogLog (cardinality), and many other powerful data structures. You can build the entire backbone of an application using Redis.

## Installing Redis

### Using Docker (Recommended)

Running Redis with Docker is the cleanest approach. There's no system pollution, and it's easy to remove. The `-p 6379:6379` maps the port, `-d` runs it in the background. Redis's default port is 6379.

```bash
# Run Redis in Docker
docker run --name my-redis \
  -p 6379:6379 \
  -d redis:latest

# Run with persistence (save data to disk)
docker run --name my-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  -d redis redis-server --appendonly yes

# Connect to the container's Redis CLI
docker exec -it my-redis redis-cli
```

### Using apt (Ubuntu)

If you want to install Redis directly on a Linux server, you can use the package manager. After installation, you manage the service with `systemctl`.

```bash
# Install Redis on Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server
```

## redis-cli — Command Line Interface

`redis-cli` is Redis's interactive terminal. You can type commands directly to talk to Redis. Let's look at some basic commands first.

```bash
# Start the Redis CLI
redis-cli

# Test connection
127.0.0.1:6379> PING
PONG
```

The example below shows the most basic operations. `SET` stores a key-value pair, `GET` reads the value, `DEL` deletes, and `EXISTS` checks if a key exists.

```text
127.0.0.1:6379> SET name "Karim Ahmed"
OK
127.0.0.1:6379> GET name
"Karim Ahmed"
127.0.0.1:6379> SET counter 100
OK
127.0.0.1:6379> EXISTS name
(integer) 1
127.0.0.1:6379> DEL name
(integer) 1
127.0.0.1:6379> GET name
(nil)
```

In Redis, you can set a TTL (Time To Live) on a key so it auto-deletes after a specific time. `EXPIRE` sets the TTL in seconds, and `TTL` shows the remaining time.

```text
127.0.0.1:6379> SET session:abc123 "user_data"
OK
127.0.0.1:6379> EXPIRE session:abc123 300
(integer) 1
127.0.0.1:6379> TTL session:abc123
(integer) 298
127.0.0.1:6379> TTL session:abc123
(integer) 295
127.0.0.1:6379> SET temp_key "hello" EX 60
OK
127.0.0.1:6379> TTL temp_key
(integer) 58
127.0.0.1:6379> PERSIST temp_key
(integer) 1
127.0.0.1:6379> TTL temp_key
(integer) -1
```

To see all keys, you can use `KEYS *` (though this should be avoided in production — it's slow). It's better to find specific keys using pattern matching.

```text
127.0.0.1:6379> KEYS *
1) "counter"
2) "session:abc123"
3) "temp_key"
127.0.0.1:6379> KEYS session:*
1) "session:abc123"
127.0.0.1:6379> DBSIZE
(integer) 3
127.0.0.1:6379> FLUSHDB
OK
127.0.0.1:6379> DBSIZE
(integer) 0
```

## Connecting to Redis with Python

To connect Python to Redis, you need the `redis-py` library. It's the official Python client. The code below connects to the Redis server and shows how to set and get data. With `decode_responses=True`, it returns strings instead of bytes.

```bash
# Install redis-py
pip install redis
```

```python
import redis

# Connect to local Redis server
# decode_responses=True returns strings instead of bytes
r = redis.Redis(host="localhost", port=6379, decode_responses=True)

# Test connection
print(r.ping())  # True

# Set and get a string value
r.set("city", "Dhaka")
print(r.get("city"))  # Dhaka

# Set with expiration (60 seconds)
r.setex("temp_token", 60, "abc123xyz")
print(r.ttl("temp_token"))  # 58 (seconds remaining)

# Increment a counter
r.set("visits", 0)
r.incr("visits")
r.incr("visits")
r.incrby("visits", 10)
print(r.get("visits"))  # 12

# Delete a key
r.delete("city")
print(r.exists("city"))  # 0 (does not exist)
```

## More Operations with Python

The example below shows basic usage of hash, list, and set. We'll cover each structure in detail in the next chapter.

```python
import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

# Hash - store object-like data
r.hset("user:1001", mapping={
    "name": "Sadia",
    "email": "sadia@example.com",
    "age": "25"
})
print(r.hgetall("user:1001"))

# List - queue or stack
r.rpush("tasks", "send_email", "generate_report", "backup_db")
print(r.lrange("tasks", 0, -1))

# Set - unique collection
r.sadd("tags:article1", "python", "redis", "database")
r.sadd("tags:article2", "python", "docker")
print(r.smembers("tags:article1"))

# Sorted Set - leaderboard
r.zadd("scores", {"Karim": 95, "Rahim": 87, "Sadia": 92})
print(r.zrange("scores", 0, -1, withscores=True))
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `SET key value` | Store a value |
| `GET key` | Read a value |
| `DEL key` | Delete a key |
| `EXISTS key` | Check if key exists |
| `EXPIRE key seconds` | Set a TTL |
| `TTL key` | Check remaining time |
| `INCR key` | Increment numeric value by 1 |
| `KEYS pattern` | Find keys by pattern |
| `FLUSHDB` | Delete all keys in current database |
| `DBSIZE` | Count keys in database |

> [!tip] Do Not Use KEYS in Production
> The `KEYS *` command scans all keys, so Redis blocks when there are many keys. In production, you should use `SCAN` — it's non-blocking and cursor-based. Use `SCAN 0 MATCH session:* COUNT 100` to find keys in batches.