# Nooks

Soft-touch, real-time messaging — built with Next.js and Supabase, styled with neomorphism.

Nooks is a clean, minimal chat app where conversations feel like a quiet corner of the internet. 1:1 and group messaging, live typing indicators, read receipts, and media sharing — all wrapped in a soft, tactile UI.

## Preview

> Screenshots/GIF coming soon — will be added once Phase 6 (Polish & Deploy) is complete.

## Why this project exists

Most chat-app tutorials stop at "messages appear in a list." Nooks was built to go further — real-time presence, typing indicators, read receipts, and Row Level Security done properly, all backed by a fully documented product process (PRD, architecture docs, and a phased build plan — see [`/docs`](./docs)).

## Features

- **1:1 and group messaging** — real-time delivery via Supabase Realtime, no polling
- **Typing indicators** — ephemeral, zero database writes (Broadcast channel)
- **Online/offline presence** — with graceful reconnect handling
- **Read receipts** — sent → delivered → read, WhatsApp-style
- **Media sharing** — images and files via Supabase Storage
- **Neomorphic UI** — light and dark themes, built for accessibility (WCAG AA contrast)

## Tech stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js 14 (App Router), React 18, TypeScript       |
| Styling    | Tailwind CSS with a custom neomorphic design system |
| Backend    | Supabase (Auth, PostgreSQL, Realtime, Storage)      |
| State      | Zustand + TanStack Query                            |
| Deployment | Vercel (frontend) + Supabase Cloud (backend)        |

## Architecture

```
Next.js (Client) ──HTTPS/REST──▶ Supabase (PostgREST + Auth)
                 ──WebSocket───▶ Supabase Realtime (Postgres Changes, Presence, Broadcast)
                                        │
                                        ▼
                                PostgreSQL (Row Level Security)
```

Full system design, data flows, and RLS policy breakdown are documented in [`docs/03-SAD.md`](./docs/03-SAD.md).

## Getting started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account

### Setup

```bash
git clone https://github.com/saadferozee/nooks.git
cd nooks
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase project URL and anon key (found under Project Settings → API).

Then run the schema:

```bash
# Paste the contents of supabase-schema.sql into your
# Supabase Dashboard → SQL Editor, and run it.
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
nooks/
├── app/                    # Next.js routes and pages
├── components/             # UI components
├── lib/
│   └── supabase/           # Browser + server Supabase clients
├── docs/                   # PRD, TAD, SAD, FSD, FTL
├── middleware.ts           # Auth session refresh
├── supabase-schema.sql     # DB schema + RLS policies
└── tailwind.config.ts      # Brand colors + neomorphic tokens
```

## Roadmap

Full phase-by-phase breakdown is in [`docs/05-FTL.md`](./docs/05-FTL.md). Short version:

- [x] Phase 0 — Project setup
- [ ] Phase 1 — Authentication
- [ ] Phase 2 — Core 1:1 messaging
- [ ] Phase 3 — Group chat
- [ ] Phase 4 — Presence, typing, read receipts
- [ ] Phase 5 — Media sharing
- [ ] Phase 6 — Polish and deploy

## Documentation

- [Product Requirements](./docs/01-PRD.md)
- [Technical Architecture](./docs/02-TAD.md)
- [System Architecture](./docs/03-SAD.md)
- [Functional Specification](./docs/04-FSD.md)
- [Feature Task List](./docs/05-FTL.md)

## Author

**Saad Ferozee**
[LinkedIn](https://www.linkedin.com/in/saadferozee/) · [GitHub](https://www.github.com/saadferozee/)

## License

MIT
