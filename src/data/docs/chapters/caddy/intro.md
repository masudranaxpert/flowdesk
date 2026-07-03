# Caddy কী ও ইনস্টল

তুমি যদি কোনো website বা web app deploy করে থাকো, তাহলে একটা **web server** লাগবেই। এতদিন nginx আর Apache ছিলো রাজা। কিন্তু ২০২৬ সালে এসে **Caddy** অনেক জনপ্রিয় হয়ে উঠেছে — কারণ এটা সহজ, দ্রুত, আর সবচেয়ে বড় কথা **automatic HTTPS** দেয়। এই chapter এ আমরা Caddy এর সাথে পরিচিত হবো।

## Caddy কী?

Caddy হলো একটা **modern web server** যেটা Go language এ লেখা। এটা ২০১৫ সালে প্রথম release হয়েছিল, আর এখন version 2.x এ আছে। Caddy এর সবচেয়ে বড় strength হলো — এটা **নিজে থেকেই** HTTPS certificate manage করে। তোমাকে কিছুই করতে হবে না।

```text
    User (browser)
         ↓ HTTPS
    ┌─────────┐
    │  Caddy   │  ← automatic TLS certificate
    │  Server  │  ← reverse proxy
    └────┬─────┘
         ↓
   Your App (Python/Node)
```

> [!note]
> Caddy এর নামটা এসেছে golf এর "caddie" থেকে — যে খেলোয়াড়কে সাহায্য করে। Caddy ও তোমাকে web serving এ সাহায্য করে, তাই এই নাম।

## Caddy কেন ব্যবহার করবে?

প্রশ্ন হতে পারে — nginx তো আছে, তাহলে Caddy কেন? চলো দেখি কারণ গুলো:

| Feature | nginx | Apache | **Caddy** |
|---------|-------|--------|-----------|
| Automatic HTTPS | ❌ (manual) | ❌ (manual) | ✅ নিজে থেকে |
| Config format | Complex | Complex | একদম সহজ |
| Default secure | No | No | Yes |
| Performance | দ্রুত | মোটামুটি | দ্রুত |
| Reverse proxy | Manual | Manual | Built-in |
| Single binary | No | No | ✅ একটাই file |

> [!tip]
> nginx এ HTTPS সেট আপ করতে গেলে certbot ইনস্টল করতে হয়, certificate generate করতে হয়, cron job সেট করতে হয় renewal এর জন্য। Caddy তে এসব একদমই করতে হয় না — শুধু domain দিলেই হয়।

## Caddy এর Main Feature গুলো

১. **Automatic HTTPS** — Let's Encrypt আর ZeroSSL থেকে certificate নিজে নেয়, renew করে, HTTP কে HTTPS এ redirect করে।
২. **Simple Configuration** — Caddyfile নামে একটা সহজ text file। nginx config এর চেয়ে অনেক সহজ।
৩. **Reverse Proxy** — Built-in। Python/Node backend কে proxy করা যায়।
৪. **Static File Server** — এক লাইনে যেকোনো folder serve করা যায়।
৫. **Single Binary** — পুরো Caddy একটাই executable file। কোনো dependency নেই।
৬. **HTTP/3 Support** — ডিফল্টভাবে চালু থাকে।

## nginx vs Caddy — Config Comparison

ব্যাপারটা একটু বাস্তব example দিয়ে দেখি। একটা domain কে reverse proxy করতে হবে।

**nginx config:**

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Caddy config:**

```text
example.com {
    reverse_proxy localhost:3000
}
```

স্পষ্ট পার্থক্য, তাই না? Caddy তে মাত্র ৩ লাইন! HTTPS, redirect, certificate — সব নিজে থেকে হয়ে যাচ্ছে।

> [!example]
> একজন developer যেটা করতে nginx এ ২০+ লাইন আর ঘণ্টা খানিক সময় লাগায়, Caddy তে সেটা ৩ লাইনে আর কয়েক সেকেন্ডে হয়ে যায়। এটাই Caddy এর সবচেয়ে বড় আকর্ষণ।

## Caddy ইনস্টল করা

Caddy install করার কয়েকটা উপায় আছে।

### Method ১: apt (Ubuntu/Debian)

সবচেয়ে recommended উপায় production এর জন্য।

```bash
# official repository যোগ করো
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# install করো
sudo apt update
sudo apt install caddy
```

### Method ২: Binary Download

পুরো Caddy একটাই binary file। শুধু download করে রাখলেই হয়।

```bash
# latest version download করো
curl -L "https://github.com/caddyserver/caddy/releases/latest/download/CMETRIC" -o caddy.tar.gz

# extract করো
tar xzf caddy.tar.gz

# binary কে PATH এ রাখো
sudo mv caddy /usr/local/bin/

# verify করো
caddy version
```

### Method ৩: Docker

Docker দিয়ে চালানো সবচেয়ে সহজ।

```bash
# simplest way
docker run -d --name caddy \
    -p 80:80 -p 443:443 \
    -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
    -v $PWD/site:/srv \
    caddy:2
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./site:/srv
      - caddy_data:/data
    restart: unless-stopped

volumes:
  caddy_data:
```

> [!tip]
> Docker দিয়ে চালালে data persist করার জন্য `/data` আর `/config` volume mount করতে ভুলবে না। নাহলে container restart হলে certificate গুলো হারিয়ে যাবে, আবার নতুন করে provision হতে হবে।

### Install Verify

```bash
caddy version
```

```
v2.8.4 h1:q3pe0wpBj1Oc7C25... 
```

## First Caddyfile

**Caddyfile** হলো Caddy এর configuration file। এটা একটা সাধারণ text file, কিন্তু খুব intuitive syntax আছে।

প্রথমে একটা basic Caddyfile লিখি:

```text
:8080 {
    respond "Hello, Caddy! স্বাগতম!"
}
```

এই file কে `Caddyfile` নামে save করো। তারপর চালাও:

```bash
caddy run
```

এখন browser এ `http://localhost:8080` খুললে message টা দেখতে পাবে।

> [!note]
> Caddyfile এর প্রথম লাইনকে **site address** বলে। `:8080` মানে localhost এর 8080 port এ listen করবে। যদি domain দাও (যেমন `example.com`), তাহলে Caddy automatic HTTPS চালু করবে।

## caddy Command গুলো

Caddy চালানোর কিছু main command:

```bash
# foreground এ চালাও (development এর জন্য)
caddy run

# background এ চালাও (production এর জন্য)
caddy start

# থামাও
caddy stop

# Caddyfile validate করো
caddy validate --config Caddyfile

# Caddyfile কে JSON এ format করো
caddy adapt --config Caddyfile

# reload করো (restart ছাড়া)
caddy reload --config Caddyfile
```

| Command | কাজ |
|---------|-----|
| `caddy run` | Foreground এ চালায়, log দেখায় |
| `caddy start` | Background এ চালায় |
| `caddy stop` | চলমান Caddy কে থামায় |
| `caddy reload` | Config change করলে live reload করে |
| `caddy validate` | Caddyfile এ error আছে কিনা চেক করে |

> [!warn]
> `caddy run` দিলে terminal বন্ধ করলে Caddy ও থেমে যাবে। Production এ `caddy start` দাও বা systemd service ব্যবহার করো। apt দিয়ে install করলে systemd service automatic সেট হয়ে যায়।

## Static Folder Serve করা

সবচেয়ে common use case — একটা folder এর static file (HTML, CSS, JS, image) serve করা।

ধরো `./site` folder এ তোমার website এর file গুলো আছে:

```text
site/
├── index.html
├── about.html
├── style.css
└── images/
    └── logo.png
```

Caddyfile লেখো:

```text
:8080 {
    root * /site
    file_server
}
```

এখন `caddy run` করলে `http://localhost:8080` এ তোমার website চলবে।

```bash
caddy run
```

> [!example]
> তুমি একটা React বা Next.js app build করেছো। `npm run build` দিলে `dist` বা `out` folder এ static file গুলো আসে। সেই folder কে Caddy দিয়ে serve করলেই production ready site! কোনো complex setup লাগে না।

## Caddy 2.x Architecture

Caddy 2.x এর architecture টা একটু বুঝে নিই:

```text
  Caddy Process
  ┌──────────────────────────────────────┐
  │  Admin API (localhost:2019)          │
  │  ┌────────────────────────────────┐  │
  │  │  Config (JSON / Caddyfile)     │  │
  │  └────────────────────────────────┘  │
  │  ┌────────────────────────────────┐  │
  │  │  Servers                        │  │
  │  │  ├── HTTP server (port 80)     │  │
  │  │  ├── HTTPS server (port 443)   │  │
  │  │  └── Handlers (proxy/static)   │  │
  │  └────────────────────────────────┘  │
  │  ┌────────────────────────────────┐  │
  │  │  Storage (cert, data)          │  │
  │  └────────────────────────────────┘  │
  └──────────────────────────────────────┘
```

মূল বিষয় গুলো:
- **Admin API** — localhost:2019 port এ চলে, JSON config manage করে
- **Caddyfile** — human-readable config, ভেতরে JSON এ convert হয়
- **Handler chain** — প্রতিটা request কে ধাপে ধাপে process করা হয়

> [!note]
> Caddy ভেতরে ভেতরে JSON config ব্যবহার করে। Caddyfile হলো শুধু একটা user-friendly format। `caddy adapt` দিলে দেখতে পাবে Caddyfile টা JSON এ convert হওয়ার পর কেমন দেখায়। Advanced use case এ সরাসরি JSON ও দেওয়া যায়।

## Production Service (systemd)

apt দিয়ে install করলে Caddy systemd service হিসেবে চলে।

```bash
# status দেখো
sudo systemctl status caddy

# চালু করো
sudo systemctl start caddy

# boot এ চালু থাকবে
sudo systemctl enable caddy

# restart করো
sudo systemctl restart caddy
```

Default Caddyfile location: `/etc/caddy/Caddyfile`

> [!tip]
> Production এ সবসময় systemd service ব্যবহার করো। এতে server reboot হলে Caddy নিজে থেকেই চালু হবে। আর crash হলে automatic restart হবে।

## Summary

Caddy হলো modern, fast আর simple web server। Automatic HTTPS, সহজ Caddyfile, single binary — এগুলোই এর মূল আকর্ষণ। nginx এর complex config এর বদলে Caddy তে ৩ লাইনে কাজ হয়ে যায়। পরের chapter এ static file serving আর reverse proxy detail এ দেখবো।