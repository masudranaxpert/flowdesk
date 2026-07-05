# What is a Dockerfile

A Dockerfile is a text file containing a set of instructions. Docker reads these instructions and builds an **image** from them. Think of it as a recipe — what ingredients are needed, how to cook them, everything written step by step.

Writing a Dockerfile means — you want your app to run the same way on any machine. OS, dependencies, config — everything gets packaged together into one image.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

## The Main Instructions

### FROM — base image

Every Dockerfile starts with `FROM`. It tells Docker which base image your image will be built on top of.

```dockerfile
FROM node:20-alpine
FROM python:3.12-slim
FROM ubuntu:24.04
```

> [!tip] Choose slim or alpine images
> The full `python:3.12` image is close to 1GB. But `python:3.12-slim` is only ~150MB. In production, smaller images pull faster and reduce the attack surface.

### RUN — execute commands

`RUN` lets you execute any shell command at build time — installing packages, creating files, compiling, etc.

```dockerfile
RUN apt-get update && apt-get install -y git curl
RUN pip install flask gunicorn
```

### COPY and ADD

`COPY` copies local files into the image. `ADD` does the same thing, but has some extra features — it can handle remote URLs and auto-extract `.tar` files.

```dockerfile
COPY requirements.txt .
COPY . /app
ADD https://example.com/data.tar.gz /tmp/
```

> [!note] Prefer COPY
> The hidden behaviors of `ADD` often cause confusion. Always use `COPY` for simple file copying — that's the best practice. Only use `ADD` when you need auto-extraction.

### WORKDIR — working directory

`WORKDIR` sets the directory where all subsequent commands will run.

```dockerfile
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
```

### CMD vs ENTRYPOINT

Both specify what command runs when the container starts. But there's a difference.

```dockerfile
# CMD — the entire command can be overridden
CMD ["python", "app.py"]

# ENTRYPOINT — only arguments can be added
ENTRYPOINT ["python"]
CMD ["app.py"]
```

| Feature | CMD | ENTRYPOINT |
|---------|-----|------------|
| Override | Easily overridden | needs `--entrypoint` to override |
| Use case | default command | fixed executable |
| Used with | alone | CMD for default args |

### ENV and ARG

`ENV` sets environment variables that exist during both build and runtime. `ARG` only exists during build, not at runtime.

```dockerfile
ARG PYTHON_VERSION=3.12
ENV APP_ENV=production
ENV PORT=5000
```

### EXPOSE — port hint

`EXPOSE` is just documentation — it doesn't actually open a port. It tells others that this container will listen on this port.

```dockerfile
EXPOSE 5000
```

## Layer Caching — The Trick to Faster Builds

Docker saves each instruction as a **layer**. If a layer hasn't changed, Docker doesn't rebuild it — it pulls from cache. You need to take advantage of this feature.

Bad example — every time code changes, all dependencies get reinstalled:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
```

Good example — requirements are copied separately, dependencies are installed first:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

> [!tip] Layers that change less go first
> Put files or commands that rarely change at the top. Put things that change often (like source code) at the bottom. This maximizes cache usage.

## Practical — Dockerfile for a Python Flask App

Let's look at a complete Dockerfile for a Flask app:

```dockerfile
FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create a non-root user
RUN useradd -m appuser

# Copy requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

## Multi-stage Build

Multi-stage builds are used to make large images smaller. Build in one stage, then copy only the result to another stage.

```dockerfile
# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The first stage has node_modules, source code — everything. But the final image only has the compiled output and nginx. Much smaller and cleaner.

## .dockerignore — What NOT to Copy

Just like `.git`, `.dockerignore` is a file. Whatever is listed in it will not be copied into the image.

```text
__pycache__
*.pyc
.git
.env
node_modules
.venv
Dockerfile
docker-compose.yml
```

> [!tip] Always create a .dockerignore
> If an `.env` file accidentally ends up in the image, your secrets will leak. The `.git` folder makes the image bigger. List all unnecessary files here.

> [!warn] Don't run as root
> By default, containers run as the root user. If an attacker breaks in somehow, they get root permissions. Always create a non-root user and switch to it using the `USER` instruction. This is critical in production.

## Building and Running

```bash
# Build the image
docker build -t my-flask-app .

# Run the container
docker run -p 5000:5000 my-flask-app

# Build with a tag
docker build -t my-flask-app:v1.0 .
```

## Summary

The main Dockerfile instructions are — `FROM`, `RUN`, `COPY`, `WORKDIR`, `CMD`, `ENV`, `EXPOSE`. For layer caching, put things that change less at the top. `.dockerignore` and non-root user — these two are mandatory in production. Multi-stage builds can drastically reduce image size.