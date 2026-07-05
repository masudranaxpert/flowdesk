# What is Docker and Why Use It

Imagine you built an app on your laptop — it needs Python 3.13, PostgreSQL 16, and Redis 7. Everything runs perfectly on your machine. But when you deploy it to a server, the Python version is different, dependencies are missing — nothing works. "But it worked on my machine!" — you'll hear this phrase a lot.

Docker solves exactly this problem. It packs your app and all its dependencies together into a single box — so it runs the exact same way on any machine.

## What is Docker?

Docker is a **containerization platform**. Simply put — it packages your application and all its dependencies (Python, libraries, configs) into an isolated environment, so it runs identically anywhere.

```
┌─────────────────────────────┐
│        Docker Container      │
│  ┌───────────────────────┐  │
│  │   Your App (code)     │  │
│  │   Python 3.13         │  │
│  │   pip packages        │  │
│  │   Config files        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
        ↓ Runs on any OS
   Windows / Mac / Linux / Cloud
```

> [!note] What is a Container
> A container is a lightweight, standalone, executable package — it has everything needed to run an app.

## Container vs Virtual Machine

Many people ask — Virtual Machines (VMs) do the same thing, so why do we need Docker? Let's look at the differences.

```
Virtual Machine (VM)              Docker Container
┌──────┐ ┌──────┐                ┌──────┐ ┌──────┐
│ App1 │ │ App2 │                │ App1 │ │ App2 │
│──────│ │──────│                │──────│ │──────│
│ Libs │ │ Libs │                │ Libs │ │ Libs │
│──────│ │──────│               │──────│ │──────│
│Guest │ │Guest │                │      Docker Engine      │
│  OS  │ │  OS  │                │       Host OS           │
└──────┘ └──────┘                └───────────────────────┘
    Hypervisor
    ──────────
      Host OS
      Hardware
```

| Aspect | Virtual Machine | Docker Container |
|-------|----------------|-----------------|
| Size | Measured in GB (includes OS) | Measured in MB |
| Startup | Takes minutes | Takes fractions of a second |
| Isolation | Full OS level | Process level |
| Resource usage | High | Low |
| Portability | Limited | Very high |

> [!tip] The real difference
> VMs need a separate OS for each instance — heavy and slow. Containers share the host OS — lightweight and fast.

## Why Use Docker?

### 1. Consistency — No More "Works on My Machine"

Your laptop, your teammate's PC, the production server — the exact same environment everywhere. No version differences, no missing dependencies.

### 2. Isolation — One App Won't Affect Another

You can run Python 3.11 and 3.13 at the same time — without any conflict. Each container lives in its own isolated world.

### 3. Portability — Runs Anywhere

Build once — and it runs on Windows, Mac, Linux, AWS, GCP, Azure — anywhere.

### 4. Fast Deployment — Starts in Seconds

A new container starts in just a few seconds. Need to scale up? You can launch more containers in an instant.

> [!example] Real scenario
> You have a Flask API that uses PostgreSQL and Redis. When a new developer joins the team — with Docker, one command sets everything up. No hassle of manually installing Python, Postgres, and Redis.

## Docker Engine Architecture

Let's look at the main components of Docker:

```
┌──────────────────────────────────────────┐
│              Docker Client                │
│         (docker CLI commands)             │
└──────────────┬───────────────────────────┘
               │ REST API
               ▼
┌──────────────────────────────────────────┐
│              Docker Daemon                │
│         (dockerd — the main engine)       │
│                                          │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  │
│  │ Images  │  │Container │  │Network │  │
│  │         │  │ runtime  │  │Volume  │  │
│  └─────────┘  └──────────┘  └────────┘  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│            Docker Registry               │
│     (Docker Hub / private registry)      │
│                                          │
│   nginx, postgres, redis, python...      │
└──────────────────────────────────────────┘
```

| Component | What it does |
|-----------|------|
| **Docker Client** | The `docker` command you type in the terminal |
| **Docker Daemon** | Runs in the background, does the actual work |
| **Docker Registry** | Where images are stored (Docker Hub is a public registry) |

> [!note] Client-Server Model
> Docker uses a client-server architecture. You type commands in the CLI → the client sends them to the daemon → the daemon does the work.

## Installing Docker

### Windows / macOS — Docker Desktop

1. Go to **docker.com/products/docker-desktop**
2. Download Docker Desktop
3. Run the installer
4. Open Docker Desktop — once it's running, you're ready

> [!warn] WSL 2 Backend
> On Windows, Docker Desktop requires **WSL 2** (Windows Subsystem for Linux) to be enabled. On Windows 10/11, having this makes Docker run much better.

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Verify Installation

```bash
docker --version
```

```
Docker version 27.5.0, build 4c91889
```

```bash
docker info
```

`docker info` shows a lot of details — how many containers are running, how many images exist, what the storage driver is — everything.

> [!tip] Linux permission error
> If you get a permission denied error when running the `docker` command on Linux, add yourself to the docker group: `sudo usermod -aG docker $USER`. Then log out and log back in.

## Your First Container — hello-world

To check if Docker is properly installed, here's the classic example:

```bash
docker run hello-world
```

```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb4...
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
```

What happened here? Let's look step by step:

```
1. docker run hello-world
       ↓
2. Checks if the image exists locally
       ↓ (nope)
3. Downloads (pulls) the image from Docker Hub
       ↓
4. Creates a container from that image
       ↓
5. Runs the container and shows the message
```

> [!note] Image and Container
> In this example, `hello-world` is the **image** — a template. And what ran is the **container** — a running instance created from the image. We'll learn more in the next chapter.

## Docker Hub — The World of Images

Docker Hub (hub.docker.com) is the public registry for images. There are thousands of ready-made images available:

```bash
# Run an nginx web server
docker run -d -p 8080:80 nginx

# Run a PostgreSQL database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16

# Python interactive shell
docker run -it python:3.13-slim python3
```

> [!tip] Any service in one command
> PostgreSQL, Redis, MongoDB — no need to install any of them. A single `docker run` command gets them running. When you're done, just delete them — no hassle.

## Summary

Docker is containerization — it packs your app and dependencies together so it can run anywhere. It's more lightweight and faster than VMs. In the next chapter, we'll dive deeper into images and containers.