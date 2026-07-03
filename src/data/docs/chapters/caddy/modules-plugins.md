## Caddy Modular Architecture

Caddy-র পুরো architecture-টাই modular — মানে Caddy-র প্রতিটা feature আসলে এক একটা "module"। Reverse proxy একটা module, TLS certificate management একটা module, file server একটা module — সবকিছুই।

এই modular design-এর সুবিধা হলো:
- শুধু দরকারি feature-ই থাকে
- নতুন feature যোগ করা সহজ
- binary-তে অহেতুক কিছু থাকে না

## Module কয় ধরনের আছে?

Caddy-তে অনেক ধরনের module থাকে — সবচেয়ে common কয়েকটা:

| Module Type | কাজ |
|---|---|
| `http.handlers` | HTTP request handle করা (reverse_proxy, file_server, etc.) |
| `http.matchers` | Request filter করা (path, header, method) |
| `tls.certificates` | Certificate management |
| `caddy.config_loaders` | Config source (file, Consul, etc.) |
| `caddy.logging.writers` | Log output destination |

## `caddy list-modules` — কী কী আছে দেখা

তোমার Caddy-তে কোন কোন module built-in আছে:

```bash
caddy list-modules
```

এরকম বিশাল লিস্ট দেখবে:

```text
http.handlers.csrf
http.handlers.file_server
http.handlers.reverse_proxy
http.handlers.templates
http.matchers.header
http.matchers.path
http.matchers.method
tls.certificates.automate
tls.issuance.acme
tls.issuance.internal
...
```

`-v` flag দিলে আরও বিস্তারিত তথ্য দেখায়:

```bash
caddy list-modules -v
```

> [!note] Built-in module-ই সাধারণত যথেষ্ট
# সাধারণ web server / reverse proxy / load balancer কাজের জন্য official Caddy binary-র built-in module-ই প্রায় সব কভার করে। Plugin দরকার হয় বিশেষ কাজের জন্য।

## Plugin কখন দরকার?

কিছু কমন দৃশ্য যেখানে plugin লাগে:
- **Cache module** — HTTP response caching
- **GeoIP** — visitor-এর দেশ বের করা
- **Real IP** — Cloudflare/CDN পেছনে আসল client IP পাওয়া
- **DNS challenge** — নির্দিষ্ট DNS provider-এর জন্য (Cloudflare, Route53)
- **Custom module** — তোমার নিজের logic

এই plugin-গুলো official Caddy binary-তে থাকে না — কারণ সব কোনো binary-তে সব plugin রাখলে অহেতুক বড় হয়ে যাবে।

## xcaddy — Custom Caddy Build করা

Caddy-তে plugin যোগ করার standard উপায় হলো `xcaddy` দিয়ে custom binary build করা:

```bash
# প্রথমে xcaddy install করো
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest

# অথবা সরাসরি চালাও (Go লাগবে)
xcaddy build --with github.com/caddyserver/cache-handler
```

এটা একটা `caddy` binary বানাবে যেটাতে তোমার চাওয়া plugin-টা built-in থাকবে।

একাধিক plugin যোগ করতে চাইলে:

```bash
xcaddy build \
  --with github.com/caddyserver/cache-handler \
  --with github.com/mholt/caddy-dns/cloudflare \
  --with github.com/caddy-dns/route53
```

> [!tip] DNS Challenge-এর জন্য plugin
# যদি তুমি Cloudflare বা Route53 পেছনে রাখো আর Let's Encrypt-এর DNS challenge ব্যবহার করতে চাও, তাহলে সেই নির্দিষ্ট DNS provider-এর plugin build করে নিতে হবে।

## xcaddy দিয়ে Specific Version

নির্দিষ্ট Caddy ভার্সন আর plugin ভার্সন চাইলে:

```bash
xcaddy build v2.8.4 \
  --with github.com/mholt/caddy-dns/cloudflare@v0.0.0-20240709010419-171a3b8d8e83
```

## Caddyfile-এ Plugin ব্যবহার করা

Build করার পর Caddyfile-এ সেই plugin-এর directive ব্যবহার করো। যেমন Cloudflare DNS challenge:

```caddyfile
{
    acme_dns cloudflare {$CLOUDFLARE_API_TOKEN}
}

example.com {
    reverse_proxy localhost:3000
}
```

আর cache handler:

```caddyfile
example.com {
    route /* {
        cache
        reverse_proxy localhost:3000
    }
}
```

## Practical — Cloudflare Plugin সহ Caddy Build

ধরো তোমার domain Cloudflare পেছনে আছে আর তুমি DNS challenge চাও:

```bash
# ১. Go আছে কিনা চেক করো
go version

# ২. xcaddy চালাও
xcaddy build \
  --with github.com/mholt/caddy-dns/cloudflare \
  --output ./caddy-custom

# ৩. নতুন binary test করো
./caddy-custom list-modules | grep cloudflare

# ৪. Caddyfile লেখো
cat > Caddyfile << 'EOF'
{
    acme_dns cloudflare {$CLOUDFLARE_API_TOKEN}
}

api.example.com {
    reverse_proxy localhost:3000
}
EOF

# ৫. চালাও
export CLOUDFLARE_API_TOKEN=your_token_here
./caddy-custom run --config Caddyfile
```

> [!example] Docker-এ custom Caddy
# Production-এ সবচেয়ে সহজ উপায় হলো একটা multi-stage Dockerfile লেখা — প্রথম stage-এ xcaddy দিয়ে build করো, দ্বিতীয় stage-এ শুধু binary-টা রাখো। এতে final image ছোট থাকে আর plugin-সহ Caddy পাওয়া যায়।