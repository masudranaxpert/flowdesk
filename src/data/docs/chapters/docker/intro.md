# Docker কী ও কেন ব্যবহার

তুমি তোমার ল্যাপটপে একটা app বানালে — সেখানে Python 3.13, PostgreSQL 16, Redis 7 লাগে। তোমার কম্পিউটারে ঠিকঠাক চলছে। কিন্তু server এ deploy করতে গেলে দেখলে Python version আলাদা, dependency মিসিং — কিছুই কাজ করছে না। "আমার মেশিনে তো চলছিল!" — এই কথাটা শুনতেই পাবে।

Docker ঠিক এই সমস্যার সমাধান করে। তোমার app আর সব dependency একসাথে একটা box এ pack করে দেয় — সেটা যেকোনো মেশিনে একইভাবে চলবে।

## Docker কী?

Docker হলো একটা **containerization platform**। সহজ কথায় — তোমার application আর সব dependency (Python, library, config) কে একটা isolated environment এ pack করে দেয়, যাতে সেটা যেকোনো জায়গায় একইভাবে চলে।

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
        ↓ যেকোনো OS এ চলবে
   Windows / Mac / Linux / Cloud
```

> [!note] Container কী
> Container হলো একটা lightweight, standalone, executable package — যাতে app চালানোর জন্য যা যা লাগে সব আছে।

## Container vs Virtual Machine

অনেকেই প্রশ্ন করে — Virtual Machine (VM) তো একই কাজ করে, তাহলে Docker দরকার কী? চলো পার্থক্য দেখি।

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

| বিষয় | Virtual Machine | Docker Container |
|-------|----------------|-----------------|
| Size | GB এ হয় (OS সহ) | MB এ হয় |
| Startup | মিনিট লাগে | সেকেন্ডের ভাগে |
| Isolation | পুরো OS level | Process level |
| Resource | বেশি খায় | কম খায় |
| Portability | কম | অনেক বেশি |

> [!tip] আসল পার্থক্য
> VM এ প্রতিটার জন্য আলাদা OS লাগে — ভারী আর ধীর। Container এ host OS share করে — হালকা আর দ্রুত।

## Docker কেন ব্যবহার করবে?

### ১. Consistency — "Works on my machine" সমস্যা শেষ

তোমার laptop, teammate এর PC, production server — সব জায়গায় exact একই environment। Version difference, missing dependency — কিছুই নেই।

### ২. Isolation — এক app আরেকটার উপর প্রভাব ফেলবে না

Python 3.11 আর 3.13 দুটোই একসাথে চালাতে পারবে — কোনো conflict ছাড়া। প্রতিটা container নিজের জগতে isolated।

### ৩. Portability — যেকোনো জায়গায় চলবে

build একবার করলে — Windows, Mac, Linux, AWS, GCP, Azure — যেকোনো জায়গায় run করবে।

### ৪. Fast Deployment — সেকেন্ডে চালু

নতুন container চালু হতে মাত্র কয়েক সেকেন্ড। scale up করতে চাইলে নিমিষে আরও container চালু করে ফেলা যায়।

> [!example] Real scenario
> তোমার একটা Flask API আছে যেটা PostgreSQL আর Redis use করে। নতুন developer টিমে join করলে — Docker থাকলে এক command এ সব setup হয়ে যাবে। manually Python, Postgres, Redis install করার ঝামেলা নেই।

## Docker Engine Architecture

Docker এর মূল component গুলো দেখি:

```
┌──────────────────────────────────────────┐
│              Docker Client                │
│         (docker CLI commands)             │
└──────────────┬───────────────────────────┘
               │ REST API
               ▼
┌──────────────────────────────────────────┐
│              Docker Daemon                │
│         (dockerd — মূল engine)            │
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

| Component | কাজ |
|-----------|-----|
| **Docker Client** | `docker` command যেটা তুমি terminal এ লেখো |
| **Docker Daemon** | background এ চলে, আসল কাজ এটাই করে |
| **Docker Registry** | image store করার জায়গা (Docker Hub হলো public registry) |

> [!note] Client-Server Model
> Docker একটা client-server architecture। তুমি CLI তে command লেখো → client সেটা daemon কে পাঠায় → daemon কাজটা করে।

## Docker ইনস্টল করা

### Windows / macOS — Docker Desktop

১. **docker.com/products/docker-desktop** এ যাও
২. Docker Desktop download করো
৩. Installer run করো
৪. Docker Desktop খোলো — এটা চালু হলেই তৈরি

> [!warn] WSL 2 Backend
> Windows এ Docker Desktop install করলে **WSL 2** (Windows Subsystem for Linux) enable করা থাকতে হবে। Windows 10/11 এ এটা থাকলে Docker অনেক ভালো চলে।

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

`docker info` দিলে অনেক details দেখায় — কতগুলো container চলছে, কত image আছে, storage driver কী — সব।

> [!tip] Linux এ permission error
> Linux এ `docker` command চালাতে permission denied এলে নিজেকে docker group এ যোগ করো: `sudo usermod -aG docker $USER`। তারপর logout/login করো।

## প্রথম Container — hello-world

Docker ঠিকমতো install হয়েছে কিনা check করতে একদম classic উদাহরণ:

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

কী হলো এখানে? ধাপে ধাপে দেখি:

```
1. docker run hello-world
       ↓
2. Local এ image আছে কিনা check করে
       ↓ (নেই)
3. Docker Hub থেকে image download (pull) করে
       ↓
4. সেই image থেকে container বানায়
       ↓
5. Container run করে message দেখায়
```

> [!note] Image আর Container
> এই example এ `hello-world` হলো **image** — একটা template। আর যেটা চলল সেটা হলো **container** — image থেকে তৈরি একটা running instance। পরের chapter এ বিস্তারিত শিখবো।

## Docker Hub — Image এর দুনিয়া

Docker Hub (hub.docker.com) হলো image এর public registry। এখানে হাজার হাজার ready-made image আছে:

```bash
# nginx web server চালাও
docker run -d -p 8080:80 nginx

# PostgreSQL database চালাও
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16

# Python interactive shell
docker run -it python:3.13-slim python3
```

> [!tip] এক কমান্ডে যেকোনো service
> PostgreSQL, Redis, MongoDB — সব install করার দরকার নেই। একটা `docker run` command এ চালু হয়ে যায়। শেষ হলে delete করে দাও, কোনো ঝামেলা নেই।

## Summary

Docker হলো containerization — app আর dependency একসাথে pack করে যেকোনো জায়গায় চালানো যায়। VM এর চেয়ে lightweight আর fast। পরের chapter এ image আর container নিয়ে বিস্তারিত শিখবো।