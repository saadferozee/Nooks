# FSD — Functional Specification Document
## প্রজেক্ট: Nooks

---

## ১. ডাটাবেস স্কিমা (PostgreSQL, Supabase)

```sql
-- profiles: auth.users এর extension
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
  name text,                            -- শুধু group এর জন্য
  avatar_url text,                      -- group avatar
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- conversation_participants
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',           -- 'admin' | 'member' (group এর জন্য)
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

-- message_status (Read Receipts এর জন্য)
create table message_status (
  message_id uuid references messages(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'delivered',      -- 'delivered' | 'read'
  updated_at timestamptz default now(),
  primary key (message_id, user_id)
);
```

## ২. ফিচার স্পেসিফিকেশন

### FS-01: অথেনটিকেশন
- ইমেইল/পাসওয়ার্ড সাইনআপ + লগইন (Supabase Auth)
- Google OAuth (অপশনাল, Phase 1.5)
- সাইনআপের পর `profiles` টেবিলে অটো রো তৈরি হবে (Postgres trigger দিয়ে)
- **Edge case:** ইমেইল ভেরিফাই না করলে চ্যাট অ্যাক্সেস ব্লক করা হবে কিনা — সিদ্ধান্ত: MVP-তে ভেরিফিকেশন অপশনাল রাখা হবে, দ্রুত টেস্ট করার সুবিধার জন্য

### FS-02: 1:1 ডাইরেক্ট মেসেজিং
- ইউজার সার্চ করে নতুন চ্যাট শুরু করতে পারবে
- একই দুই ইউজারের মধ্যে duplicate conversation তৈরি হবে না (চেক করে existing conversation reuse করতে হবে)
- মেসেজ ইনপুটে Enter = Send, Shift+Enter = New line

### FS-03: গ্রুপ চ্যাট
- গ্রুপ তৈরি: নাম + একাধিক মেম্বার সিলেক্ট
- Admin রোল: মেম্বার add/remove করতে পারবে
- গ্রুপ ইনফো প্যানেল: মেম্বার লিস্ট, গ্রুপ অ্যাভাটার এডিট

### FS-04: মিডিয়া শেয়ারিং
- সাপোর্টেড টাইপ: image (jpg, png, webp), document (pdf)
- ম্যাক্স সাইজ: ১০MB (Supabase Storage free tier অনুযায়ী)
- আপলোড প্রোগ্রেস ইন্ডিকেটর দেখাতে হবে
- ইমেজ ক্লিক করলে ফুলস্ক্রিন প্রিভিউ

### FS-05: Online Status
- সবুজ ডট = Online, ধূসর = Offline + "Last seen X min ago"
- Presence চ্যানেল ডিসকানেক্ট হলে ৩০ সেকেন্ড grace period পর Offline দেখানো (রিফ্রেশ/ফ্ল্যাকি নেট হ্যান্ডেল করতে)

### FS-06: Typing Indicator
- "টাইপ করছে..." টেক্সট চ্যাট হেডারে বা মেসেজ লিস্টের নিচে
- ২ সেকেন্ড ইনঅ্যাক্টিভিটির পর অটো বন্ধ হবে (debounce)

### FS-07: Read Receipts
- একটা টিক (✓) = পাঠানো হয়েছে
- দুইটা ধূসর টিক (✓✓) = ডেলিভার হয়েছে
- দুইটা নীল টিক (✓✓) = পড়া হয়েছে
- গ্রুপ চ্যাটে: "Read by X of Y" দেখানো যেতে পারে (Phase 1.5)

## ৩. UI/UX স্পেসিফিকেশন (Neomorphism)

### ব্র্যান্ড কালার প্যালেট (Nooks)

| রোল | Light Mode | Dark Mode | ব্যবহার |
|---|---|---|---|
| Base | #E0E5EC | #2A2D3A | পেজ ব্যাকগ্রাউন্ড |
| Surface | #F5F7FA | #343849 | Raised card/element |
| Primary | #6C63FF | #8B85FF | বাটন, লিংক, sent মেসেজ বাবল, active state |
| Secondary | #FF8B6B | #FF9C7F | Notification badge, unread count, highlight |
| Online/Success | #4ADE80 | #5EE499 | শুধু presence status dot এর জন্য reserved |
| Text | #3A3F4B | #E4E6EB | Primary text color |

> নোট: Primary ও Secondary কালার ছাড়া অন্য কোনো ব্র্যান্ড কালার যোগ করা হবে না — এতে ভিজ্যুয়াল কনসিস্টেন্সি বজায় থাকবে।

- **কালার প্যালেট:** Base background একটাই soft tone (যেমন #E0E5EC light mode), সব এলিমেন্ট একই background থেকে raised/inset shadow দিয়ে আলাদা বোঝানো হবে
- **Shadow ফর্মুলা:** `box-shadow: 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff;` (raised), inset ভার্সন pressed state-এর জন্য
- **Dark Mode:** আলাদা base tone (#2A2D3A এর মতো) সহ shadow color adjust
- **Accessibility fix:** টেক্সট কালার background-এর সাথে কমপক্ষে ৪.৫:১ কনট্রাস্ট রাখতে হবে — শুধু shadow দিয়ে ডিপথ বোঝালেও টেক্সট কালার আলাদাভাবে dark/high-contrast রাখা বাধ্যতামূলক
- **কম্পোনেন্ট:** Message bubble, Input field, Buttons, Avatar — সবই neomorphic raised card স্টাইলে, active/pressed state-এ inset shadow

## ৪. এরর হ্যান্ডলিং রিকোয়ারমেন্ট

- নেটওয়ার্ক ড্রপ হলে Realtime auto-reconnect + "Reconnecting..." ব্যানার
- মেসেজ সেন্ড ফেইল হলে বাবল-এ red retry icon
- ফাইল আপলোড ফেইল হলে (সাইজ/টাইপ ভুল) ইনলাইন এরর মেসেজ
