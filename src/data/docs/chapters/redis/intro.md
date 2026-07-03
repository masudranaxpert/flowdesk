## Redis কী ও Install

Redis (Remote Dictionary Server) হলো একটা **in-memory key-value data store**। সাধারণ database (MySQL, PostgreSQL) hard disk এ ডেটা রাখে, কিন্তু Redis RAM এ রাখে। তাই read/write হয় **microsecond** এ — traditional database এর চেয়ে ১০০-১০০০ গুণ দ্রুত।

## Redis কেন দ্রুত?

RAM থেকে read করা হার্ডডিস্ক থেকে read করার চেয়ে প্রায় ১,০০,০০০ গুণ দ্রুত। Redis এই advantage কাজে লাগায়। আর এর architecture single-threaded কিন্তু event-driven, তাই কোনো locking overhead নেই।

| Database | Storage | Read Speed | Write Speed |
|----------|---------|------------|-------------|
| PostgreSQL (Disk) | Hard Drive | ~ms | ~ms |
| Redis (RAM) | Memory | ~μs | ~μs |
| Ratio | — | 1000x দ্রুত | 1000x দ্রুত |

## Redis এর Use Cases

Redis শুধু cache নয় — এটা একটা বহুমুখী data platform:

- **Caching** — database query result রাখা, response দ্রুত করা
- **Session Store** — user login session, বহু server এর মধ্যে share
- **Real-time Analytics** — page view count, active user tracking
- **Message Queue** — Pub/Sub, Streams দিয়ে async processing
- **Rate Limiting** — API call limit, প্রতি user এর request count
- **Leaderboard** — Sorted Set দিয়ে ranking
- **Real-time Chat** — Pub/Sub দিয়ে live messaging

> [!note] Redis শুধু cache নয়
> # অনেকে Redis কে শুধু caching tool মনে করে। কিন্তু Redis এ আছে Streams (message queue), Sorted Sets (leaderboard), Pub/Sub (real-time), Bitmap (analytics), HyperLogLog (cardinality) — সহ অনেক শক্তিশালী data structure। Redis দিয়ে পুরো application এর backbone বানানো সম্ভব।

## Redis Install করা

### Docker দিয়ে (Recommended)

Docker দিয়ে Redis run করা সবচেয়ে পরিষ্কার উপায়। কোনো system pollution হয় না, remove করা সহজ। `-p 6379:6379` port mapping, `-d` background এ চালায়। Redis default port হলো 6379।

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

### apt দিয়ে (Ubuntu)

Linux server এ সরাসরি install করতে চাইলে package manager ব্যবহার করা যায়। ইনস্টল করার পর `systemctl` দিয়ে service manage করা হয়।

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

`redis-cli` হলো Redis এর interactive terminal। এখানে সরাসরি command লিখে Redis এর সাথে কথা বলা যায়। প্রথমে কিছু basic command দেখি।

```bash
# Start the Redis CLI
redis-cli

# Test connection
127.0.0.1:6379> PING
PONG
```

নিচের উদাহরণে সবচেয়ে basic operations দেখানো হলো। `SET` দিয়ে key-value store করা, `GET` দিয়ে read করা, `DEL` দিয়ে delete, `EXISTS` দিয়ে check করা হয়।

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

Redis এ TTL (Time To Live) সেট করে key কে নির্দিষ্ট সময় পর auto-delete করা যায়। `EXPIRE` দিয়ে second এ TTL দেওয়া হয়, আর `TTL` দিয়ে বাকি সময় দেখা যায়।

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

সব key দেখতে `KEYS *` ব্যবহার করা যায় (production এ এড়ানো উচিত — slow)। pattern match করে নির্দিষ্ট key খোঁজা ভালো।

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

## Python দিয়ে Redis Connection

Redis এর সাথে Python connect করতে `redis-py` library লাগে। এটা official Python client। নিচের কোডে Redis server এ connect করে, ডেটা set আর get করা দেখানো হলো। `decode_responses=True` দিলে byte এর বদলে string return করে।

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

## Python দিয়ে আরও Operations

নিচের উদাহরণে hash, list, set এর basic usage দেখানো হলো। পরের chapter এ প্রতিটা structure নিয়ে বিস্তারিত আলোচনা করা হবে।

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

| Command | কাজ |
|---------|-----|
| `SET key value` | value store করা |
| `GET key` | value পড়া |
| `DEL key` | key মুছা |
| `EXISTS key` | key আছে কিনা |
| `EXPIRE key seconds` | TTL সেট করা |
| `TTL key` | বাকি সময় দেখা |
| `INCR key` | numeric value ১ বাড়ানো |
| `KEYS pattern` | pattern match করে key খোঁজা |
| `FLUSHDB` | current database এর সব key মুছা |
| `DBSIZE` | কতগুলো key আছে |

> [!tip] Production এ KEYS ব্যবহার করবেন না
> # `KEYS *` command সব key scan করে, তাই অনেক key থাকলে Redis block হয়ে যায়। Production এ `SCAN` ব্যবহার করা উচিত — এটা non-blocking আর cursor-based। `SCAN 0 MATCH session:* COUNT 100` এভাবে batch batch করে key খুঁজতে হয়।