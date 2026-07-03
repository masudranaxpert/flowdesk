## Docker Network কেন দরকার?

Docker-এ container গুলো isolated ভাবে চলে — ডিফল্টভাবে এক container আরেকটার সাথে কথা বলতে পারে না। কিন্তু real app-এ তো আমাদের একাধিক container লাগে — যেমন app + database + cache। এই container-গুলো পরস্পর যোগাযোগ করতে পারে — সেটাই Docker networking-এর কাজ।

## ডিফল্ট Network তিনটি

Docker install করলে তিনটা network অটোমেটিক তৈরি হয়:

| Network | কী করে |
|---|---|
| **bridge** | ডিফল্ট। সব container এখানে থাকে। তবে container-গুলো নাম দিয়ে একে অপরকে খুঁজে পায় না। |
| **host** | container সরাসরি host-এর network ব্যবহার করে। কোনো isolation নেই। |
| **none** | একদম কোনো network নেই। সম্পূর্ণ isolated। |

```bash
docker network ls
```

```text
NETWORK ID     NAME      DRIVER    SCOPE
a1b2c3d4e5f6   bridge    bridge    local
b2c3d4e5f6a1   host      host      local
c3d4e5f6a1b2   none      null      local
```

## User-Defined Bridge — আসল মজা

ডিফল্ট bridge-এর একটা বড় সীমাবদ্ধতা আছে — container-গুলো IP address দিয়ে একে অপরকে খুঁজতে হয়, নাম দিয়ে পাওয়া যায় না। কিন্তু **user-defined bridge** বানালে DNS-based service discovery পাওয়া যায় — মানে container-গুলো container-এর নাম দিয়ে একে অপরকে খুঁজে পায়!

```bash
# নিজের network বানাও
docker network create myapp-net

# দেখো
docker network ls
```

এবার দুটো container এই network-এ যোগ করো:

```bash
docker run -d --name redis --network myapp-net redis:7
docker run -d --name app --network myapp-net myapp:latest
```

এখন `app` container এর ভেতর থেকে `redis` নামটা সরাসরি resolve হবে:

```bash
docker exec app ping redis    # কাজ করবে!
```

> [!tip] কেন user-defined bridge ব্যবহার করবে?
# ডিফল্ট bridge-এ শুধু IP দিয়ে connect করতে হয়। User-defined bridge-এ container নাম দিয়ে connect করা যায় (DNS resolution), আর এটা অনেক বেশি production-friendly।

## Port Expose বানাম Publish

এই দুটো নিয়ে অনেক confusion থাকে — পরিষ্কার করে নিই:

| Concept | কী | কোথায় |
|---|---|---|
| **EXPOSE** | Dockerfile-এ documentation — "এই port-এ আমার app শোনে" | Dockerfile |
| **-p / --publish** | Host-এর port-কে container-এর port-এ map করা | `docker run` |

`EXPOSE` শুধু metadata — এটা দিলেও বাইরের দুনিয়া থেকে access পাওয়া যায় না। বাইরে থেকে access করতে হলে `-p` দিতে হয়:

```bash
# Host-এর 8080 → Container-এর 80
docker run -d -p 8080:80 nginx

# Host-এর 80 → Container-এর 80 (same port)
docker run -d -p 80:80 nginx

# শুধু localhost থেকে access
docker run -d -p 127.0.0.1:8080:80 nginx

# একাধিক port map
docker run -d -p 3000:3000 -p 443:443 myapp
```

> [!warn] Expose আর publish এক না
# `EXPOSE` শুধু documentation, কোনো port আসলে খোলে না। বাইরের দুনিয়া থেকে access করতে হলে অবশ্যই `-p` (publish) দিতে হবে।

## Container-to-Container Communication

একই user-defined network-এ থাকা container-গুলো সরাসরি পরস্পর কথা বলতে পারে। কোনো port publish করতে হয় না — শুধু container-এর নিজস্ব port যথেষ্ট:

```text
[app container] --myapp-net-- [redis container:6379]
```

`app` container এর ভেতর থেকে `redis:6379` লিখলেই connect হবে।

## Practical — App + Redis Custom Network-এ

ধরো তোমার app-কে Redis-এর সাথে কথা বলতে হবে। পুরো flow:

```bash
# ১. একটা custom network বানাও
docker network create app-net

# ২. Redis চালাও ওই network-এ
docker run -d \
  --name redis \
  --network app-net \
  redis:7-alpine

# ৩. তোমার app চালাও ওই network-এ
docker run -d \
  --name myapp \
  --network app-net \
  -p 3000:3000 \
  -e REDIS_URL=redis://redis:6379 \
  myapp:latest
```

লক্ষ করো — `REDIS_URL`-এ `redis://redis:6379` লেখা হয়েছে। এখানে `redis` হলো container-এর নাম, আর Docker-র DNS সেটাকে স্বয়ংক্রিয়ভাবে resolve করবে। কোনো IP address মনে রাখার দরকার নেই!

```bash
# যাচাই করো — app container থেকে redis কে ping করো
docker exec myapp ping -c 3 redis

# Network inspect করে দেখো কারা আছে
docker network inspect app-net
```

## Docker Compose-এ Network

সাধারণত আমরা `docker compose` ব্যবহার করি, আর Compose অটোমেটিক একটা default network বানিয়ে দেয় — সব service সেখানে যোগ হয়ে যায়:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
```

```bash
docker compose up -d
```

> [!example] Compose-এ নাম = service name
# Compose-এ container-গুলো service-এর নাম দিয়ে পরস্পর খুঁজে পায়। এখানে `redis` service-টার নামই `redis` — তাই `app` সরাসরি `redis:6379` connect করতে পারবে। Compose v2-তে এটাই default আচরণ।