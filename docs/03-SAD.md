# SAD — System Architecture Document
## Project: Nooks

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js App (React)                               │  │
│  │  - Auth Pages   - Chat UI   - Profile               │  │
│  │  - Zustand (client state)                           │  │
│  │  - TanStack Query (server cache)                    │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────┬─────────────────┘
                │ (HTTPS/REST)          │ (WebSocket)
                ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                      SUPABASE (BaaS)                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ │
│  │   Auth     │ │ PostgREST │ │ Realtime   │ │ Storage  │ │
│  │ (JWT/OAuth)│ │ (Auto API)│ │ (WS server)│ │ (Buckets)│ │
│  └─────┬──────┘ └─────┬─────┘ └─────┬──────┘ └────┬─────┘ │
│        └──────────────┴─────────────┴─────────────┘      │
│                        ▼                                  │
│               ┌─────────────────┐                         │
│               │  PostgreSQL DB   │                         │
│               │  (with RLS)      │                         │
│               └─────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## 2. Component Breakdown (Frontend)

```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (main)/
│   ├── layout.tsx          → Sidebar + auth guard
│   ├── chat/[conversationId]/
│   │   └── page.tsx        → message thread
│   └── profile/
├── components/
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── ConversationList.tsx
│   │   └── OnlineStatusDot.tsx
│   ├── ui/                 → Neomorphic base components (Button, Card, Input, Avatar)
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts        → Browser client
│   │   └── server.ts        → Server component client
│   ├── hooks/
│   │   ├── useRealtimeMessages.ts
│   │   ├── usePresence.ts
│   │   └── useTypingStatus.ts
│   └── stores/               → Zustand stores
```

## 3. Data Flow — Sending a Message

1. User types in `MessageInput` and hits Send
2. Client `INSERT`s directly into `messages` via the Supabase JS SDK (RLS is checked)
3. The moment the row lands in Postgres, Supabase Realtime pushes a `postgres_changes` event to every client subscribed to that conversation's channel
4. The receiving client's TanStack Query cache updates instantly — no polling needed
5. Once delivered, the receiver's client updates `message_status` to `delivered`; opening the chat updates it to `read` (read receipt)

## 4. Data Flow — Typing Indicator (Broadcast, no DB writes)

```
User A starts typing
   → supabase.channel('conversation:123').send({ type: 'broadcast', event: 'typing', payload: { userId: A } })
   → Realtime server forwards it directly to other subscribers (User B)
   → No DB write happens, so it's fast and cheap
```

## 5. Data Flow — Online/Offline Status (Presence)

```
User logs in and opens the chat page:
   → supabase.channel('online-users').track({ userId, status: 'online' })
   → Presence automatically tracks who's connected to the channel
   → Closing the tab / dropping the connection auto-fires a "leave" event
   → Frontend listens and updates the online dot accordingly
```

## 6. Media Upload Flow

```
User selects a file
   → Client-side validation (max size, allowed types: image/*, pdf)
   → Upload to Supabase Storage bucket (path: conversation_id/message_id/filename)
   → Generate public/signed URL
   → Insert row into messages with media_url + media_type
```

## 7. Security Layer (RLS Policy Summary)

| Table | Policy |
|---|---|
| `messages` | Only participants of that `conversation_id` can SELECT/INSERT |
| `conversation_participants` | Users can only see participant data for conversations they belong to |
| `profiles` | Everyone can see basic profile info (name, avatar), but can only edit their own |
| Storage bucket | Only conversation participants can read/write files in that folder |

> Mentor note: RLS policies are the most critical part of this architecture. Write the RLS policy the moment you create a table — don't push it off to "later," that's exactly how the biggest security holes happen.
