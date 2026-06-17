# A to Z Helper

> Your all-in-one productivity hub for developers and students.

A to Z Helper is a full-stack web app that keeps your bookmarks, notes, code snippets, questions, and daily routine — all in one place with AI-powered assistance.

## Features

- **Bookmarks** — Save and organize useful links, tutorials, and references
- **Notebooks** — Write and manage markdown notes with live preview
- **Code Book** — Store and search reusable code snippets with syntax highlighting
- **Questions** — Track practice questions with tags and difficulty levels
- **Routine** — Plan and manage your daily schedule
- **AI Chatbot** — Get instant help powered by Google Gemini
- **Categories** — Organize everything with custom categories
- **Share** — Generate public links for your notes and snippets
- **Dark/Light Mode** — Toggle between themes
- **Email Verification** — Secure signup with OTP-based verification (via Resend)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| UI Components | Radix UI, shadcn/ui, Lucide Icons |
| Backend | Cloudflare Pages Functions (Edge Runtime) |
| Database | Cloudflare D1 (Direct bindings / REST proxy) |
| AI | Google Gemini (`@google/genai`) |
| Email | Resend (HTTP REST API) |
| Hosting | Cloudflare Pages |

## Getting Started

### Prerequisites

- Node.js 20+
- A Cloudflare D1 Database (for production/local binding)
- A Resend API Key (for email verification)

### Setup

```bash
git clone git@github.com:masudranaxpert/a-to-z-helper.git
cd a-to-z-helper
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Optional fallback database credentials if not using direct bindings
D1_REST_URL=https://api.cloudflare.com/client/v4/accounts/your-account-id/d1/database/your-database-id
D1_REST_TOKEN=your-cloudflare-api-token

AUTH_SECRET=your-jwt-auth-secret-key
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="BookmarkVault <onboarding@resend.dev>"
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to Cloudflare Pages

1. Create a new Cloudflare Pages project from your Git repository.
2. In **Build Settings**, configure the following:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Go to **Settings** -> **Functions** -> **Compatibility flags** and add `nodejs_compat` to both production and preview.
4. Go to **Settings** -> **Functions** -> **D1 database bindings** and add a binding:
   - **Variable name**: `DB`
   - **D1 database**: Select your Cloudflare D1 database.
5. Under **Settings** -> **Environment variables**, define the following variables:
   - `AUTH_SECRET`: Your secret JWT key.
   - `RESEND_API_KEY`: Your Resend API key.
   - `EMAIL_FROM`: The verified email address or domain sender.

## License

MIT

