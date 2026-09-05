# Deploy to Cloudflare

FlowDesk is a native Cloudflare Pages project — the backend runs as
Pages Functions on the edge runtime with direct D1/R2 bindings.

!!! warning
    The old Vercel deployment path has been removed. Cloudflare Pages is the
    only supported host.

## 1. Create the resources

```bash
wrangler d1 create flowdesk
wrangler r2 bucket create flowdesk-files
```

## 2. Connect the repository

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick this repository.
3. Build settings:

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |

## 3. Add bindings

**Pages project → Settings → Functions → Bindings:**

| Name | Type | Target |
|------|------|--------|
| `DB` | D1 | `flowdesk` |
| `R2` | R2 bucket | `flowdesk-files` |

## 4. Add secrets

**Settings → Environment variables** (Production *and* Preview):

- `AUTH_SECRET` — `openssl rand -hex 32`
- `RESEND_API_KEY`
- `EMAIL_FROM`

## 5. Deploy

Push to your connected branch. The schema is created automatically on first boot
(see `ensureSchema` in `api/_lib/d1.js`); set `SKIP_SCHEMA_ENSURE=1` later if you
prefer managing migrations yourself.

## Custom domain

**Pages project → Custom domains** → add your domain. Certificates are issued
automatically. Update the Capacitor native API base in
`src/lib/api.ts` if your domain changes.
