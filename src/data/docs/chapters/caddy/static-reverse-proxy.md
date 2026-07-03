# Static File আর Reverse Proxy

আগের chapter এ আমরা Caddy install করেছি আর basic Caddyfile দেখেছি। এবার দেখবো Caddy এর দুইটা সবচেয়ে important feature — **static file serving** আর **reverse proxy**। এই দুটো শিখলে তুমি যেকোনো web project deploy করতে পারবে।

## Static File Serving

Static file হলো সেই file গুলো যেগুলো server side processing ছাড়াই browser কে পাঠানো যায় — HTML, CSS, JavaScript, image, font ইত্যাদি। Caddy দিয়ে এগুলো serve করা একদম সহজ।

### file_server Directive

`file_server` directive দিয়ে যেকোনো folder serve করা যায়।

```text
example.com {
    root * /var/www/site
    file_server
}
```

এখানে:
- `root` — কোন folder থেকে file serve করবে
- `*` — সব request এর জন্য apply হবে
- `file_server` — static file serving চালু করো

```text
Request: example.com/about.html
         ↓
    Caddy checks: /var/www/site/about.html আছে?
         ↓
    থাকলে serve করো, না থাকলে 404
```

> [!tip]
> `root` আর `file_server` দুটোই দরকার। `root` ছাড়া Caddy বুঝবে না কোন folder থেকে file নিতে হবে। `file_server` ছাড়া Caddy file serve করবে না।

### Browse Option

কোনো `index.html` না থাকলে folder এর file list দেখানো যায়।

```text
localhost:8080 {
    root * /srv/files
    file_server browse
}
```

এখন `localhost:8080` খুললে folder এর ভেতরের file গুলোর একটা list দেখাবে। Development এ খুব useful।

### React/Next.js Build Serve

React বা Next.js এর static build serve করা যায়:

```bash
# React build করো
npm run build
# dist/ বা build/ folder তৈরি হবে
```

```text
myapp.com {
    root * /home/user/myapp/dist
    file_server

    # SPA routing এর জন্য — সব unknown path কে index.html এ পাঠাও
    try_files {path} /index.html
}
```

> [!note]
> React Router বা Vue Router ব্যবহার করলে `try_files` খুব important। কারণ user `/about` page এ গেলে server এ `/about.html` খোঁজে, কিন্তু SPA তে সবই client side এ handle হয়। `try_files` দিলে path না পেলে `index.html` কে serve করবে, আর React নিজে routing handle করবে।

## Reverse Proxy কী?

**Reverse proxy** হলো এমন একটা setup যেখানে Caddy client এর request নেয়, আর সেটা পেছনে চলমান অন্য server কে পাঠায়। Client জানেই না যে আসলে পেছনে অন্য একটা server কাজ করছে।

```text
    Browser
      ↓ HTTPS (port 443)
  ┌──────────┐
  │  Caddy   │  ← Reverse Proxy
  └────┬─────┘
       ↓ HTTP (internal)
  ┌────┴─────┐
  │ Backend  │
  │ (Node)   │  ← localhost:3000
  └──────────┘
```

### Reverse Proxy কেন লাগে?

১. **Security** — Backend server সরাসরি internet এ expose করতে হয় না
২. **HTTPS** — শুধু Caddy তে certificate থাকে, backend এ HTTP চলে
৩. **Load Balancing** — একাধিক backend এর মাঝে request ভাগ করা যায়
৪. **Routing** — বিভিন্ন path কে আলাদা backend এ পাঠানো যায়

> [!example]
> ধরো তোমার একটা FastAPI backend চলছে `localhost:8000` তে। তুমি চাও `api.mysite.com` থেকে সেটা accessible হোক, আর HTTPS ও থাকুক। Caddy reverse proxy দিলেই হবে — Caddy HTTPS handle করবে, request কে backend এ পাঠাবে।

## reverse_proxy Directive

Python বা Node.js backend কে proxy করা যায়।

### Python (FastAPI/Flask) Proxy

```text
api.mysite.com {
    reverse_proxy localhost:8000
}
```

এখন `api.mysite.com/users` request করলে সেটা `localhost:8000/users` এ চলে যাবে।

### Node.js Proxy

```text
app.mysite.com {
    reverse_proxy localhost:3000
}
```

### Path Based Routing

একই domain এর বিভিন্ন path কে আলাদা backend এ পাঠানো যায়:

```text
mysite.com {
    # /api/* কে backend API তে
    handle_path /api/* {
        reverse_proxy localhost:8000
    }

    # /app/* কে Node.js এ
    handle_path /app/* {
        reverse_proxy localhost:3000
    }

    # বাকি সব static file এ
    handle {
        root * /var/www/site
        file_server
    }
}
```

```text
  Request: mysite.com/api/users
           ↓
  Caddy → strips /api → /users
           ↓
  Backend: localhost:8000/users

  Request: mysite.com/
           ↓
  Caddy → static file server
```

> [!tip]
> `handle_path` আর `handle` এর পার্থক্য হলো — `handle_path` request এর path prefix টা strip করে দেয়। অর্থাৎ `/api/users` হয়ে যায় `/users`। যদি prefix রাখতে চাও তাহলে শুধু `handle` ব্যবহার করো।

## Load Balancing

একাধিক backend instance থাকলে Caddy তাদের মাঝে request ভাগ করে দেয়।

```text
api.mysite.com {
    reverse_proxy localhost:8000 localhost:8001 localhost:8002
}
```

```text
    Request 1 → localhost:8000 (backend 1)
    Request 2 → localhost:8001 (backend 2)
    Request 3 → localhost:8002 (backend 3)
    Request 4 → localhost:8000 (আবার প্রথমে)
```

### Load Balancing Policy

ভাগ করার নিয়ম customize করা যায়:

```text
api.mysite.com {
    reverse_proxy {
        to localhost:8000 localhost:8001

        # round robin (default)
        lb_policy round_robin

        # সবচেয়ে কম connection ওয়ালাকে
        lb_policy least_conn

        # IP hash (একই user সবসময় এক backend এ)
        lb_policy ip_hash
    }
}
```

> [!note]
> Production এ high traffic app এর জন্য একাধিক backend instance চালানো হয়। যেমন ৪টা FastAPI instance ৪টা port এ। Caddy load balancer হিসেবে কাজ করে request গুলো ভাগ করে দেয়। এতে single backend overload হয় না।

### Health Check

Backend বন্ধ হয়ে গেলে Caddy automatic detect করে:

```text
api.mysite.com {
    reverse_proxy {
        to localhost:8000 localhost:8001

        health_uri /health
        health_interval 10s
        health_timeout 5s
    }
}
```

## Header Manipulation

Request বা response এর header customize করা যায়।

### Response Header যোগ করা

```text
mysite.com {
    reverse_proxy localhost:3000

    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
        X-Powered-By "Caddy"
    }
}
```

### Request Header Modify

```text
api.mysite.com {
    reverse_proxy localhost:8000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up Host {host}
    }
}
```

> [!tip]
> Backend server সাধারণত client এর real IP পায় না (কারণ request Caddy থেকে আসছে)। `X-Real-IP` আর `X-Forwarded-For` header দিলে backend real client IP পেতে পারে। FastAPI/Express এই header গুলো পড়ে কাজ করে।

## Path Rewriting

Request এর path modify করা যায়:

```text
old.mysite.com {
    # /old/* কে /new/* এ rewrite করো
    rewrite * /new{path}

    reverse_proxy localhost:3000
}
```

```text
Request: /old/page
  ↓ rewrite
Becomes: /new/page
  ↓ proxy
Backend gets: /new/page
```

### Strip Path

```text
api.mysite.com {
    handle_path /v1/* {
        reverse_proxy localhost:8000
    }
}
```

`handle_path` automatic `/v1` কে strip করে দেয়। `/v1/users` হয়ে যায় `/users`।

## Practical Caddyfile Examples

### Example ১: Full Stack App

Frontend React + Backend FastAPI:

```text
myapp.com {
    # API requests
    handle /api/* {
        reverse_proxy localhost:8000
    }

    # Static React app
    handle {
        root * /var/www/myapp/dist
        file_server
        try_files {path} /index.html
    }
}
```

### Example ২: Multiple Services

```text
{
    # global options
    email admin@myapp.com
}

blog.mysite.com {
    reverse_proxy localhost:4000
}

api.mysite.com {
    reverse_proxy localhost:8000 {
        header_up X-Real-IP {remote_host}
    }
}

admin.mysite.com {
    # IP restriction — শুধু office IP থেকে
    @blocked not remote_ip 203.0.113.0/24
    respond @blocked 403

    reverse_proxy localhost:5000
}
```

> [!example]
> এই Caddyfile টা production এর একটা real example। তিনটা subdomain — blog, api, admin — তিনটা আলাদা service। Admin শুধু office IP থেকে accessible। আর সব automatic HTTPS! nginx এ এটা করতে গেলে অনেক বেশি complex config লাগতো।

## WebSocket Support

Caddy automaticভাবে WebSocket support করে। কিছু extra করতে হয় না।

```text
ws.mysite.com {
    reverse_proxy localhost:3000
}
```

> [!note]
- WebSocket (real-time chat, live update) কে automatic detect করে আর upgrade করে। অন্যান্য proxy server এ এটা extra config লাগে, কিন্তু Caddy তে একদম transparent।

## Summary

`file_server` দিয়ে static file serve করো, `reverse_proxy` দিয়ে backend কে proxy করো। `handle_path` দিয়ে path based routing করো। Load balancing একাধিক backend এর মাঝে request ভাগ করে। Header manipulation আর path rewriting দিয়ে request customize করা যায়। পরের chapter এ automatic HTTPS নিয়ে detail দেখবো — Caddy এর সবচেয়ে বড় feature।