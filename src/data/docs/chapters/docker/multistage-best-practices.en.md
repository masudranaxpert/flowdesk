# Why Do We Need Multi-stage Builds?

Imagine you build a Docker image for a Go app. With the Go compiler, build tools, and source code all in the image, the final image ends up over 1 GB. But what actually runs is just a small binary — maybe 10 MB.

Multi-stage build is the solution to this problem — a single Dockerfile can have multiple stages. In the first stage (builder) you compile, then you copy only the final binary/dist to a small runtime image.

```text
[Builder Stage]          [Final Stage]
┌─────────────────┐      ┌──────────────────┐
│ Go compiler     │      │                  │
│ Source code     │ ───► │ Just the binary  │
│ Build tools     │ copy │ Alpine/distroless│
│ ~1 GB           │      │ ~20 MB           │
└─────────────────┘      └──────────────────┘
```

## A Go Multi-stage Example

```dockerfile
# syntax=docker/dockerfile:1.7

# --- Stage 1: Builder ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod first for caching
COPY go.mod go.sum ./
RUN go mod download

# Now copy source and build
COPY . .

RUN CGO_ENABLED=0 go build -o myapp -ldflags="-s -w" ./cmd/server

# --- Stage 2: Final minimal image ---
FROM alpine:3.20

# Copy only what's needed
COPY --from=builder /app/myapp /myapp

# Non-root user (security)
RUN adduser -D -h /home/appuser appuser
USER appuser

EXPOSE 8080
ENTRYPOINT ["/myapp"]
```

Notice — the final image has no Go compiler, no source code, just the binary and the Alpine base.

## Node.js Multi-stage

The same concept applies to Node — in the builder stage run `npm run build`, in the final stage keep only `dist/` and production dependencies:

```dockerfile
# syntax=docker/dockerfile:1.7

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine AS final

WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy build output
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Layer Caching — COPY Order Matters

Every instruction in a Dockerfile is a layer. Layers get cached — but if a layer changes, it and all layers after it get rebuilt.

> [!warn] Wrong order = slow build
> If you put `COPY . .` first and `RUN npm install` after, then every time your source code changes, `npm install` runs again — wasting several minutes.

**Wrong:**

```dockerfile
COPY . .
RUN npm ci        # Will run every time!
```

**Correct:**

```dockerfile
COPY package*.json ./
RUN npm ci        # Cache hit unless package.json changes
COPY . .
RUN npm run build
```

## BuildKit Cache Mounts

BuildKit (Docker's modern build engine) provides even more powerful caching — with `--mount=type=cache`, you can keep the package manager's cache separately:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app

# Keep npm cache outside — it'll be reused in the next build
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN --mount=type=cache,target=/root/.npm \
    npm run build
```

For Go:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    go build -o myapp ./cmd/server
```

> [!tip] Verify BuildKit is enabled
> Docker 23.0+ has BuildKit enabled by default. To make sure, set `DOCKER_BUILDKIT=1`. Adding the `# syntax=docker/dockerfile:1.7` line at the top gives you the latest BuildKit features.

## `.dockerignore` — What NOT to Copy

When writing `COPY . .`, it's best to keep unnecessary files out of the Docker context — the image gets bigger, builds get slower, and sensitive data can leak.

```
# .dockerignore

# Dependencies
node_modules/
vendor/

# Build output
dist/
build/
*.exe

# VCS
.git/
.gitignore

# Environment (secrets!)
.env
.env.local
*.pem
*.key

# IDE
.vscode/
.idea/

# Logs
*.log

# Docker
Dockerfile
docker-compose*.yml

# Docs
README.md
docs/
```

> [!warn] `.env` must never end up in the image
> If you don't add `.env` to `.dockerignore`, `COPY . .` will send your secret keys, database passwords — everything into the image. Anyone who pulls the image gets it all. This is a huge security risk.

## Practical — From 1 GB Image to 50 MB

```bash
# Single-stage (bad)
cat > Dockerfile.bad << 'EOF'
FROM golang:1.22
WORKDIR /app
COPY . .
RUN go build -o myapp ./cmd/server
CMD ["./myapp"]
EOF

docker build -f Dockerfile.bad -t myapp:bad .
docker images myapp:bad
# REPOSITORY   TAG   SIZE
# myapp        bad   850 MB

# Multi-stage (good)
cat > Dockerfile.good << 'EOF'
# syntax=docker/dockerfile:1.7
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o myapp -ldflags="-s -w" ./cmd/server

FROM alpine:3.20
COPY --from=builder /app/myapp /myapp
RUN adduser -D appuser && chown appuser /myapp
USER appuser
ENTRYPOINT ["/myapp"]
EOF

docker build -f Dockerfile.good -t myapp:good .
docker images myapp:good
# REPOSITORY   TAG    SIZE
# myapp        good   18 MB
```

> [!example] What does `-ldflags="-s -w"` do?
> It removes debug symbols and the symbol table from the Go binary — the binary becomes up to 30% smaller, and you don't need debug symbols in production anyway.

## Summary

Multi-stage builds let you compile in one stage and ship only the final artifact in a minimal runtime image — dramatically reducing image size. Proper COPY ordering maximizes layer caching. BuildKit cache mounts take caching even further by persisting package manager caches between builds. Always use `.dockerignore` to keep secrets and unnecessary files out of the image. These practices together can shrink images from gigabytes to megabytes.