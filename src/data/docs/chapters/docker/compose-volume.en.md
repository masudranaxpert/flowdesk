# What is Docker Compose

A real application usually needs multiple containers — app server, database, cache, etc. Managing each one with a separate `docker run` command is impossible. Docker Compose lets you define everything in a single `docker-compose.yml` file, and start or stop everything with one command.

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

One `docker compose up` command and both containers start running.

## Structure of docker-compose.yml

### services — the containers

Each container is a `service`. Here you define the image, build config, ports, environment — everything.

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

### networks — container communication

By default, all services in the same compose file are on one network. You can connect from one container to another using the service name.

```yaml
services:
  app:
    environment:
      - DATABASE_URL=postgresql://admin:secretpass@db:5432/myapp
```

Notice — the name `db` works as the hostname. You don't need to manage any IPs yourself.

```yaml
networks:
  frontend:
  backend:
```

| Concept | What it does |
|---------|------|
| `ports` | Maps ports between host and container |
| `networks` | Puts containers on separate networks |
| `depends_on` | Determines startup order |
| `environment` | Sets environment variables |

## Volumes — Keeping Data Persistent

Data inside a container is temporary. When the container is deleted, all data inside it is gone too. To protect database data, user uploads, etc., you need **volumes**.

### Named Volume

Docker manages where the data is stored. You just give it a name.

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

A specific directory on the host machine is directly linked to the container. You can see the files on the host.

```yaml
services:
  app:
    volumes:
      - ./src:/app/src
      - ./config:/app/config
```

| Feature | Named Volume | Bind Mount |
|---------|-------------|------------|
| Who manages it | Docker | You (host path) |
| Performance | Good | Slow on some OS |
| Best for | Database | Development |
| Portability | Easy | Host path dependency |
| Production | Suitable | Best to avoid |

> [!tip] Always use named volumes for databases
> Never store PostgreSQL or MySQL data on a bind mount. With a named volume, Docker handles permissions and performance itself. The data survives even after `docker compose down`.

> [!warn] Avoid bind mounts in production
> Bind mounts directly expose host directories. Permission conflicts, path dependencies, security risks — they all come along. Great for live reload during development, but use named volumes in production.

## Practical — App + PostgreSQL + Redis

Let's look at a complete stack:

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

Here we have three services. App, database, and cache — all together. The `condition` in `depends_on` ensures the app only starts when the database is healthy.

## Main Commands

### up — Start Everything

```bash
# Start in foreground (you can see logs)
docker compose up

# Start in background
docker compose up -d

# Rebuild only a specific service and start
docker compose up -d --build app
```

### down — Stop Everything

```bash
# Stop and remove containers
docker compose down

# Remove including volumes (data will be lost!)
docker compose down -v
```

> [!warn] Be careful with down -v
> `docker compose down -v` deletes all named volumes. All database data will be permanently lost. Only use it when you truly want a clean start.

### logs and exec

```bash
# Live logs for all services
docker compose logs -f

# Logs for a specific service
docker compose logs -f app

# Run a command inside a container
docker compose exec db psql -U admin -d myapp

# Get a shell inside a running app
docker compose exec app sh
```

### More Useful Commands

```bash
# See which services are running
docker compose ps

# See which images are being used
docker compose compose images

# Restart a single service
docker compose restart app

# Run a one-off command in a service
docker compose run --rm app python migrate.py
```

## Development Tips

For hot reload, bind mount your source code and set the right restart policy:

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

Docker Compose lets you define multi-container applications in a single file. Named volumes for persistent data, bind mounts for development. `up`, `down`, `logs`, `exec` — these four commands handle almost everything. In production, use named volumes instead of bind mounts.