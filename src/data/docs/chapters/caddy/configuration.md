## Caddy-র দুটো Config Format

Caddy-তে কনফিগ লেখার দুটো উপায় আছে — আর এটা বুঝতে পারা খুব জরুরি:

1. **Caddyfile** — human-friendly, simple text format। এটাই তুমি প্রায় সবসময় লিখবে।
2. **JSON config** — Caddy-র actual underlying config format। Caddy ভেতরে এটাই ব্যবহার করে।

সুন্দর ব্যাপার হলো — Caddyfile লিখলে Caddy সেটাকে JSON-এ convert করে নেয়। তুমি চাইলে নিজেও এই conversion দেখতে পারো।

## Caddyfile — সহজ উদাহরণ

```caddyfile
# Caddyfile
localhost {
    respond "Hello, World!"
}

api.example.com {
    reverse_proxy localhost:3000
}
```

এই সামান্য কয়লাইনে Caddy অটোমেটিক HTTPS চালু করবে, certificate manage করবে (Let's Encrypt বা ZeroSSL থেকে), আর `localhost:3000`-এ তোমার app-কে proxy করবে।

## `caddy adapt` — Caddyfile থেকে JSON দেখা

Caddyfile-কে JSON-এ convert করে দেখতে পারো — কিছু install না করেই:

```bash
caddy adapt --config Caddyfile
```

তাহলে একটা বড় JSON output দেখতে পাবে — এটাই Caddy ভেতরে আসলে use করে।

JSON আউটপুট সেভ করে Caddy-কে সরাসরি JSON দিয়েও চালানো যায়:

```bash
caddy adapt --config Caddyfile --pretty > caddy.json
caddy run --config caddy.json
```

> [!tip] কেন JSON দেখবে?
> Debugging-এর সময় খুব কাজে লাগে — Caddy আসলে কী বুঝল সেটা দেখা যায়। আবার কোনো plugin বা advanced feature শুধু JSON-এই available — তখন কনফিগ নিজে লিখতে হয়।

## Admin API — `localhost:2019`

Caddy-র একটা চমৎকার feature হলো admin API — Caddy চলাকালীন JSON config পরিবর্তন করা যায় একটা HTTP endpoint দিয়ে:

```bash
# বর্তমান পুরো config দেখো
curl localhost:2019/config/

# নতুন config load করো
curl localhost:2019/load \
  -H "Content-Type: application/json" \
  -d @caddy.json
```

মানে তুমি Caddy restart না করেই live config change করতে পারো!

## Environment Variables — `{$VAR}`

Caddyfile-এ environment variable ব্যবহার করা যায় — production-এ খুব দরকারি:

```caddyfile
{
    admin off
}

{$DOMAIN} {
    reverse_proxy {$BACKEND_HOST}:{$BACKEND_PORT}
    log {
        output file {$LOG_PATH}
    }
}
```

```bash
# Environment variable সেট করে চালাও
export DOMAIN=api.example.com
export BACKEND_HOST=localhost
export BACKEND_PORT=3000
export LOG_PATH=/var/log/caddy/access.log

caddy run --config Caddyfile
```

> [!note] `{$VAR}` syntax
> Caddyfile-এ environment variable লেখার নিয়ম হলো `{$VARIABLE_NAME}`। এটা Caddy start হওয়ার সময় replace হয়ে যায়।

## Caddy চালানোর কমান্ডগুলো

```bash
# foreground-এ চালাও (log সরাসরি দেখা যায়, Ctrl+C দিলে বন্ধ)
caddy run --config Caddyfile

# background-এ চালাও (daemon)
caddy start --config Caddyfile

# চলছে এমন Caddy-র config পরিবর্তন করো (reload)
caddy reload --config Caddyfile

# বন্ধ করো
caddy stop

# কনফিগ validate করো (ভুল আছে কি না)
caddy validate --config Caddyfile
```

## Config Validate করা

Production-এ deploy করার আগে সবসময় validate করে নাও:

```bash
caddy validate --config Caddyfile --adapter caddyfile
```

> [!warn] `--adapter` flag
> Caddyfile ব্যবহার করলে `--adapter caddyfile` দিতে হয়। JSON config হলে adapter দরকার নেই — Caddy সরাসরি বুঝে নেয়।

## Practical — Env Vars + Adapt করে JSON দেখা

ধরো তোমার API আর frontend দুটো domain-এ চালাতে হবে:

```caddyfile
# Caddyfile
{
    email {$ADMIN_EMAIL}
}

{$API_DOMAIN} {
    reverse_proxy localhost:8000
}

{$WEB_DOMAIN} {
    root * /var/www/html
    file_server
}
```

```bash
# ১. Environment variable সেট করো
export ADMIN_EMAIL=admin@example.com
export API_DOMAIN=api.mysite.com
export WEB_DOMAIN=mysite.com

# ২. Validate করো
caddy validate --config Caddyfile --adapter caddyfile

# ৩. JSON-এ convert করে দেখো
caddy adapt --config Caddyfile --adapter caddyfile --pretty

# ৪. চালাও
caddy run --config Caddyfile
```

> [!example] Full উপায়ে production deploy
# আসলে Caddy-কে systemd service বানিয়ে চালানো সবচেয়ে ভালো — এতে server restart হলেও Caddy auto-start হবে। Caddy-র নিজস্ব `caddy` user বানিয়ে permission ঠিক করে দিলেই হয়।