## Production Security — কেন গুরুত্বপূর্ণ?

Container মানেই secure নয়। ডিফল্ট Docker image-গুলো root হিসেবে চলে, অতিরিক্ত package থাকে, পুরোনো vulnerability থাকতে পারে। Production-এ কিছু নিয়ম মানতে হয় — চলো দেখি কী কী।

## ১. Non-root User — Root হিসেবে চালাবে না

ডিফল্টভাবে container-এ সবকিছু root হিসেবে চলে। কিন্তু যদি attacker container-এ ঢুকে যায়, তাহলে root access পেয়ে যাবে — ভয়াবহ। তাই একটা dedicated non-root user বানিয়ে তার অধীনে চালাও:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine

# একটা dedicated user বানাও
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --omit=dev
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
```

> [!danger] Root container = ঝুঁকি
# Root হিসেবে চললে attacker container break করে host-এ গেলেও root permission পেতে পারে। Non-root user ব্যবহার করা container security-র সবচেয়ে basic আর important নিয়ম।

## ২. Read-Only Filesystem

চাইলে container-এর পুরো filesystem read-only করে দেওয়া যায় — যাতে attacker কোনো file পরিবর্তন করতে না পারে:

```bash
docker run --read-only \
  --tmpfs /tmp \
  myapp:latest
```

`--tmpfs /tmp` দরকার কারণ অনেক app `/tmp`-তে লেখে — সেটা writable রাখতে হবে।

## ৩. Minimal / Distroless Base Image

যত কম package image-এ থাকবে, তত কম vulnerability। Distroless image-এ শুধু runtime থাকে — কোনো shell নেই, কোনো package manager নেই:

```dockerfile
# খারাপ: পুরো Ubuntu
FROM ubuntu:22.04

# ভালো: Alpine
FROM alpine:3.20

# সেরা: Distroless (Google)
FROM gcr.io/distroless/nodejs22-debian12

# অথবা Chainguard (modern alternative)
FROM cgr.dev/chainguard/node:latest
```

| Base Image | Size | Shell | Package Manager |
|---|---|---|---|
| `ubuntu:22.04` | ~75 MB | হ্যাঁ | হ্যাঁ |
| `alpine:3.20` | ~7 MB | হ্যাঁ | হ্যাঁ |
| `distroless` | ~20 MB | না | না |

> [!note] Distroless-এ shell নেই
# Distroless image-এ `docker exec -it container sh` কাজ করবে না — shell-ই নেই! Debugging-এর জন্য আলাদা debug variant আছে (যেমন `:debug` tag)। কিন্তু production-এ shell না থাকাই ভালো — attacker-এর জন্যও কঠিন।

## ৪. Image Scanning — `docker scout` আর `trivy`

Image-এ known vulnerability (CVE) আছে কি না সেটা automated tool দিয়ে চেক করো:

```bash
# Docker Scout (Daddy-র built-in, 2024+)
docker scout cves myapp:latest

# Trivy (open source, জনপ্রিয়)
trivy image myapp:latest

# শুধু HIGH আর CRITICAL vulnerability
trivy image --severity HIGH,CRITICAL myapp:latest

# CI-তে fail করাও যায়
trivy image --exit-code 1 --severity CRITICAL myapp:latest
```

CI/CD pipeline-এ scan করা অটোমেটিক যোগ করো — কোনো critical vulnerability থাকলে deploy আটকে যাবে।

## ৫. Secret Management — ENV-এ নয়!

Secret (database password, API key) **কখনো** Dockerfile-এ `ENV` দিয়ে রাখবে না — সেটা image-এ bake হয়ে যায়, যে কেউ image pull করলে দেখতে পাবে।

BuildKit-এর `--mount=type=secret` ব্যবহার করো:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder

# Secret শুধু build-এ দেখা যাবে, final image-এ থাকবে না
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
# Build করার সময় secret পাস করো
docker build --secret id=npmrc,src=$HOME/.npmrc .
```

Runtime secret-এর জন্য Docker Secrets, HashiCorp Vault, বা cloud-এর secret manager ব্যবহার করো।

## ৬. Resource Limits

Container যেন সব memory বা CPU না খেয়ে ফেলে:

```bash
docker run -d \
  --memory="512m" \
  --memory-swap="512m" \
  --cpus="1.0" \
  --pids-limit=100 \
  --restart=on-failure:3 \
  myapp:latest
```

Docker Compose-এ:

```yaml
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
```

## ৭. Signed Images — Cosign

Image-এর authenticity verify করতে signing ব্যবহার করো। Cosign (Sigstore project) এখন standard:

```bash
# Image sign করো
cosign sign --key cosign.key myregistry/myapp:latest

# Verify করো
cosign verify --key cosign.pub myregistry/myapp:latest
```

> [!tip] Cosign keyless signing
# Cosign-এ OIDC-ভিত্তিক keyless signing আছে — কোনো key manage করা ছাড়াই GitHub Actions-এ অটোমেটিক sign করা যায়। Production supply chain security-র জন্য এটাই modern উপায়।

## Practical — সম্পূর্ণ Secure Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7

# --- Builder ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Final ---
FROM gcr.io/distroless/nodejs22-debian12 AS final

WORKDIR /app

# Non-root user — distroless-এ `node` user আগে থেকেই আছে
COPY --chown=nonroot:nonroot --from=builder /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=builder /app/dist ./dist
COPY --chown=nonroot:nonroot package*.json ./

USER nonroot

EXPOSE 3000
CMD ["dist/index.js"]
```

```bash
# ১. Build
docker build -t myapp:secure .

# ২. Scan
trivy image --severity HIGH,CRITICAL myapp:secure

# ৩. চালাও — read-only filesystem সহ
docker run -d \
  --read-only \
  --tmpfs /tmp \
  --memory=512m \
  --cpus=1.0 \
  -p 3000:3000 \
  myapp:secure

# ৪. Non-root হিসেবে চলছে যাচাই
docker exec myapp-container id
# uid=65532(nonroot) gid=65532(nonroot)
```

> [!example] Production checklist
# এক নজরে যা যা করলাম: distroless base, non-root user, minimal layers, no secret in image, resource limits, image scanning, read-only filesystem। এই নিয়মগুলো মানলে তোমার image production-ready।