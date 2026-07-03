# Advanced Caddyfile

আগের chapter গুলোতে আমরা Caddy এর basic আর intermediate feature গুলো শিখেছি। এবার দেখবো **advanced configuration** — named matcher, route ordering, snippet import, environment variable, logging, rate limiting, compression ইত্যাদি। এই জিনিস গুলো production deployment এর জন্য খুব important।

## Named Matcher

আগে আমরা `handle` ব্যবহার করেছি যেটা সব request এ apply হয়। কিন্তু অনেক সময় নির্দিষ্ট condition এ কাজ করতে হয় — সেটার জন্য **matcher** লাগে।

```text
example.com {
    @api {
        path /api/*
        method GET POST
    }

    reverse_proxy @api localhost:8000

    # বাকি সব
    reverse_proxy localhost:3000
}
```

এখানে `@api` হলো একটা named matcher — শুধু `/api/*` path আর GET/POST method match হলে কাজ করবে। পরে যেকোনো directive তে reference করা যায়।

### Matcher এর প্রকার

| Matcher | কী match করে |
|---------|--------------|
| `path` | URL path |
| `method` | HTTP method (GET, POST) |
| `header` | Request header |
| `host` | Hostname |
| `protocol` | http বা https |
| `expression` | যেকোনো complex condition |

```text
example.com {
    # শুধু POST request আর JSON content type
    @jsonapi {
        method POST
        header Content-Type application/json
    }

    reverse_proxy @jsonapi localhost:8000
}
```

> [!tip]
> Named matcher দিয়ে তুমি খুব precise control পাও। শুধু নির্দিষ্ট request গুলোকে আলাদা backend এ পাঠানো যায়, বা আলাদা header দেওয়া যায়। এটা production এ খুব কাজে দেয়।

## Expression Matcher আর handle

সবচেয়ে powerful matcher হলো **expression matcher**। এটা CEL (Common Expression Language) ব্যবহার করে।

```text
example.com {
    # mobile user দের আলাদা backend
    @mobile {
        header_regexp User-Agent Mobile
    }

    reverse_proxy @mobile localhost:3001
    reverse_proxy localhost:3000
}
```

`handle` আর `handle_path` দিয়ে request কে আলাদা block এ ভাগ করা যায়:

```text
example.com {
    handle /api/* {
        reverse_proxy localhost:8000
    }

    handle /static/* {
        root * /var/www
        file_server
    }

    handle {
        # বাকি সব request
        reverse_proxy localhost:3000
    }
}
```

`handle_path` হলো `handle` এর মতোই, কিন্তু path prefix টা strip করে দেয়: `/api/users` হয়ে যায় `/users`।

> [!example]
> ধরো তোমার একটা frontend আর একটা backend আছে। Frontend `/` থেকে serve হবে, backend `/api/*` থেকে। `handle` দিয়ে দুটো আলাদা block বানালে পরিষ্কার আর maintainable configuration হবে। এটাই standard pattern।

## Route Ordering

Caddy তে directive গুলোর একটা **default order** আছে। কিন্তু তুমি চাইলে order customize করতে পারো।

```text
example.com {
    # explicit route block
    route {
        # এই order এ চলবে
        header X-Custom "value"
        reverse_proxy localhost:3000
    }
}
```

Default directive order (উপর থেকে নিচে): `rewrite` → `header` → `request_body` → `reverse_proxy` → `file_server` → `respond`।

> [!warn]
> সাধারণত Caddy এর default order ঠিক থাকে, খোঁড়াতে হয় না। শুধু complex scenario তে `route` block দিয়ে explicit order দেওয়া লাগে। নাহলে default এ ছেড়ে দেওয়াই ভালো।

## import — Snippet Reuse

একই configuration বারবার না লিখে **snippet** বানিয়ে reuse করা যায়।

```text
# common security header গুলো একটা snippet এ
(security_headers) {
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Strict-Transport-Security "max-age=31536000"
    }
}

example.com {
    import security_headers
    reverse_proxy localhost:3000
}

api.example.com {
    import security_headers
    reverse_proxy localhost:8000
}
```

> [!tip]
> একাধিক site এর জন্য common config (যেমন security header, CORS) snippet বানিয়ে রাখলে এক জায়গায় change করলে সব জায়গায় apply হবে। এটা DRY (Don't Repeat Yourself) principle। বড় project এ খুব helpful।

## Environment Variable

Caddyfile এ environment variable ব্যবহার করা যায়। এতে secret গুলো code এ না রেখে environment এ রাখা যায়।

```bash
# environment variable সেট করো
export BACKEND_PORT=8000
export API_SECRET=supersecret123
```

```text
example.com {
    reverse_proxy localhost:{$BACKEND_PORT}
    header X-API-Secret {$API_SECRET}
}
```

> [!danger]
> Secret (API key, password, token) কখনো directly Caddyfile এ লিখবে না। সবসময় environment variable ব্যবহার করো। নাহলে Caddyfile git এ commit হলে secret গুলো leak হয়ে যাবে। এটা বড় security risk।

## Logging Configuration

Caddy তে detailed logging সেট আপ করা যায়।

```text
{
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 10
            roll_keep_for 720h
        }
        format json
        level INFO
    }
}

example.com {
    reverse_proxy localhost:3000
    log {
        output file /var/log/caddy/example.log
        format json
    }
}
```

| Option | কাজ |
|--------|-----|
| `output file` | কোন file এ log লেখা হবে |
| `roll_size` | কত বড় হলে log rotate হবে |
| `roll_keep` | কতগুলো পুরোনো log রাখা হবে |
| `format json` | Structured JSON format |

> [!note]
> Production এ JSON format log সবচেয়ে useful। কারণ log aggregation tool (যেমন ELK, Datadog, Loki) JSON parse করতে পারে। এতে search আর analyze করা সহজ হয়। আর log rotation দিলে disk full হওয়ার ভয় থাকে না।

## Compression আর Header

Caddy automaticভাবে response compress করে। কিন্তু customize করা যায়।

```text
example.com {
    encode {
        zstd
        gzip 5    # compression level 1-9
        minimum_length 256
    }

    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Permissions-Policy "geolocation=(), microphone=()"
        Cache-Control "public, max-age=31536000"
        -Server    # header delete করো
    }

    # rate limit
    @toofast {
        expression {http.handlers.vars.rate_count} > 100
    }
    respond @toofast "Too many requests" 429

    reverse_proxy localhost:3000
}
```

| Algorithm | বৈশিষ্ট্য |
|-----------|----------|
| **zstd** | নতুন, দ্রুত আর ভালো compression ratio |
| **gzip** | সব browser এ support করে, পুরোনো |

> [!warn]
> বড় production এর জন্য dedicated rate limiting plugin ব্যবহার করা ভালো। xcaddy দিয়ে build করলে `caddy-ratelimit` plugin যোগ করা যায়। এটা Redis এর মতো storage দিয়ে distributed rate limit করতে পারে।

## Production Deployment Pattern

একটা complete production Caddyfile:

```text
{
    email admin@myapp.com
    admin off    # disable admin API (security)
}

(security) {
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        Strict-Transport-Security "max-age=31536000"
    }
    encode zstd gzip
}

myapp.com, www.myapp.com {
    import security

    handle /api/* {
        reverse_proxy localhost:8000 {
            header_up X-Real-IP {remote_host}
        }
    }

    handle {
        root * /var/www/myapp/dist
        file_server
        try_files {path} /index.html
    }

    log {
        output file /var/log/caddy/myapp.log
        format json
    }
}

admin.myapp.com {
    import security

    @blocked not remote_ip 203.0.113.0/24
    respond @blocked 403

    reverse_proxy localhost:5000
}
```

> [!example]
> এই Caddyfile টা production এর একটা realistic example। এতে আছে: automatic HTTPS, security header, compression, API proxy সঠিক header সহ, static frontend, admin panel শুধু office IP থেকে, JSON logging, snippet reuse। এটাই modern production pattern।

## Docker Integration

Caddy কে Docker দিয়ে production এ চালানো খুব common।

```yaml
# docker-compose.yml
version: "3.9"
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"    # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - BACKEND_HOST=backend:8000

volumes:
  caddy_data:
  caddy_config:
```

> [!note]
- `/data` আর `/config` volume কখনো ভুলবে না। এতে certificate আর config persist হয়। নাহলে container recreate হলে সব certificate হারিয়ে যাবে, আর Let's Encrypt rate limit এ পড়বে। Docker network এ অন্য container কে `container_name:port` দিয়ে reference করা যায়।

## Summary

Advanced Caddyfile দিয়ে তুমি production-grade setup করতে পারবে। Named matcher আর expression দিয়ে precise request control, snippet দিয়ে DRY config, environment variable দিয়ে secret management, logging দিয়ে observability, compression আর security header দিয়ে performance আর security। Docker দিয়ে সব একসাথে orchestrate করা যায়। এই জ্ঞান নিয়ে তুমি যেকোনো project deploy করতে প্রস্তুত!