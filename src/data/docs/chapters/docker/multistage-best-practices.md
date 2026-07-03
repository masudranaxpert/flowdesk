## Multi-stage Build কেন দরকার?

ধরো তুমি একটা Go app-এর Docker image বানালে। Go compiler, build tools, source code সব image-এ থাকলে final image ১ GB এর বেশি হয়ে যায়। কিন্তু আসলে যেটা চলবে সেটা একটা ছোট binary — হয়তো ১০ MB।

Multi-stage build হলো এই সমস্যার সমাধান — একটা Dockerfile-এ একাধিক stage থাকে। প্রথম stage (builder)-এ কম্পাইল করো, তারপর শুধু final binary/dist কপি করে নাও একটা ছোট runtime image-এ।

```text
[Builder Stage]          [Final Stage]
┌─────────────────┐      ┌──────────────────┐
│ Go compiler     │      │                  │
│ Source code     │ ───► │ শুধু binary      │
│ Build tools     │ copy │ Alpine/distroless│
│ ~1 GB           │      │ ~20 MB           │
└─────────────────┘      └──────────────────┘
```

## একটা Go Multi-stage উদাহরণ

```dockerfile
# syntax=docker/dockerfile:1.7

# --- Stage 1: Builder ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache-র জন্য go.mod আগে copy করো
COPY go.mod go.sum ./
RUN go mod download

# এবার source copy করো আর build করো
COPY . .

RUN CGO_ENABLED=0 go build -o myapp -ldflags="-s -w" ./cmd/server

# --- Stage 2: Final minimal image ---
FROM alpine:3.20

# শুধু যা দরকার তা কপি করো
COPY --from=builder /app/myapp /myapp

# Non-root user (security)
RUN adduser -D -h /home/appuser appuser
USER appuser

EXPOSE 8080
ENTRYPOINT ["/myapp"]
```

লক্ষ করো — final image-এ Go compiler নেই, source code নেই, শুধু binary আর Alpine base।

## Node.js Multi-stage

Node-এর জন্যও একই concept — builder stage-এ `npm run build` করো, final stage-এ শুধু `dist/` আর production dependencies রাখো:

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

# শুধু production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Build output কপি করো
COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Layer Caching — COPY Order গুরুত্বপূর্ণ

Dockerfile-এ প্রতিটা instruction এক একটা layer। Layer cache হয় — কিন্তু কোনো layer change হলে সে আর তার পরের সব layer rebuild হয়।

> [!warn] ভুল order = ধীর build
# যদি `COPY . .` আগে লেখো আর `RUN npm install` পরে লেখো, তাহলে source code একটু change হলেই `npm install` আবার চলবে — কয়েক মিনিট নষ্ট হবে।

**ভুল:**

```dockerfile
COPY . .
RUN npm ci        # প্রতিবার চলবে!
```

**সঠিক:**

```dockerfile
COPY package*.json ./
RUN npm ci        # package.json change না হলে cache hit
COPY . .
RUN npm run build
```

## BuildKit Cache Mounts

BuildKit (Docker-র modern build engine) আরও শক্তিশালী caching দেয় — `--mount=type=cache` দিয়ে package manager-এর cache আলাদাভাবে রাখা যায়:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app

# npm cache কে বাইরে রাখো — পরের build-এ reuse হবে
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN --mount=type=cache,target=/root/.npm \
    npm run build
```

Go-এর জন্য:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    go build -o myapp ./cmd/server
```

> [!tip] BuildKit চালু আছে কিনা যাচাই
# Docker 23.0+ তে BuildKit ডিফল্টভাবে চালু থাকে। নিশ্চিত করতে `DOCKER_BUILDKIT=1` দিতে পারো। `# syntax=docker/dockerfile:1.7` line-টা প্রথমে রাখলে সর্বশেষ BuildKit feature পাওয়া যায়।

## `.dockerignore` — কী কপি হবে না

`COPY . .` লেখার সময় Docker context-এ অপ্রয়োজনীয় file-গুলো না যাওয়াই ভালো — image বড় হয়, build ধীর হয়, গোপন data leak হতে পারে।

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

# Environment (গোপন!)
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

> [!danger] `.env` কখনো image-এ যাবে না
# `.dockerignore`-এ `.env` না রাখলে, `COPY . .` তোমার secret key, database password সব image-এ পাঠিয়ে দেবে। Image কেউ pull করলে সব পেয়ে যাবে। এটা বড় security risk।

## Practical — 1 GB Image থেকে 50 MB

```bash
# Single-stage (খারাপ)
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
# myapp        bad   850 MB    😱

# Multi-stage (ভালো)
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
# myapp        good   18 MB     🎉
```

> [!example] `-ldflags="-s -w"` কী করে?
# Go binary থেকে debug symbol আর symbol table সরিয়ে দেয় — binary ৩০% পর্যন্ত ছোট হয়, আর production-এ debug symbol দরকারই হয় না।