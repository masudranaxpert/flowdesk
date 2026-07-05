# Production Security — Why It Matters

Containers are not automatically secure. Default Docker images run as root, contain extra packages, and may have known vulnerabilities. In production, you need to follow certain rules — let's see what they are.

## 1. Non-root User — Don't Run as Root

By default, everything inside a container runs as root. But if an attacker gets into the container, they get root access — that's dangerous. So create a dedicated non-root user and run the app under it:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine

# Create a dedicated user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --omit=dev
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 3000
CMD ["node", "server.js"]
```

> [!warn] Root container = risk
> Running as root means if an attacker breaks out of the container and reaches the host, they get root permissions. Using a non-root user is the most basic and important rule of container security.

## 2. Read-Only Filesystem

You can make the entire container filesystem read-only — so an attacker can't modify any files:

```bash
docker run --read-only \
  --tmpfs /tmp \
  myapp:latest
```

`--tmpfs /tmp` is needed because many apps write to `/tmp` — that needs to stay writable.

## 3. Minimal / Distroless Base Image

The fewer packages in the image, the fewer vulnerabilities. Distroless images contain only the runtime — no shell, no package manager:

```dockerfile
# Bad: Full Ubuntu
FROM ubuntu:22.04

# Good: Alpine
FROM alpine:3.20

# Best: Distroless (Google)
FROM gcr.io/distroless/nodejs22-debian12

# Or Chainguard (modern alternative)
FROM cgr.dev/chainguard/node:latest
```

| Base Image | Size | Shell | Package Manager |
|---|---|---|---|
| `ubuntu:22.04` | ~75 MB | Yes | Yes |
| `alpine:3.20` | ~7 MB | Yes | Yes |
| `distroless` | ~20 MB | No | No |

> [!note] Distroless has no shell
> With a distroless image, `docker exec -it container sh` won't work — there's no shell! There's a separate debug variant for debugging (like the `:debug` tag). But in production, not having a shell is better — it's harder for attackers too.

## 4. Image Scanning — `docker scout` and `trivy`

Check whether your image has known vulnerabilities (CVEs) using automated tools:

```bash
# Docker Scout (Docker's built-in, 2024+)
docker scout cves myapp:latest

# Trivy (open source, popular)
trivy image myapp:latest

# Only HIGH and CRITICAL vulnerabilities
trivy image --severity HIGH,CRITICAL myapp:latest

# Make it fail in CI
trivy image --exit-code 1 --severity CRITICAL myapp:latest
```

Add scanning to your CI/CD pipeline automatically — if there's a critical vulnerability, the deployment will be blocked.

## 5. Secret Management — Not in ENV!

Secrets (database passwords, API keys) should **never** be stored in a Dockerfile using `ENV` — they get baked into the image, and anyone who pulls the image can see them.

Use BuildKit's `--mount=type=secret`:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder

# Secret is only visible during build, not in the final image
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
# Pass the secret during build
docker build --secret id=npmrc,src=$HOME/.npmrc .
```

For runtime secrets, use Docker Secrets, HashiCorp Vault, or your cloud provider's secret manager.

## 6. Resource Limits

Make sure a container doesn't consume all memory or CPU:

```bash
docker run -d \
  --memory="512m" \
  --memory-swap="512m" \
  --cpus="1.0" \
  --pids-limit=100 \
  --restart=on-failure:3 \
  myapp:latest
```

In Docker Compose:

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

## 7. Signed Images — Cosign

Use signing to verify image authenticity. Cosign (from the Sigstore project) is now the standard:

```bash
# Sign the image
cosign sign --key cosign.key myregistry/myapp:latest

# Verify it
cosign verify --key cosign.pub myregistry/myapp:latest
```

> [!tip] Cosign keyless signing
> Cosign supports OIDC-based keyless signing — you can automatically sign images in GitHub Actions without managing any keys. This is the modern way to handle supply chain security in production.

## Practical — A Fully Secure Dockerfile

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

# Non-root user — distroless already has a `node` user
COPY --chown=nonroot:nonroot --from=builder /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=builder /app/dist ./dist
COPY --chown=nonroot:nonroot package*.json ./

USER nonroot

EXPOSE 3000
CMD ["dist/index.js"]
```

```bash
# 1. Build
docker build -t myapp:secure .

# 2. Scan
trivy image --severity HIGH,CRITICAL myapp:secure

# 3. Run — with read-only filesystem
docker run -d \
  --read-only \
  --tmpfs /tmp \
  --memory=512m \
  --cpus=1.0 \
  -p 3000:3000 \
  myapp:secure

# 4. Verify it's running as non-root
docker exec myapp-container id
# uid=65532(nonroot) gid=65532(nonroot)
```

> [!example] Production checklist
> Here's what we did at a glance: distroless base, non-root user, minimal layers, no secrets in image, resource limits, image scanning, read-only filesystem. Follow these rules and your image is production-ready.

## Summary

Container security is not optional in production — it's mandatory. Always run as a non-root user, use minimal or distroless base images, scan for vulnerabilities in CI, never bake secrets into images, set resource limits, and consider read-only filesystems and image signing. Following these practices makes your Docker images significantly harder to attack and safer to run in production.