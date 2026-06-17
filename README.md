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
- **Email Verification** — Secure signup with OTP-based verification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| UI Components | Radix UI, shadcn/ui, Lucide Icons |
| Backend | Vercel Serverless Functions |
| Database | Cloudflare D1 via d1-secret-rest |
| AI | Google Gemini (`@google/genai`) |
| Email | Nodemailer (Gmail SMTP) |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare D1 REST worker URL and bearer token
- A Gmail account (for email verification)
- A Google AI API key (for chatbot)

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
D1_REST_URL=https://d1-rest.<your-worker>.workers.dev
D1_REST_TOKEN=your-d1-rest-token
AUTH_SECRET=your-random-secret

# Gmail
EMAIL_USER=yourgmail@gmail.com
EMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM=yourgmail@gmail.com
```

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy

Built for Vercel. Just push to GitHub and connect your repo on [vercel.com](https://vercel.com).

## License

MIT
