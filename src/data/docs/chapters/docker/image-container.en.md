# Images and Containers

In the previous chapter, we learned what Docker is. Now let's understand the two most important concepts — **Images** and **Containers**. Without understanding these two, you can't do anything with Docker.

## Image vs Container — The Difference

Let's start with the simplest analogy.

```
Image                          Container
──────                         ──────────
┌──────────────┐              ┌──────────────┐
│   Blueprint   │  ──run──→   │  Running Bus  │
│  (recipe)     │             │  (live instance)│
└──────────────┘              └──────────────┘
   Static, read-only             Running, live

   From one image               Many containers
   many containers can be made   can run at the same time
```

| Image | Container |
|-------|-----------|
| Read-only template | Running instance of image |
| Blueprint / recipe | The dish made from that recipe |
| Stored on disk | Runs in memory |
| View with `docker images` | View with `docker ps` |

> [!note] In a nutshell
> Image is the class, container is the object — just like in OOP. You can create many objects from one class, similarly many containers from one image.

## Layer Architecture of an Image

A Docker image is not a single file — it's a collection of many **layers**. Each instruction (FROM, RUN, COPY, etc.) creates one layer.

```
┌─────────────────────────────┐
│  Layer 5: COPY app code     │  ← your app
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
> Each layer is cached. When you change your code, only the last layer gets rebuilt — everything else comes from cache. That's why Docker builds are so fast.

## docker run — The Most Important Command

`docker run` creates and starts a container from an image. It has many flags — let's look at all the important ones:

```bash
docker run [OPTIONS] IMAGE [COMMAND]
```

### Important Flags

```bash
# -d: run in background (detached mode)
docker run -d nginx

# -p: port mapping (host_port:container_port)
docker run -d -p 8080:80 nginx

# -v: volume mount (host_path:container_path)
docker run -d -v /my/data:/data nginx

# -e: environment variable
docker run -d -e POSTGRES_PASSWORD=secret postgres:16

# --name: give the container a name
docker run -d --name my-nginx nginx

# --rm: automatically delete when container stops
docker run --rm nginx
```

> [!example] All together now
> ```bash
> docker run -d \
>   --name my-postgres \
>   -p 5432:5432 \
>   -e POSTGRES_PASSWORD=mysecret \
>   -e POSTGRES_DB=myapp \
>   -v pgdata:/var/lib/postgresql/data \
>   postgres:16
> ```
> Here PostgreSQL starts — port 5432, password set, database name set, and a volume mounted to persist data.

### Flags Summary

| Flag | What it does | Example |
|------|------|---------|
| `-d` | Detached (background) | `docker run -d nginx` |
| `-p` | Port mapping | `-p 8080:80` |
| `-v` | Volume mount | `-v /data:/app/data` |
| `-e` | Environment variable | `-e ENV=production` |
| `--name` | Container name | `--name web-server` |
| `--rm` | Auto-delete on stop | `--rm` |
| `-it` | Interactive + TTY | `-it ubuntu bash` |

## Managing Containers

### Viewing Running Containers

```bash
# See running containers
docker ps

# See all containers (including stopped ones)
docker ps -a
```

```
CONTAINER ID   IMAGE    STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx    Up 3 minutes   0.0.0.0:8080->80/tcp   my-nginx
f7e8d9c0b1a2   postgres Up 10 minutes  0.0.0.0:5432->5432/tcp my-postgres
```

### Stop / Start / Remove

```bash
# Stop a container
docker stop my-nginx

# Start it again
docker start my-nginx

# Delete a container (must be stopped first)
docker rm my-nginx

# Force remove (even running containers)
docker rm -f my-nginx
```

> [!warn] rm vs stop
> `docker stop` just shuts down the container — you can `start` it again. But `docker rm` completely deletes the container. If you accidentally run rm, you can't get it back.

## Managing Images

```bash
# See all local images
docker images

# Download an image from Docker Hub
docker pull nginx:latest

# Remove an image from local storage
docker rmi nginx:latest

# Upload your own image to Docker Hub
docker push username/myapp:latest
```

> [!tip] Image tags
> `nginx:16` or `nginx:latest` — here `16` or `latest` is the tag. It's better to use a specific version and avoid `latest` — because it changes over time.

## docker exec — Entering a Running Container

To run commands inside a running container, use `docker exec`:

```bash
# Open a bash shell inside a running container
docker exec -it my-nginx bash

# Run an SQL command in PostgreSQL
docker exec -it my-postgres psql -U postgres -c "SELECT version();"
```

> [!example] When debugging
> If something goes wrong with your app, you can jump into the container and investigate. Check if files exist, verify environment variables — everything is inspectable.

## docker logs — Viewing Logs

```bash
# See all logs
docker logs my-nginx

# Follow logs in real-time
docker logs -f my-nginx

# Show the last 50 lines
docker logs --tail 50 my-nginx

# Show with timestamps
docker logs -t my-nginx
```

## docker inspect — Detailed Info

```bash
docker inspect my-nginx
```

Shows all details of the container in JSON format — IP address, mount points, config, network — everything. To extract specific info:

```bash
# Get the IP address
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-nginx
```

## Practical Examples

### Example 1: Nginx Web Server

```bash
docker run -d \
  --name web-server \
  -p 8080:80 \
  nginx:latest
```

Open **localhost:8080** in your browser — you'll see the Nginx default page.

### Example 2: PostgreSQL Database

```bash
docker run -d \
  --name my-db \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secretpass \
  -e POSTGRES_DB=myapp \
  postgres:16
```

Now you can connect to PostgreSQL at `localhost:5432`.

### Example 3: Redis Cache

```bash
docker run -d \
  --name my-redis \
  -p 6379:6379 \
  redis:7-alpine

# Run a command in Redis
docker exec -it my-redis redis-cli ping
```

```
PONG
```

> [!warn] Data Loss Warning
> If you run a container without a volume — when the container is deleted, all data inside it is gone. Always mount a volume for databases.

## Putting It All Together — The Lifecycle

```
docker pull nginx    ← download image
       ↓
docker run -d --name web -p 8080:80 nginx    ← start container
       ↓
docker ps                                    ← check if running
       ↓
docker logs web                               ← view logs
       ↓
docker exec -it web bash                      ← go inside
       ↓
docker stop web                               ← stop it
       ↓
docker rm web                                 ← delete it
       ↓
docker rmi nginx                              ← delete the image too
```

## Summary

An image is a read-only blueprint, a container is its running instance. Use `docker run` to start containers, `docker ps` to view them, `docker stop/rm` to manage them. In the next chapter, we'll learn how to write Dockerfiles.