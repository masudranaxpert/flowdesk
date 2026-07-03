# Image আর Container

আগের chapter এ আমরা শিখেছি Docker কী। এবার দুইটা সবচেয়ে গুরুত্বপূর্ণ concept বুঝবো — **Image** আর **Container**। এই দুটো না বুঝলে Docker এর কিছুই করা যাবে না।

## Image vs Container — পার্থক্য

সবচেয়ে সহজ analogy দিয়ে শুরু করি।

```
Image                          Container
──────                         ──────────
┌──────────────┐              ┌──────────────┐
│   Blueprint   │  ──run──→   │  চলন্ত বাস    │
│  (নকশা/রেসিপি) │             │  (live instance)│
└──────────────┘              └──────────────┘
   Static, read-only             Running, live

   একটা image থেকে               অনেক container
   অনেক container বানানো যায়      একসাথে চলতে পারে
```

| Image | Container |
|-------|-----------|
| Read-only template | Running instance of image |
| Blueprint / রেসিপি | সেই রেসিপি দিয়ে তৈরি খাবার |
| Disk এ store থাকে | Memory তে চলে |
| `docker images` দিয়ে দেখো | `docker ps` দিয়ে দেখো |

> [!note] এক কথায়
> Image হলো class, container হলো object — যেটা OOP এর মতো। এক class থেকে অনেক object বানানো যায়, ঠিক তেমনি এক image থেকে অনেক container।

## Image এর Layer Architecture

Docker image একটা single file না — এটা অনেকগুলো **layer** এর সমষ্টি। প্রতিটা instruction (FROM, RUN, COPY ইত্যাদি) একটা layer তৈরি করে।

```
┌─────────────────────────────┐
│  Layer 5: COPY app code     │  ← তোমার app
├─────────────────────────────┤
│  Layer 4: pip install flask │  ← dependencies
├─────────────────────────────┤
│  Layer 3: WORKDIR /app      │  ← working directory
├─────────────────────────────┤
│  Layer 2: apt install curl  │  ← system packages
├─────────────────────────────┤
│  Layer 1: python:3.13-slim  │  ← base image
└─────────────────────────────┘
```

> [!tip] Layer Caching
> প্রতিটা layer cache হয়। তুমি code change করলে শুধু last layer টা rebuild হয় — বাকি সব cache থেকে আসে। তাই Docker build খুব দ্রুত হয়।

## docker run — সবচেয়ে গুরুত্বপূর্ণ Command

`docker run` দিয়ে একটা image থেকে container তৈরি করে চালানো হয়। এর অনেক flag আছে — চলো সব গুরুত্বপূর্ণ flag দেখি:

```bash
docker run [OPTIONS] IMAGE [COMMAND]
```

### গুরুত্বপূর্ণ Flags

```bash
# -d: background এ চালাও (detached mode)
docker run -d nginx

# -p: port mapping (host_port:container_port)
docker run -d -p 8080:80 nginx

# -v: volume mount (host_path:container_path)
docker run -d -v /my/data:/data nginx

# -e: environment variable
docker run -d -e POSTGRES_PASSWORD=secret postgres:16

# --name: container কে নাম দাও
docker run -d --name my-nginx nginx

# --rm: container stop হলে automatically delete হবে
docker run --rm nginx
```

> [!example] সব একসাথে
> ```bash
> docker run -d \
>   --name my-postgres \
>   -p 5432:5432 \
>   -e POSTGRES_PASSWORD=mysecret \
>   -e POSTGRES_DB=myapp \
>   -v pgdata:/var/lib/postgresql/data \
>   postgres:16
> ```
> এখানে PostgreSQL চালু হলো — port 5432, password দেওয়া, database name দেওয়া, data persist করার জন্য volume mount করা।

### Flag সমূহের সারসংক্ষেপ

| Flag | কাজ | উদাহরণ |
|------|-----|---------|
| `-d` | Detached (background) | `docker run -d nginx` |
| `-p` | Port mapping | `-p 8080:80` |
| `-v` | Volume mount | `-v /data:/app/data` |
| `-e` | Environment variable | `-e ENV=production` |
| `--name` | Container নাম | `--name web-server` |
| `--rm` | Stop হলে auto-delete | `--rm` |
| `-it` | Interactive + TTY | `-it ubuntu bash` |

## Container ম্যানেজ করা

### Running Container দেখা

```bash
# চলন্ত container গুলো দেখো
docker ps

# সব container দেখো (stop হওয়া সহ)
docker ps -a
```

```
CONTAINER ID   IMAGE    STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx    Up 3 minutes   0.0.0.0:8080->80/tcp   my-nginx
f7e8d9c0b1a2   postgres Up 10 minutes  0.0.0.0:5432->5432/tcp my-postgres
```

### Stop / Start / Remove

```bash
# Container stop করো
docker stop my-nginx

# আবার start করো
docker start my-nginx

# Container delete করো (stop থাকতে হবে)
docker rm my-nginx

# Force remove (চলন্ত container ও)
docker rm -f my-nginx
```

> [!warn] rm vs stop
> `docker stop` শুধু container বন্ধ করে — আবার `start` দিলে চলবে। কিন্তু `docker rm` পুরো container delete করে দেয়। ভুল করে rm করে ফেললে আর ফিরে পাবে না।

## Image ম্যানেজ করা

```bash
# Local এ থাকা সব image দেখো
docker images

# Docker Hub থেকে image download করো
docker pull nginx:latest

# Local থেকে image delete করো
docker rmi nginx:latest

# নিজের image কে Docker Hub এ upload করো
docker push username/myapp:latest
```

> [!tip] Image tag
> `nginx:16` বা `nginx:latest` — এখানে `16` বা `latest` হলো tag। নির্দিষ্ট version ব্যবহার করাই ভালো, `latest` এড়িয়ে চলো — কারণ এটা সময়ের সাথে change হয়।

## docker exec — চলন্ত Container এ ঢোকা

চলন্ত container এর ভিতরে command চালাতে চাইলে `docker exec` ব্যবহার করো:

```bash
# চলন্ত container এ bash shell খোলো
docker exec -it my-nginx bash

# PostgreSQL এ SQL command চালাও
docker exec -it my-postgres psql -U postgres -c "SELECT version();"
```

> [!example] Debug করার সময়
> App এ কোনো সমস্যা হলে container এ ঢুকে দেখতে পারো। কোন file আছে কিনা, environment variable ঠিক আছে কিনা — সব check করা যায়।

## docker logs — Log দেখা

```bash
# পুরো log দেখো
docker logs my-nginx

# Real-time log follow করো
docker logs -f my-nginx

# শেষ 50 লাইন দেখো
docker logs --tail 50 my-nginx

# Timestamp সহ দেখো
docker logs -t my-nginx
```

## docker inspect — বিস্তারিত Info

```bash
docker inspect my-nginx
```

JSON format এ container এর সব details দেখায় — IP address, mount point, config, network — সবকিছু। নির্দিষ্ট info বের করতে:

```bash
# IP address বের করো
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-nginx
```

## Practical Examples

### Example ১: Nginx Web Server

```bash
docker run -d \
  --name web-server \
  -p 8080:80 \
  nginx:latest
```

Browser এ **localhost:8080** খোলো — Nginx এর default page দেখতে পাবে।

### Example ২: PostgreSQL Database

```bash
docker run -d \
  --name my-db \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secretpass \
  -e POSTGRES_DB=myapp \
  postgres:16
```

এখন `localhost:5432` এ PostgreSQL connect করা যাবে।

### Example ৩: Redis Cache

```bash
docker run -d \
  --name my-redis \
  -p 6379:6379 \
  redis:7-alpine

# Redis এ command চালাও
docker exec -it my-redis redis-cli ping
```

```
PONG
```

> [!danger] Data Loss Warning
> Volume ছাড়া container run করলে — container delete হলে ভেতরের সব data চলে যাবে। Database এর ক্ষেত্রে অবশ্যই volume mount করবে।

## সব একসাথে — Lifecycle

```
docker pull nginx    ← image download
       ↓
docker run -d --name web -p 8080:80 nginx    ← container চালু
       ↓
docker ps                                    ← চলছে কিনা দেখো
       ↓
docker logs web                               ← log দেখো
       ↓
docker exec -it web bash                      ← ভেতরে ঢোকো
       ↓
docker stop web                               ← বন্ধ করো
       ↓
docker rm web                                 ← delete করো
       ↓
docker rmi nginx                              ← image ও মুছে ফেলো
```

## Summary

Image হলো read-only blueprint, container হলো সেটার running instance। `docker run` দিয়ে container চালাও, `docker ps` দিয়ে দেখো, `docker stop/rm` দিয়ে ম্যানেজ করো। পরের chapter এ Dockerfile লিখতে শিখবো।