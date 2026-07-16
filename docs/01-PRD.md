# PRD — Product Requirements Document
## Project: Nooks (Neomorphic Messaging Platform)

**Version:** 1.0
**Date:** July 15, 2026
**Author:** Saad Ferozee
**Status:** Draft — Development Ready

---

## 1. Product Vision

Build a clean, fast, visually distinct (neomorphism-based) messaging web app where users can communicate in real time via 1:1 and group chats, and share media. This project serves three goals at once:

- **Portfolio-grade showcase** — a production-quality project worth demoing in job interviews
- **Learning** — hands-on depth in Supabase Realtime, Postgres RLS (Row Level Security), and real-time architecture
- **Real product potential** — built in a way that could scale to real users later

## 2. Target Users

- Primary: small teams or friend groups who want a lightweight, private messaging tool
- Secondary: recruiters/interviewers who want to see a live demo

## 3. MVP Scope (Confirmed)

| Feature | Status |
|---|---|
| Email/OAuth authentication | MVP |
| 1:1 (direct) messaging | MVP |
| Group chat | MVP |
| Image/file sharing | MVP |
| Real-time message delivery | MVP |
| Online/offline status | MVP |
| Typing indicator | MVP |
| Read receipts (blue tick style) | MVP |
| Neomorphic UI (light + dark mode) | MVP |
| Profile editing (name, avatar, bio) | MVP |

## 4. Out of Scope (reserved for Phase 2)

- Voice/video calls
- Message reactions (emoji react)
- Message edit/delete history
- End-to-end encryption
- Push notifications (mobile)
- Multi-device sync optimization

> Mentor note: resist the urge to add these in v1. The bigger the scope, the lower the odds of finishing — this is the most common trap for solo developers.

## 5. Success Metrics

- Message delivery latency < 500ms (same region)
- 95%+ Lighthouse performance score (mobile)
- Zero unhandled crashes in production
- Realtime reconnection handled gracefully after network drops

## 6. Assumptions & Constraints

- Solo developer project, so the timeline is kept realistic (see FTL)
- Must stay within Supabase Free/Pro tier rate limits
- Web-first (desktop + mobile responsive) — no native app initially
