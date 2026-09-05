# Development

## Project structure

```
flowdesk/
├── api/                    # Backend (runs on edge runtime AND in vite dev)
│   ├── index.js            # Single hand-rolled request handler (all routes)
│   └── _lib/
│       ├── d1.js           # D1 access layer + runtime schema
│       ├── auth.js         # Tokens, PBKDF2, verification codes
│       ├── mailer.js       # Resend email (verification/reset)
│       └── docsMeta.js     # Docs metadata for SEO/share previews
├── functions/              # Cloudflare Pages Functions adapters
│   ├── _middleware.js      # SEO/OG meta injection via HTMLRewriter
│   └── api/[[path]].js     # Express-style → Fetch API adapter
├── src/                    # Frontend (React 19 + TypeScript)
│   ├── App.tsx             # Router — all pages lazy-loaded
│   ├── components/         # UI primitives + feature components
│   ├── data/docs/          # 230+ documentation chapters (markdown)
│   ├── hooks/              # useAuth, useDocProgress, ...
│   ├── lib/                # api client, ai service, totp, utils
│   ├── pages/              # One file per route
│   └── types/              # Domain types
├── android/                # Capacitor Android shell
├── docs/                   # This documentation site (MkDocs Material)
├── scripts/                # (empty — reserved)
├── public/                 # Static assets, OG image, _redirects
└── .github/workflows/      # Android release + docs site CI
```

## Architecture notes

- **One handler, two runtimes.** `api/index.js` is plain JavaScript against an
  Express-style `(req, res)` contract. In production,
  `functions/api/[[path]].js` adapts it to Fetch API; in dev, a custom Vite
  middleware (`vite.config.ts`) adapts it to Node — the same code runs in both.
- **Route additions** go in `api/index.js`'s slug-based router. There is no
  framework — a route is a slug match plus a function.
- **Docs content** lives in `src/data/docs/chapters/<category>/*.md` and is
  bundled eagerly; the catalog is hand-maintained in `src/data/docs/meta.ts`.

## Building the docs site

```bash
pip install mkdocs-material
mkdocs serve    # live reload on http://localhost:8000
mkdocs build    # static output in site/
```

The site deploys automatically to GitHub Pages via
`.github/workflows/docs.yml` on every push to `main`.

## Conventions

- TypeScript strict; `npx tsc -b` must pass before pushing.
- New UI uses the `components/ui` primitives; `components/UI.tsx` is legacy.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `perf:`, `style:`).
