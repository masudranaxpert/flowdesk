# Configuration

All configuration is environment-based. Copy `.env.example` to `.env` for local
development; set the production values in the **Cloudflare Pages dashboard**.

## Required in production

### `AUTH_SECRET`

Signs session tokens (HMAC-SHA256) and hashes verification codes.

```bash
AUTH_SECRET=<output of: openssl rand -hex 32>
```

!!! danger
    There is **no default**. The API refuses to start when this is missing.
    Rotating it signs out every user.

### Cloudflare bindings

Configured in **Pages → Settings → Functions → Bindings**, not in files:

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 database | All relational data |
| `R2` | R2 bucket | File uploads, shareable downloads, video streaming |

## Local development only

| Variable | Purpose |
|----------|---------|
| `D1_REST_URL` | Cloudflare REST endpoint for your D1 database |
| `D1_REST_TOKEN` | API token with D1 read/write permission |
| `SKIP_SCHEMA_ENSURE` | Set to any non-empty value to skip automatic schema creation at boot |

In production these are ignored — the D1 binding is used directly.

## Email (Resend)

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Sends signup verification and password-reset codes |
| `EMAIL_FROM` | From-address, e.g. `"FlowDesk <onboarding@resend.dev>"` |

Without an API key, verification codes are printed to the server logs — convenient
for local development, never use in production.

## AI providers

AI keys are **bring-your-own**: each user configures Gemini, OpenAI, or OpenRouter
keys in the in-app AI settings page. They are stored per-user in the database —
no server-wide AI key is required.
