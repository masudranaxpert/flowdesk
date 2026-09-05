# Installation

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | 22 recommended |
| npm | 10+ | Ships with Node |
| Cloudflare account | — | Free tier is enough |

## Clone and install

```bash
git clone https://github.com/masudranaxpert/flowdesk.git
cd flowdesk
npm install
```

## Configure environment

```bash
cp .env.example .env
```

Generate an auth secret:

```bash
openssl rand -hex 32
```

Put it in `.env` as `AUTH_SECRET`. See [Configuration](configuration.md) for every
variable and where it is required.

## Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs through a custom
Vite middleware that executes the same handler Cloudflare Pages will run in
production — no separate backend process needed.

!!! note
    Without D1 REST credentials the dev server starts, but signing up requires a
    reachable database. See [Configuration](configuration.md) for the local REST
    fallback, or run `wrangler pages dev` with a local D1 binding.

## Type-check and build

```bash
npm run build     # tsc -b && vite build
npm run preview   # serve the production build locally
```
