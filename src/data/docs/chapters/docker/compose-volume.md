## Docker Compose কী

একটা real application এ সাধারণত একাধিক container লাগে — app server, database, cache, ইত্যাদি। প্রতিটাকে আলাদা `docker run` দিয়ে manage করা অসম্ভব। Docker Compose দিয়ে সব একটা `docker-compose.yml` file এ define করা যায়, আর একটা command এ সব চালু বা বন্ধ করা যায়।

```yaml
version: "3.9"

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
```

একটা `docker compose up` দিলেই দুটো container চালু হয়ে যাবে।

## docker-compose.yml এর Structure

### services — container গুলো

প্রতিটা container একটা `service`। এখানে image, build config, ports, environment সব define করা হয়।

```yaml
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secretpass
      POSTGRES_DB: myapp
```

### networks — container গুলোর communication

Default ভাবে একই compose file এর সব service একটা network এ থাকে। service নাম দিয়ে এক container থেকে আরেকটায় connect করা যায়।

```yaml
services:
  app:
    environment:
      - DATABASE_URL=postgresql://admin:secretpass@db:5432/myapp
```

লক্ষ্য করো — `db` নামটা hostname হিসেবে কাজ করছে। নিজে কোনো IP manage করতে হয় না।

```yaml
networks:
  frontend:
  backend:
```

| Concept | কী করে |
|---------|--------|
| `ports` | host আর container এর port map করে |
| `networks` | container গুলোকে আলাদা network এ রাখে |
| `depends_on` | start order নির্ধারণ করে |
| `environment` | env variable সেট করে |

## Volumes — ডেটা Persistent রাখা

Container এর ভেতরের ডেটা temporary। Container মুছে গেলে ভেতরের সব ডেটা ও মুছে যায়। Database এর ডেটা, user upload — এসব রক্ষা করতে **volume** লাগে।

### Named Volume

Docker নিজে manage করে কোথায় ডেটা থাকবে। তুমি শুধু নাম দাও।

```yaml
services:
  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Bind Mount

Host machine এর নির্দিষ্ট একটা directory সরাসরি container এর সাথে যুক্ত করা হয়। তুমি host এ ফাইল দেখতে পাবে।

```yaml
services:
  app:
    volumes:
      - ./src:/app/src
      - ./config:/app/config
```

| Feature | Named Volume | Bind Mount |
|---------|-------------|------------|
| কে manage করে | Docker | তুমি (host path) |
| Performance | ভালো | কিছু OS এ ধীর |
| Best for | Database | Development |
| Portability | সহজ | host path dependency |
| Production | উপযুক্ত | এড়ানো ভালো |

> [!tip] Database সবসময় named volume দাও
# PostgreSQL বা MySQL এর ডেটা কখনো bind mount এ রাখবে না। Named volume দিলে Docker permission আর performance নিজে ঠিক রাখে। ডেটা `docker compose down` করলেও থেকে যাবে।

> [!warn] Production এ bind mount এড়িয়ে চলো
# Bind mount host এর directory সরাসরি expose করে। Permission conflict, path dependency, security risk — সব আসে। Development এ live reload এর জন্য দারুণ, কিন্তু production এ named volume ব্যবহার করো।

## Practical — App + PostgreSQL + Redis

পুরো একটা stack দেখি:

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://admin:secretpass@db:5432/myapp
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=mysecret
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secretpass
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes

volumes:
  pgdata:
  redisdata:
```

এখানে তিনটা service আছে। App, database আর cache — সব একসাথে। `depends_on` এর `condition` দিয়ে নিশ্চিত করা হয়েছে যে app তখনই শুরু হবে যখন database healthy।

## প্রধান Commands

### up — সব চালু করা

```bash
# Foreground এ চালু (log দেখা যায়)
docker compose up

# Background এ চালু
docker compose up -d

# শুধু নির্দিষ্ট service rebuild করে চালু
docker compose up -d --build app
```

### down — সব বন্ধ করা

```bash
# Container বন্ধ আর মুছে ফেলা
docker compose down

# Volume সহ মুছে ফেলা (ডেটা যাবে!)
docker compose down -v
```

> [!danger] down -v সাবধানে
# `docker compose down -v` সব named volume মুছে ফেলে। Database এর পুরো ডেটা চিরতরে হারিয়ে যাবে। শুধু যখন সত্যিই পরিষ্কার শুরু করতে চাও, তখনই ব্যবহার করো।

### logs আর exec

```bash
# সব service এর live log
docker compose logs -f

# নির্দিষ্ট service এর log
docker compose logs -f app

# Container এর ভেতরে command চালানো
docker compose exec db psql -U admin -d myapp

# চলতে থাকা app এ shell
docker compose exec app sh
```

### আরও useful commands

```bash
# কোন service গুলো চলছে
docker compose ps

# কোন image গুলো ব্যবহার হচ্ছে
docker compose images

# একটা service আলাদাভাবে restart
docker compose restart app

# বাকি সব চালু রেখে একটা service এ one-off command
docker compose run --rm app python migrate.py
```

## Development Tips

Hot reload এর জন্য source code bind mount করো, আর app এর restart policy ঠিক রাখো:

```yaml
services:
  app:
    build: .
    volumes:
      - ./src:/app/src
    environment:
      - FLASK_DEBUG=1
    command: flask run --host=0.0.0.0 --port=5000 --reload
```

## Summary

Docker Compose দিয়ে multiple container এর app একটা file এ define করা যায়। Named volume persistent data এর জন্য, bind mount development এর জন্য। `up`, `down`, `logs`, `exec` — এই চারটা command দিয়ে প্রায় সব কাজ চলে। Production এ bind mount নয়, named volume ব্যবহার করো।