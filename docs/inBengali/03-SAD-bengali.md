# SAD — System Architecture Document
## প্রজেক্ট: Nooks

---

## ১. হাই-লেভেল আর্কিটেকচার

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

## ২. কম্পোনেন্ট ব্রেকডাউন (Frontend)

```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (main)/
│   ├── layout.tsx          → Sidebar + Auth guard
│   ├── chat/[conversationId]/
│   │   └── page.tsx        → মেসেজ থ্রেড
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

## ৩. ডেটা ফ্লো — মেসেজ পাঠানো (Message Send Flow)

1. ইউজার `MessageInput`-এ টাইপ করে Send চাপে
2. ক্লায়েন্ট থেকে সরাসরি Supabase-এ `INSERT INTO messages` (Supabase JS SDK দিয়ে, RLS check হবে)
3. Postgres-এ রো ইনসার্ট হওয়া মাত্র Supabase Realtime সেই কনভারসেশনের চ্যানেলে সাবস্ক্রাইবড সব ক্লায়েন্টকে `postgres_changes` ইভেন্ট পাঠায়
4. রিসিভার-সাইড ক্লায়েন্ট (TanStack Query cache) নতুন মেসেজ instantly UI-তে দেখায় — কোনো polling লাগে না
5. মেসেজ ডেলিভার হলে রিসিভারের ক্লায়েন্ট `message_status` টেবিলে `delivered` স্ট্যাটাস আপডেট করে; রিসিভার চ্যাট ওপেন করলে `read` আপডেট হয় (Read Receipt)

## ৪. ডেটা ফ্লো — Typing Indicator (Broadcast, DB-বিহীন)

```
User A টাইপ শুরু করে
   → supabase.channel('conversation:123').send({ type: 'broadcast', event: 'typing', payload: { userId: A } })
   → Realtime সার্ভার সরাসরি অন্য সাবস্ক্রাইবারদের (User B) কাছে ফরওয়ার্ড করে
   → কোনো DB write হয় না, তাই খুবই দ্রুত ও সস্তা
```

## ৫. ডেটা ফ্লো — Online/Offline Status (Presence)

```
User লগইন করে চ্যাট পেজে ঢুকলে:
   → supabase.channel('online-users').track({ userId, status: 'online' })
   → Presence সিস্টেম স্বয়ংক্রিয়ভাবে ট্র্যাক করে কে চ্যানেলে কানেক্টেড
   → ব্রাউজার ট্যাব বন্ধ/নেট ড্রপ হলে Presence অটো "leave" ইভেন্ট পাঠায়
   → ফ্রন্টএন্ড এই ইভেন্ট শুনে অনলাইন ডট আপডেট করে
```

## ৬. মিডিয়া আপলোড ফ্লো

```
ইউজার ফাইল সিলেক্ট করে
   → ক্লায়েন্ট-সাইড ভ্যালিডেশন (max size, allowed types: image/*, pdf)
   → Supabase Storage bucket-এ আপলোড (path: conversation_id/message_id/filename)
   → পাবলিক/সাইন্ড URL জেনারেট হয়
   → messages টেবিলে media_url + media_type সহ রো ইনসার্ট
```

## ৭. সিকিউরিটি লেয়ার (RLS Policy সারাংশ)

| টেবিল | পলিসি |
|---|---|
| `messages` | শুধু ওই `conversation_id`-এর participant-রাই SELECT/INSERT করতে পারবে |
| `conversation_participants` | ইউজার শুধু নিজে যে কনভারসেশনে আছে তার তথ্য দেখতে পারবে |
| `profiles` | সবাই সবার বেসিক প্রোফাইল (নাম, অ্যাভাটার) দেখতে পারবে, কিন্তু নিজেরটাই এডিট করতে পারবে |
| Storage bucket | শুধু conversation participant-রাই সেই ফোল্ডারের ফাইল পড়তে/লিখতে পারবে |

> মেন্টর নোট: RLS পলিসি লেখাটা এই আর্কিটেকচারের সবচেয়ে ক্রিটিক্যাল অংশ। প্রতিটা টেবিল বানানোর সাথে সাথেই তার RLS পলিসি লিখে ফেলুন — পরে করব বলে ফেলে রাখবেন না, এটাই সবচেয়ে বড় সিকিউরিটি হোল তৈরি করে।
