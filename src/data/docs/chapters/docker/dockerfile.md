## Dockerfile কী

Dockerfile হলো একটা text file যেখানে কিছু instruction লেখা থাকে। এই instruction গুলো পড়ে Docker একটা **image** বানায়। মনে করো এটা একটা recipe — কী কী ingredient লাগবে, কীভাবে cook করতে হবে, সব step by step লেখা।

Dockerfile লেখার মানে হলো — তুমি চাচ্ছো তোমার app যেকোনো machine এ একইভাবে run করুক। OS, dependency, config — সব একসাথে package হয়ে যাবে একটা image এর ভেতরে।

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

## মূল Instruction গুলো

### FROM — base image

প্রতিটা Dockerfile এর শুরুতে `FROM` দিতে হয়। এটা বলে দেয় কোন base image এর উপরে তোমার image বানানো হবে।

```dockerfile
FROM node:20-alpine
FROM python:3.12-slim
FROM ubuntu:24.04
```

> [!tip] Slim বা Alpine image বেছে নাও
# `python:3.12` এর full image প্রায় 1GB এর কাছাকাছি। কিন্তু `python:3.12-slim` মাত্র ~150MB। Production এ ছোট image দ্রুত pull হয়, attack surface কমে।

### RUN — command execute

`RUN` দিয়ে build এর সময় যেকোনো shell command চালানো যায় — package install, file create, compile ইত্যাদি।

```dockerfile
RUN apt-get update && apt-get install -y git curl
RUN pip install flask gunicorn
```

### COPY আর ADD

`COPY` দিয়ে local file গুলো image এর ভেতরে কপি করা হয়। `ADD` ও একই কাজ করে, কিন্তু কিছু extra feature আছে — remote URL আর `.tar` file auto-extract করতে পারে।

```dockerfile
COPY requirements.txt .
COPY . /app
ADD https://example.com/data.tar.gz /tmp/
```

> [!note] COPY বেশি ব্যবহার করো
# `ADD` এর hidden behavior গুলো অনেক সময় confusion তৈরি করে। সাধারণ file copy এর জন্য সবসময় `COPY` ব্যবহার করাই best practice। শুধু যখন auto-extract দরকার, তখনই `ADD`।

### WORKDIR — working directory

`WORKDIR` সেট করে দেয় এর পরের সব command কোন directory তে run হবে।

```dockerfile
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
```

### CMD vs ENTRYPOINT

এই দুটোই container চলার সময় কোন command চলবে সেটা বলে। কিন্তু পার্থক্য আছে।

```dockerfile
# CMD — পুরো command override করা যায়
CMD ["python", "app.py"]

# ENTRYPOINT — শুধু argument যোগ করা যায়
ENTRYPOINT ["python"]
CMD ["app.py"]
```

| Feature | CMD | ENTRYPOINT |
|---------|-----|------------|
| Override | সহজে override হয় | override করতে `--entrypoint` লাগে |
| Use case | default command | fixed executable |
| সাথে ব্যবহার | একা | CMD দিয়ে default args |

### ENV আর ARG

`ENV` দিয়ে environment variable সেট করা হয় যা build আর runtime — দুই সময়েই থাকে। `ARG` শুধু build এর সময় থাকে, runtime এ থাকে না।

```dockerfile
ARG PYTHON_VERSION=3.12
ENV APP_ENV=production
ENV PORT=5000
```

### EXPOSE — port hint

`EXPOSE` শুধু documentation — এটা port আসলে open করে না। বলে দেয় এই container এই port এ listen করবে।

```dockerfile
EXPOSE 5000
```

## Layer Caching — Build দ্রুত করার কৌশল

Docker প্রতিটা instruction কে একটা **layer** হিসেবে save করে। যদি কোনো layer পরিবর্তন না হয়, Docker সেটা আবার build করে না — cache থেকে নিয়ে নেয়। এই feature কে কাজে লাগাতে হবে।

খারাপ উদাহরণ — প্রতিবার code change হলে সব dependency আবার install হবে:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
```

ভালো উদাহরণ — requirements আলাদা copy করে, dependency আগে install করা হয়েছে:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

> [!tip] পরিবর্তন কম যে layer আগে
# যে file বা কমান্ড কম বদলায়, সেটা উপরে রাখো। যেটা বেশি বদলায় (যেমন source code), সেটা নিচে। এতে cache সবচেয়ে বেশি কাজে লাগে।

## Practical — Python Flask App এর Dockerfile

পুরো একটা Flask app এর Dockerfile দেখি:

```dockerfile
FROM python:3.12-slim

# System dependency
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Non-root user তৈরি
RUN useradd -m appuser

# Requirements আগে copy
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source code copy
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

## Multi-stage Build

বড় image ছোট করার জন্য multi-stage build ব্যবহার হয়। একটা stage এ build করো, আরেকটা stage এ শুধু result copy করে নাও।

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

প্রথম stage এ node_modules, source code — সব আছে। কিন্তু final image তে শুধু compiled output আর nginx। অনেক ছোট আর পরিষ্কার।

## .dockerignore — কী Copy হবে না

`.git` এর মতোই `.dockerignore` একটা file। এতে যে গুলো লেখা থাকে, সেগুলো image এ copy হবে না।

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

> [!tip] অবশ্যই .dockerignore বানাও
# `.env` file accidentally image এ চলে গেলে secret leak হয়ে যাবে। `.git` folder image বড় করে দেয়। সব unnecessary file এখানে লিখে দাও।

> [!danger] Root হিসেবে run করবে না
# Default ভাবে container root user এ run হয়। যদি attacker কোনো ভাবে break করে, root permission পেয়ে যাবে। সবসময় একটা non-root user তৈরি করে `USER` instruction দিয়ে switch করো। Production এ এটা critical।

## Build আর Run করা

```bash
# Image build করা
docker build -t my-flask-app .

# Container run করা
docker run -p 5000:5000 my-flask-app

# Tag সহ build
docker build -t my-flask-app:v1.0 .
```

## Summary

Dockerfile এর মূল instruction গুলো হলো — `FROM`, `RUN`, `COPY`, `WORKDIR`, `CMD`, `ENV`, `EXPOSE`। Layer caching এর জন্য যেটা কম বদলায় সেটা উপরে রাখো। `.dockerignore` আর non-root user — এই দুটো production এ বাধ্যতামূলক। Multi-stage build দিয়ে image size অনেক কমানো যায়।