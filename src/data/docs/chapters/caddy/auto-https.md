# Automatic HTTPS

Caddy এর সবচেয়ে বড় আর জাদুকরী feature হলো **automatic HTTPS**। তুমি শুধু domain টা Caddyfile এ লিখবে, আর বাকি সব Caddy নিজে করবে — certificate আনা, install করা, renew করা, HTTP কে HTTPS এ redirect করা। এই chapter এ দেখবো পুরো প্রক্রিয়াটা কীভাবে কাজ করে।

## HTTPS কেন দরকার?

এতকর প্রতিটা website এ HTTPS (তালা আইকন 🔒) দেখা যায়। এর কারণ গুলো দেখি:

| কারণ | ব্যাখ্যা |
|------|----------|
| **Encryption** | Data encrypt হয়ে যায়, hacker পড়তে পারবে না |
| **Authentication** | User নিশ্চিত হয় সে আসল site এ আছে, fake না |
| **SEO** | Google HTTPS site কে prefer করে |
| **Browser Warning** | HTTP site এ modern browser "Not Secure" দেখায় |
| **Modern Feature** | HTTP/2, HTTP/3, service worker — সব HTTPS লাগে |

> [!danger]
> ২০২৬ সালে HTTP only site চালালে browser ব্যবহারকারীকে warning দেখাবে "এই site টা secure না"। অনেকে ভয় পেয়ে চলে যাবে। এছাড়া অনেক modern web feature (camera, microphone, geolocation) শুধু HTTPS এ কাজ করে।

## TLS Certificate কী?

**TLS certificate** হলো একটা digital document যেটা প্রমাণ করে যে এই domain টা সত্যিই তোমার। এটা একটা trusted **Certificate Authority (CA)** থেকে আসে।

```text
    Browser                          Server
       │                               │
       │ ── 1. Connect request ─────→  │
       │ ←─ 2. Certificate (public) ── │
       │                               │
   Verify করে CA থেকে এসেছে কিনা       │
       │ ── 3. Encrypted channel ──→  │
       │                               │
   এখন থেকে data encrypt হয়ে যাবে     │
```

আগে certificate পেতে গেলে টাকা দিতে হতো (SSL কিনতে হতো)। এখন **Let's Encrypt** আর **ZeroSSL** ফ্রি certificate দেয়।

> [!note]
> **SSL** আর **TLS** মূলত একই জিনিস। SSL ছিলো পুরোনো নাম, TLS হলো আধুনিক version। সবাই এখনও "SSL certificate" বলে, কিন্তু technically এটা TLS certificate। কাজ একই — data encrypt করা।

## Caddy কীভাবে Auto Certificate আনে

Caddy যখন একটা domain (যেমন `example.com`) Caddyfile এ দেখে, তখন সে automaticভাবে এই পদক্ষেপ গুলো নেয়:

```text
1. Caddy শুরু হয়
   ↓
2. Domain গুলো চিনে (example.com)
   ↓
3. Let's Encrypt কে certificate request পাঠায়
   ↓
4. CA verify করে domain টা সত্যিই তোমার কিনা
   ↓
5. Certificate issue হয় (ফ্রি!)
   ↓
6. Caddy সেটা install করে, HTTPS চালু করে
   ↓
7. মেয়াদ শেষ হওয়ার আগে automatic renew করে
```

### Verification Method গুলো

CA verify করে কীভাবে যে domain টা সত্যিই তোমার? দুইটা প্রধান method:

| Method | কীভাবে কাজ করে |
|--------|----------------|
| **HTTP-01** | CA একটা special URL এ request পাঠায়, Caddy সেটা respond করে |
| **TLS-ALPN** | TLS handshake এর সময় verify করে |
| **DNS-01** | DNS এ একটা TXT record যোগ করে verify করে (wildcard এর জন্য) |

```text
HTTP-01 Challenge:
  CA: "example.com/.well-known/acme-challenge/xyz123"
  ↓
  Caddy responds সঠিক উত্তর দিয়ে
  ↓
  CA: "ঠিক আছে, domain তোমার, certificate নাও"
```

> [!tip]
- HTTP-01 challenge default। এর জন্য শুধু domain টা তোমার server এ point করতে হবে (DNS A record), আর port 80 খোলা থাকতে হবে। বাকিটা Caddy নিজে করবে।

## HTTP → HTTPS Redirect

Caddy automaticভাবে HTTP কে HTTPS এ redirect করে। কিছু করতে হয় না।

```text
example.com {
    reverse_proxy localhost:3000
}
```

```text
  User: http://example.com (HTTP, port 80)
    ↓ Caddy automatic redirect
  User: https://example.com (HTTPS, port 443)
```

তুমি চাইলে manually ও redirect customize করতে পারো, কিন্তু default এ সব ঠিকঠাক চলে।

> [!note]
> কেউ যদি `http://example.com` লিখে, Caddy 301 redirect করে `https://example.com` এ। এতে user কে কিছু করতে হয় না, browser automatic switch করে। এটা Caddy এর default behavior।

## Local Development HTTPS

Localhost এ development করার সময় HTTPS দরকার? Caddy এর কাছে নিজের **internal CA** আছে!

```text
localhost {
    reverse_proxy localhost:3000
}
```

```text
  Caddy detects: localhost → no public CA possible
  ↓
  Creates internal CA (Caddy Local)
  ↓
  Issues self-signed certificate
  ↓
  Installs CA in system trust store
  ↓
  Browser trusts it! 🔒
```

```bash
# internal certificate চালু করো explicitly
caddy trust
```

> [!tip]
> যখন `localhost` বা `*.localhost` বা IP address দাও, Caddy automatic internal CA ব্যবহার করে। Browser এ `https://localhost` করলে সবুজ তালা দেখাবে। Local development এ এটা দারুণ — কোনো "Not Secure" warning নেই।

## Certificate Management

Caddy certificate গুলো কোথায় store করে আর কীভাবে manage করে দেখি।

### Storage Location

```bash
# default storage location
ls /var/lib/caddy/.local/share/caddy/certificates/
```

```text
certificates/
├── acme-v02.api.letsencrypt.org-directory/
│   └── example.com/
│       ├── example.com.crt    # certificate
│       ├── example.com.key    # private key
│       └── example.com.json   # metadata
```

### Manual Certificate Operations

```bash
# সব certificate দেখো
caddy list-modules | grep tls

# storage path দেখো
caddy environ | grep CADDY_DATA

# নির্দিষ্ট domain এর certificate যোগ করো
caddy trust
```

> [!warn]
> `/var/lib/caddy/` folder কখনো manually delete করবে না। এতে certificate আর তাদের private key থাকে। Delete করলে Caddy কে আবার নতুন করে certificate provision করতে হবে। আর Let's Encrypt এর rate limit আছে — বারবার নিলে block হতে পারো।

## OCSP Stapling

**OCSP (Online Certificate Status Protocol)** দিয়ে browser check করে certificate টা বাতিল হয়েছে কিনা। কিন্তু প্রতিটা browser যদি CA কে query করে, তাহলে privacy আর performance সমস্যা।

**OCSP Stapling** এ Caddy নিজে OCSP response আগে থেকে নিয়ে রাখে, আর TLS handshake এর সময় browser কে দেয়। এতে browser কে আলাদা request করতে হয় না।

Caddy তে OCSP stapling **default** এ চালু থাকে। কিছু করতে হয় না।

```text
  Without OCSP Stapling:
  Browser → CA Server (privacy issue, slow)

  With OCSP Stapling:
  Caddy → CA Server (caches response)
  Browser → Caddy (gets cached, fast, private)
```

> [!note]
> OCSP stapling হলো একটা performance আর privacy optimization। Browser কে external server এ contact করতে হয় না, Caddy আগে থেকেই প্রস্তুত রাখে। ফলে TLS handshake দ্রুত হয়।

## Wildcard Certificate

একটা certificate দিয়ে সব subdomain cover করা যায় — এটাই wildcard certificate।

```text
*.example.com
```

এটা `blog.example.com`, `api.example.com`, `app.example.com` — সব cover করবে।

কিন্তু wildcard এর জন্য **DNS challenge** করতে হয়, HTTP challenge কাজ করবে না।

```text
*.example.com, example.com {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }

    reverse_proxy localhost:3000
}
```

> [!warn]
> Wildcard certificate এর জন্য DNS provider plugin লাগে। Caddy এ এটা আলাদাভাবে build করতে হয় — standard binary তে DNS plugin থাকে না। `xcaddy` build tool দিয়ে custom Caddy binary বানাতে হয়।

## DNS Challenge

DNS challenge হলো verification এর আরেকটা উপায়। CA DNS এ একটা TXT record যোগ করতে বলে।

```bash
# xcaddy দিয়ে custom Caddy build করো
xcaddy build --with github.com/caddy-dns/cloudflare
```

```text
{
    # Cloudflare DNS plugin
    acme_dns cloudflare {env.CF_API_TOKEN}
}

*.example.com {
    reverse_proxy localhost:3000
}
```

DNS challenge এর সুবিধা:
- Wildcard certificate পাওয়া যায়
- Port 80 খোলা থাকার দরকার নেই
- Firewall এর পেছনেও কাজ করে

> [!example]
> তোমার একটা internal tool আছে যেটা public internet এ expose করতে চাও না, কিন্তু HTTPS লাগে। DNS challenge দিয়ে certificate নিয়ে, শুধু VPN বা office network থেকে accessible রাখতে পারো। Port 80 খুলতে হবে না।

## On-Demand TLS

সাধারণত Caddy start হওয়ার সময় সব domain এর certificate নিয়ে নেয়। কিন্তু অনেক domain থাকলে সময় লাগে। **On-Demand TLS** এ certificate তখনই আনে যখন প্রথম request আসে।

```text
example.com {
    tls {
        on_demand
    }

    reverse_proxy localhost:3000
}
```

```bash
# global on-demand config
{
    on_demand_tls {
        ask http://localhost:5555/check
    }
}
```

> [!tip]
> On-Demand TLS মূলত multi-tenant SaaS এর জন্য — যেখানে হাজার হাজার customer এর custom domain থাকে। সবার certificate start এ নিলে অনেক সময় লাগবে। তাই request আসলে তখনই নেওয়া হয়।

## Troubleshooting Certificate Issue

Certificate সমস্যা হলে কী করবে?

### ১. Log Check করো

```bash
# Caddy এর log দেখো
sudo journalctl -u caddy -f | grep -i cert
```

### ২. সাধারণ সমস্যা গুলো

| সমস্যা | কারণ | সমাধান |
|--------|------|---------|
| Certificate আসছে না | Domain DNS ঠিক না | DNS A record ঠিক করো |
| Rate limit | অনেকবার request করেছো | কিছুক্ষণ অপেক্ষা করো (১ সপ্তাহ) |
| Port 80 block | Firewall এ বন্ধ | Port 80 খুলো (HTTP challenge এর জন্য) |
| Localhost warning | Browser CA trust করছে না | `caddy trust` চালাও |
| Wildcard error | DNS plugin নেই | xcaddy দিয়ে build করো |

### ৩. Force Re-issue

```bash
# certificate গুলো মুছে ফেলো (সাবধানে!)
sudo rm -rf /var/lib/caddy/.local/share/caddy/certificates/

# Caddy restart করো
sudo systemctl restart caddy
```

> [!danger]
> Certificate গুলো delete করলে Caddy কে আবার নতুন করে provision করতে হবে। Let's Encrypt এর rate limit: এক domain এ সপ্তাহে সর্বোচ্চ ৫টা certificate। বারবার নিলে block হয়ে যাবে। তাই খুব দরকার না হলে delete করবে না।

### ৪. SSL Labs Test

তোমার site এর HTTPS setup কতটা ভালো তা test করো:

```text
https://www.ssllabs.com/ssltest/
```

ভালো Caddy setup এ A+ rating আসবে।

## Summary

Caddy automatic HTTPS দিয়ে certificate manage করে — সব ফ্রি, সব automatic। শুধু domain দিলেই হয়। Local development এ internal CA দিয়ে localhost ও HTTPS পায়। Wildcard এর জন্য DNS challenge লাগে। Certificate সমস্যা হলে log আর common cause গুলো check করো। পরের chapter এ advanced Caddyfile configuration নিয়ে দেখবো।