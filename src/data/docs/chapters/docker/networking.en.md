# Why Do We Need Docker Networking?

In Docker, containers run in isolation — by default, one container cannot talk to another. But real apps need multiple containers — like app + database + cache. Docker networking is what allows these containers to communicate with each other.

## The Three Default Networks

When you install Docker, three networks are created automatically:

| Network | What it does |
|---|---|
| **bridge** | The default. All containers start here. But containers can't find each other by name. |
| **host** | The container uses the host's network directly. No isolation. |
| **none** | No network at all. Completely isolated. |

```bash
docker network ls
```

```text
NETWORK ID     NAME      DRIVER    SCOPE
a1b2c3d4e5f6   bridge    bridge    local
b2c3d4e5f6a1   host      host      local
c3d4e5f6a1b2   none      null      local
```

## User-Defined Bridge — Where It Gets Fun

The default bridge has a big limitation — containers need to find each other by IP address, not by name. But with a **user-defined bridge**, you get DNS-based service discovery — meaning containers can find each other by container name!

```bash
# Create your own network
docker network create myapp-net

# Check it
docker network ls
```

Now add two containers to this network:

```bash
docker run -d --name redis --network myapp-net redis:7
docker run -d --name app --network myapp-net myapp:latest
```

Now from inside the `app` container, the name `redis` will resolve directly:

```bash
docker exec app ping redis    # it works!
```

> [!tip] Why use a user-defined bridge?
> On the default bridge, you can only connect via IP. On a user-defined bridge, containers can connect using container names (DNS resolution), which is much more production-friendly.

## Port Expose vs Publish

These two cause a lot of confusion — let's clear it up:

| Concept | What | Where |
|---|---|---|
| **EXPOSE** | Documentation in the Dockerfile — "my app listens on this port" | Dockerfile |
| **-p / --publish** | Maps a host port to a container port | `docker run` |

`EXPOSE` is just metadata — even if you set it, the outside world can't access it. To allow external access, you need `-p`:

```bash
# Host's 8080 → Container's 80
docker run -d -p 8080:80 nginx

# Host's 80 → Container's 80 (same port)
docker run -d -p 80:80 nginx

# Access from localhost only
docker run -d -p 127.0.0.1:8080:80 nginx

# Map multiple ports
docker run -d -p 3000:3000 -p 443:443 myapp
```

> [!warn] Expose and publish are not the same
> `EXPOSE` is just documentation — it doesn't actually open any port. To access from outside, you must use `-p` (publish).

## Container-to-Container Communication

Containers on the same user-defined network can talk directly to each other. No need to publish any port — the container's own port is enough:

```text
[app container] --myapp-net-- [redis container:6379]
```

From inside the `app` container, just write `redis:6379` and it will connect.

## Practical — App + Redis on a Custom Network

Say your app needs to talk to Redis. The full flow:

```bash
# 1. Create a custom network
docker network create app-net

# 2. Run Redis on that network
docker run -d \
  --name redis \
  --network app-net \
  redis:7-alpine

# 3. Run your app on that network
docker run -d \
  --name myapp \
  --network app-net \
  -p 3000:3000 \
  -e REDIS_URL=redis://redis:6379 \
  myapp:latest
```

Notice — the `REDIS_URL` is set to `redis://redis:6379`. Here `redis` is the container name, and Docker's DNS will automatically resolve it. No need to remember any IP address!

```bash
# Verify — ping redis from the app container
docker exec myapp ping -c 3 redis

# Inspect the network to see who's on it
docker network inspect app-net
```

## Networking in Docker Compose

Usually we use `docker compose`, and Compose automatically creates a default network — all services join it:

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

> [!example] In Compose, name = service name
> In Compose, containers find each other by service name. Here the `redis` service's name is `redis` — so `app` can directly connect to `redis:6379`. This is the default behavior in Compose v2.

## Summary

Docker containers run in isolation by default, but user-defined bridge networks enable DNS-based service discovery — containers find each other by name. `EXPOSE` is just documentation; `-p` (publish) is what actually makes ports accessible. In Docker Compose, services automatically communicate using service names as hostnames, so you never need to manage IP addresses manually.