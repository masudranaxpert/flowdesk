# Deep Dive into Data Structures

Redis's biggest strength is its rich set of data structures. A simple key-value store only holds strings, but Redis has Strings, Hashes, Lists, Sets, Sorted Sets, HyperLogLog, and Bitmaps — each with its own command set and use cases. Choosing the right structure makes your application faster and cleaner.

## String

String is Redis's most basic type. It's not just text — it can store numbers, JSON, or any binary data (up to 512MB). You can create atomic counters with `INCR`/`DECR`, and append to strings with `APPEND`.

```text
127.0.0.1:6379> SET username "karim_ahmed"
OK
127.0.0.1:6379> GET username
"karim_ahmed"
127.0.0.1:6379> STRLEN username
(integer) 12
127.0.0.1:6379> APPEND username "_2024"
(integer) 17
127.0.0.1:6379> GET username
"karim_ahmed_2024"
127.0.0.1:6379> SET counter 100
OK
127.0.0.1:6379> INCR counter
(integer) 101
127.0.0.1:6379> INCRBY counter 50
(integer) 151
127.0.0.1:6379> DECR counter
(integer) 150
127.0.0.1:6379> SETNX counter 0
(integer) 0
```

`SETNX` (Set if Not eXists) only sets a value if the key doesn't already exist — very useful for distributed locks. `MSET`/`MGET` let you set or get many keys at once.

## Hash

Hash is Redis's way of representing objects. Under a single key, you have multiple field-value pairs — like a Python dictionary. Perfect for user profiles, product info, and more. Each field can be read or written individually.

```text
127.0.0.1:6379> HSET user:1001 name "Sadia" email "sadia@mail.com" age "25"
(integer) 3
127.0.0.1:6379> HGET user:1001 name
"Sadia"
127.0.0.1:6379> HGETALL user:1001
1) "name"
2) "Sadia"
3) "email"
4) "sadia@mail.com"
5) "age"
6) "25"
127.0.0.1:6379> HINCRBY user:1001 age 1
(integer) 26
127.0.0.1:6379> HDEL user:1001 email
(integer) 1
127.0.0.1:6379> HLEN user:1001
(integer) 2
127.0.0.1:6379> HEXISTS user:1001 name
(integer) 1
```

The advantage of Hash is that you can update a single field without updating the entire object. If you stored the entire JSON as a String, changing one field would require read → modify → write of the whole thing.

## List

List is an ordered sequence of strings — implemented as a doubly linked list. You can push and pop from both ends. Ideal for queues (FIFO), stacks (LIFO), or recent activity feeds. `LPUSH` adds to the left, `RPUSH` adds to the right.

```text
127.0.0.1:6379> LPUSH tasks "task1" "task2"
(integer) 2
127.0.0.1:6379> RPUSH tasks "task3"
(integer) 3
127.0.0.1:6379> LRANGE tasks 0 -1
1) "task2"
2) "task1"
3) "task3"
127.0.0.1:6379> LPOP tasks
"task2"
127.0.0.1:6379> RPOP tasks
"task3"
127.0.0.1:6379> LLEN tasks
(integer) 1
127.0.0.1:6379> LRANGE tasks 0 -1
1) "task1"
```

With `BLPOP` and `BRPOP`, you can do blocking pops — if the list is empty, they wait until a new item arrives. This is fantastic for building simple message queues.

## Set

Set is a collection of unique elements — unordered, no duplicates. Tags, categories, friend lists — anywhere you need uniqueness. You can perform set operations with `SINTER` (intersection), `SUNION` (union), and `SDIFF` (difference).

```text
127.0.0.1:6379> SADD skills:karim "python" "docker" "linux"
(integer) 3
127.0.0.1:6379> SADD skills:rahim "python" "java" "docker"
(integer) 3
127.0.0.1:6379> SMEMBERS skills:karim
1) "python"
2) "docker"
3) "linux"
127.0.0.1:6379> SINTER skills:karim skills:rahim
1) "python"
2) "docker"
127.0.0.1:6379> SUNION skills:karim skills:rahim
1) "python"
2) "docker"
3) "linux"
4) "java"
127.0.0.1:6379> SDIFF skills:karim skills:rahim
1) "linux"
127.0.0.1:6379> SISMEMBER skills:karim "python"
(integer) 1
127.0.0.1:6379> SCARD skills:karim
(integer) 3
```

## Sorted Set

Sorted Set (ZSet) is Redis's most powerful structure — each member has a score, and they're kept sorted by that score. Leaderboards, rankings, priority queues, time-series — it's used everywhere. `ZADD` adds members with their scores.

```text
127.0.0.1:6379> ZADD leaderboard 95 "Karim" 87 "Rahim" 92 "Sadia" 78 "Jamal"
(integer) 4
127.0.0.1:6379> ZRANGE leaderboard 0 -1 WITHSCORES
1) "Jamal"
2) "78"
3) "Rahim"
4) "87"
5) "Sadia"
6) "92"
7) "Karim"
8) "95"
127.0.0.1:6379> ZREVRANGE leaderboard 0 2 WITHSCORES
1) "Karim"
2) "95"
3) "Sadia"
4) "92"
5) "Rahim"
6) "87"
127.0.0.1:6379> ZRANGEBYSCORE leaderboard 80 95
1) "Rahim"
2) "Sadia"
3) "Karim"
127.0.0.1:6379> ZRANK leaderboard "Karim"
(integer) 3
127.0.0.1:6379> ZINCRBY leaderboard 5 "Rahim"
"92"
```

`ZREVRANGE` shows members in descending order (top scorer first). `ZRANGEBYSCORE` finds members within a score range.

## HyperLogLog

HyperLogLog is a probabilistic data structure for counting unique elements. Counting with a regular Set means storing every element (lots of memory), but HyperLogLog can count billions of unique elements in a fixed 12KB of memory (with ~0.81% error).

```text
127.0.0.1:6379> PFADD visitors:20240115 "user1" "user2" "user3" "user1" "user2"
(integer) 1
127.0.0.1:6379> PFCOUNT visitors:20240115
(integer) 3
127.0.0.1:6379> PFADD visitors:20240116 "user4" "user5"
(integer) 1
127.0.0.1:6379> PFMERGE visitors:total visitors:20240115 visitors:20240116
OK
127.0.0.1:6379> PFCOUNT visitors:total
(integer) 5
```

Perfect for unique visitor counts, unique search query counts — anywhere you need an approximate number rather than an exact one.

## Bitmap

Bitmap is a bit-level operation on a string. Each bit can represent a boolean (yes/no). Feature flags, daily login tracking, A/B testing — all very efficient with bitmaps (1 user = 1 bit).

```text
127.0.0.1:6379> SETBIT user:1001:login 0 1
(integer) 0
127.0.0.1:6379> SETBIT user:1001:login 5 1
(integer) 0
127.0.0.1:6379> SETBIT user:1001:login 10 1
(integer) 0
127.0.0.1:6379> BITCOUNT user:1001:login
(integer) 3
127.0.0.1:6379> GETBIT user:1001:login 0
(integer) 1
127.0.0.1:6379> GETBIT user:1001:login 1
(integer) 0
```

The code below shows how to track daily active users over a year — one bitmap per user, one bit per day. One million users' yearly data = ~365 million bits ≈ only 43MB.

```text
127.0.0.1:6379> SETBIT active:2024 0 1
127.0.0.1:6379> SETBIT active:2024 1 1
127.0.0.1:6379> BITCOUNT active:2024
(integer) 2
```

## Summary Table

| Structure | Use Case | Key Commands |
|-----------|----------|--------------|
| String | Counter, simple value, JSON | SET, GET, INCR, APPEND |
| Hash | Object, user profile | HSET, HGET, HGETALL, HINCRBY |
| List | Queue, stack, recent items | LPUSH, RPUSH, LPOP, LRANGE |
| Set | Tags, unique collection | SADD, SMEMBERS, SINTER, SUNION |
| Sorted Set | Leaderboard, ranking | ZADD, ZRANGE, ZRANGEBYSCORE |
| HyperLogLog | Unique count (approximate) | PFADD, PFCOUNT, PFMERGE |
| Bitmap | Feature flag, daily tracking | SETBIT, BITCOUNT, GETBIT |

> [!tip] Choosing the Right Structure is Critical
> Picking the wrong structure hurts both performance and code complexity. For example, using a Hash instead of String+JSON for user profiles lets you update a single field directly. Not using a Sorted Set for a leaderboard means you'd have to sort every time. Each structure has its own strength — understand them and choose wisely.