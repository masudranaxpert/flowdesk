## Data Structures গভীরে

Redis এর সবচেয়ে বড় strength হলো এর rich data structures। সাধারণ key-value store শুধু string রাখে, কিন্তু Redis এ আছে Strings, Hashes, Lists, Sets, Sorted Sets, HyperLogLog, Bitmap — প্রতিটার নিজস্ব command set আর use case। সঠিক structure বাছলেই application দ্রুত আর পরিষ্কার হয়।

## String

String হলো Redis এর সবচেয়ে basic type। এটা শুধু text নয় — number, JSON, যেকোনো binary data (512MB পর্যন্ত) store করতে পারে। `INCR`/`DECR` দিয়ে atomic counter বানানো যায়, `APPEND` দিয়ে string যোগ করা যায়।

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

`SETNX` (Set if Not eXists) দিয়ে key না থাকলেই set করা যায় — distributed lock এ খুব দরকারী। `MSET`/`MGET` দিয়ে একসাথে অনেক key set বা get করা যায়।

## Hash

Hash হলো Redis এর object representation। একটা key এর নিচে multiple field-value pair থাকে — Python dict এর মতো। User profile, product info এর জন্য পারফেক্ট। প্রতিটা field individually read/write করা যায়।

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

Hash এর সুবিধা হলো — পুরো object update না করে শুধু একটা field update করা যায়। String এ পুরো JSON store করলে একটা field change করতে পুরোটা read → modify → write করতে হয়।

## List

List হলো ordered sequence of strings — doubly linked list implementation। দুই দিক থেকে push/pop করা যায়। Queue (FIFO), Stack (LIFO), বা recent activity feed এর জন্য আদর্শ। `LPUSH` বামে, `RPUSH` ডানে add করে।

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

`BLPOP` আর `BRPOP` দিয়ে blocking pop করা যায় — list এ কিছু না থাকলে নতুন item আসা পর্যন্ত অপেক্ষা করে। এটা simple message queue বানাতে দারুণ কাজে দেয়।

## Set

Set হলো unique element এর collection — unordered, কোনো duplicate নেই। Tag, category, friend list — যেখানে uniqueness দরকার সেখানে। `SINTER` (intersection), `SUNION` (union), `SDIFF` (difference) দিয়ে set operation করা যায়।

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

Sorted Set (ZSet) হলো Redis এর সবচেয়ে powerful structure — প্রতিটা member এর একটা score থাকে, আর score অনুযায়ী sorted থাকে। Leaderboard, ranking, priority queue, time-series — সবকিছুতে ব্যবহার হয়। `ZADD` দিয়ে member+score add করা হয়।

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

`ZREVRANGE` দিয়ে descending order এ (top scorer আগে) দেখা যায়। `ZRANGEBYSCORE` দিয়ে score range এর ভিতরের member খুঁজা যায়।

## HyperLogLog

HyperLogLog হলো probabilistic data structure — unique element count করার জন্য। Set দিয়ে count করলে প্রতিটা element store করতে হয় (অনেক memory), কিন্তু HyperLogLog fixed 12KB memory তে বিলিয়ন unique element count করতে পারে (~0.81% error সহ)।

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

Unique visitor count, unique search query count — এসবের জন্য পারফেক্ট যেখানে exact number লাগে না, approximate চলে।

## Bitmap

Bitmap হলো string এর উপর bit-level operation। প্রতিটা bit দিয়ে boolean (yes/no) represent করা যায়। Feature flag, daily login tracking, A/B testing — এসবের জন্য খুব efficient (১ user = ১ bit)।

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

নিচের কোডে দেখানো হলো কীভাবে এক বছরের daily active user tracking করা যায় — প্রতিটা user এর জন্য একটা bitmap, প্রতিটা bit একদিন। ১০ লক্ষ user এর এক বছরের data = ~365 মিলিয়ন bit ≈ 43MB মাত্র।

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

> [!tip] সঠিক structure বাছাই অত্যন্ত গুরুত্বপূর্ণ
> # ভুল structure বাছলে performance আর code complexity দুটোই খারাপ হয়। যেমন user profile রাখতে String+JSON এর বদলে Hash ব্যবহার করলে শুধু একটা field update করা যায়। Leaderboard রাখতে Sorted Set না ব্যবহার করলে প্রতিবার sort করতে হবে। প্রতিটা structure এর নিজস্ব strength আছে — সেটা বুঝে use করতে হবে।