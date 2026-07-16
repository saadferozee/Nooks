# FTL — Feature Task List (Development Roadmap)
## Project: Nooks

Broken into 6 phases with a realistic timeline for a solo developer. Each phase ends with a working demo — this keeps motivation intact.

---

## Phase 0: Setup & Foundation (2-3 days)
- [X] Initialize Next.js project (App Router, TypeScript)
- [ ] Configure Tailwind CSS + write neomorphic base utility classes
- [ ] Create Supabase project (Cloud, free tier)
- [ ] Connect Supabase JS SDK (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Set up `.env.local` (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Organize folder structure (per SAD)

## Phase 1: Authentication (3-4 days)
- [ ] Signup/Login page UI (neomorphic form)
- [ ] Supabase Auth integration (email/password)
- [ ] `profiles` table + trigger (auto-create profile on signup)
- [ ] Protected route middleware (via Next.js middleware.ts)
- [ ] Logout functionality
- [ ] **Milestone:** users can sign up/log in and land on the dashboard

## Phase 2: Core 1:1 Messaging (5-6 days)
- [ ] Create `conversations`, `conversation_participants`, `messages` tables
- [ ] Write and test RLS policies (for every table)
- [ ] User search + creating a new conversation
- [ ] Send/display messages (static fetch first, no realtime yet)
- [ ] Subscribe to Supabase Realtime for instant message updates
- [ ] Message bubble UI (distinct sent vs received styles)
- [ ] **Milestone:** two users can exchange 1:1 messages in real time

## Phase 3: Group Chat (3-4 days)
- [ ] Group creation UI + multi-select member picker
- [ ] Group conversation logic (type='group')
- [ ] Admin/member role handling
- [ ] Group info panel (member list, add/remove)
- [ ] **Milestone:** 3+ users can message in a group

## Phase 4: Realtime Presence Features (3-4 days)
- [ ] Set up Presence channel (online/offline)
- [ ] Online status dot + "Last seen" UI
- [ ] Typing indicator via Broadcast channel
- [ ] `message_status` table + read receipt logic (✓ / ✓✓ / blue ✓✓)
- [ ] **Milestone:** full WhatsApp-style realtime feedback works

## Phase 5: Media Sharing (2-3 days)
- [ ] Create Supabase Storage bucket + RLS policy
- [ ] File upload UI (drag-drop + click)
- [ ] Upload progress bar
- [ ] Image preview/lightbox
- [ ] File type/size validation
- [ ] **Milestone:** images and files can be shared

## Phase 6: Polish & Deploy (3-4 days)
- [ ] Dark mode toggle (neomorphic dark palette)
- [ ] Profile edit page (name, avatar, bio)
- [ ] Responsive/mobile UI testing and fixes
- [ ] Loading states, skeleton screens
- [ ] Error boundary + reconnect UI
- [ ] Lighthouse audit + performance optimization
- [ ] Deploy to Vercel + custom domain (if available)
- [ ] README + demo video/GIF (for portfolio/LinkedIn)
- [ ] **Milestone:** production-ready, shareable link

---

## Total estimated time: 3.5 - 4.5 weeks (at 2-3 hours/day)

## Mentor Tips
1. **Write RLS policies first, not last** — as soon as a table is created in Phase 2, write its policy
2. **Commit + push to Git after every phase** — commit history is itself a portfolio signal
3. **When debugging realtime,** use two browsers (one normal, one incognito) to simulate two users
4. **Phase 4 (Presence/Typing)** is the trickiest — think through edge cases (closed tabs, dropped network) ahead of time
