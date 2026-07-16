# TAD — Technical Architecture Document
## Project: Nooks

---

## 1. Technology Stack (Final Decision)

| Layer | Technology | Reasoning |
|---|---|---|
| Frontend framework | **Next.js 14+ (App Router)** | SSR, route protection, API routes, good SEO — matters for a portfolio project |
| UI library | **React 18+** | Built into Next.js |
| Styling | **Tailwind CSS + custom neomorphic utility classes** | Fast to build, consistent shadow/spacing system |
| Backend/BaaS | **Supabase** (Auth + Postgres DB + Realtime + Storage) | One platform for everything needed, easy transition from MERN experience |
| Database | **PostgreSQL (Supabase managed)** | Supabase's own Postgres instance — no separate DB hosting needed |
| Realtime | **Supabase Realtime** (Postgres Changes + Presence + Broadcast) | No need to run and maintain a separate Socket.io server |
| State management | **Zustand** (client state) + **TanStack Query** (server state/cache) | Lightweight, low boilerplate, plays well with Next.js |
| File uploads | **Supabase Storage** (bucket-based) | Integrated with Auth, secured via RLS |
| Form handling | **React Hook Form + Zod** | Type-safe validation |
| Deployment (frontend) | **Vercel** | Native host for Next.js, free tier is enough |
| Deployment (backend) | **Supabase Cloud** | Fully managed, no server maintenance |

## 2. Key Architectural Decisions (ADR — Architecture Decision Records)

### ADR-01: Supabase = Auth + DB, not two separate things
The earlier assumption was "PostgreSQL is separate, Supabase Auth is separate" — that's not accurate. Supabase itself provides a managed PostgreSQL instance, and Auth tables (`auth.users`) live in the same database. **Decision:** the entire backend lives in a single Supabase project.

### ADR-02: Supabase Realtime instead of Socket.io
Supabase Realtime offers three modes:
- **Postgres Changes** — subscribed clients get notified the instant a row is inserted into the DB (used for new messages)
- **Presence** — tracks who's online (Online status)
- **Broadcast** — ephemeral events that never touch the DB (perfect for typing indicators, since there's nothing to persist)

**Decision:** Messages = Postgres Changes, Online status = Presence, Typing = Broadcast.

### ADR-03: Row Level Security (RLS) is mandatory
Since the frontend talks to the DB directly through the Supabase client (no custom Express/Node backend in between), **every table without an RLS policy is unsecured data.** This cannot be skipped — it's your only security layer.

### ADR-04: No custom Node/Express backend needed (for MVP)
Coming from MERN, the instinct might be to spin up an Express backend, but it's not needed here — Supabase already provides the API layer (PostgREST + Realtime). If complex business logic comes up later (e.g. notification processing), use **Supabase Edge Functions**, not a separate server.

## 3. Non-Functional Requirements

- **Performance:** message list virtualization (react-window) — keeps scrolling smooth on long chat histories
- **Security:** RLS + Supabase Auth JWT validation + file-type/size validation on image uploads
- **Scalability:** use Supabase's connection pooling (Supavisor)
- **Accessibility:** maintain WCAG AA contrast ratios even within the neomorphic design (minimum 4.5:1 for text)

## 4. Laptop Considerations

On a MacBook Pro 2013 (i7, 16GB RAM, GT 750M), running the Next.js dev server alongside local Supabase (Docker) at the same time can strain RAM. **Recommendation:** skip local Supabase (Docker) entirely and use a free-tier Supabase Cloud dev project directly — this saves local resources.
