# FSD — Functional Specification Document
## Project: Nooks

---

## 1. Database Schema (PostgreSQL, Supabase)

```sql
-- profiles: extends auth.users
create table profiles (
  id uuid references auth.users(id) primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  status text default 'offline',       -- 'online' | 'offline'
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  name text,                            -- group name only
  avatar_url text,                      -- group avatar
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- conversation_participants
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',           -- 'admin' | 'member' (for groups)
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text,
  media_url text,
  media_type text,                      -- 'image' | 'file' | null
  created_at timestamptz default now()
);

-- message_status (for read receipts)
create table message_status (
  message_id uuid references messages(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'delivered',      -- 'delivered' | 'read'
  updated_at timestamptz default now(),
  primary key (message_id, user_id)
);
```

## 2. Feature Specifications

### FS-01: Authentication
- Email/password signup + login (Supabase Auth)
- Google OAuth (optional, Phase 1.5)
- On signup, a `profiles` row is auto-created (via a Postgres trigger)
- **Edge case:** whether unverified emails block chat access — decision: leave verification optional in the MVP, to keep testing fast

### FS-02: 1:1 Direct Messaging
- Users can search for others and start a new chat
- No duplicate conversations between the same two users — check for and reuse an existing conversation
- Message input: Enter = Send, Shift+Enter = new line

### FS-03: Group Chat
- Create group: name + multi-select members
- Admin role: can add/remove members
- Group info panel: member list, editable group avatar

### FS-04: Media Sharing
- Supported types: image (jpg, png, webp), document (pdf)
- Max size: 10MB (per Supabase Storage free-tier limits)
- Show an upload progress indicator
- Clicking an image opens a fullscreen preview

### FS-05: Online Status
- Green dot = online, gray = offline + "Last seen X min ago"
- After the presence channel disconnects, wait 30 seconds before showing offline (handles refreshes/flaky networks)

### FS-06: Typing Indicator
- "Typing..." text in the chat header or below the message list
- Auto-clears after 2 seconds of inactivity (debounced)

### FS-07: Read Receipts
- One tick (✓) = sent
- Two gray ticks (✓✓) = delivered
- Two blue ticks (✓✓) = read
- Group chats: "Read by X of Y" can be shown (Phase 1.5)

## 3. UI/UX Specification (Neomorphism)

### Brand Color Palette (Nooks)

| Role | Light mode | Dark mode | Usage |
|---|---|---|---|
| Base | #E0E5EC | #2A2D3A | Page background |
| Surface | #F5F7FA | #343849 | Raised card/element |
| Primary | #6C63FF | #8B85FF | Buttons, links, sent message bubble, active state |
| Secondary | #FF8B6B | #FF9C7F | Notification badge, unread count, highlights |
| Online/Success | #4ADE80 | #5EE499 | Reserved solely for the presence status dot |
| Text | #3A3F4B | #E4E6EB | Primary text color |

> Note: no brand color beyond Primary and Secondary should be added — keeps visual consistency intact.

- **Color palette:** a single soft base tone (e.g. #E0E5EC in light mode); every element is distinguished from that same background via raised/inset shadow
- **Shadow formula:** `box-shadow: 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff;` (raised), inset version for pressed states
- **Dark mode:** a separate base tone (around #2A2D3A) with adjusted shadow colors
- **Accessibility fix:** text color must maintain at least a 4.5:1 contrast ratio against the background — depth conveyed via shadow alone isn't enough; text color must remain dark/high-contrast regardless
- **Components:** message bubble, input field, buttons, avatar — all styled as neomorphic raised cards, with inset shadow on active/pressed state

## 4. Error Handling Requirements

- Network drop → Realtime auto-reconnect + "Reconnecting..." banner
- Failed message send → red retry icon on the bubble
- Failed file upload (wrong size/type) → inline error message
