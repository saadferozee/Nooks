# TAD — Technical Architecture Document
## প্রজেক্ট: Nooks

---

## ১. টেকনোলজি স্ট্যাক (Final Decision)

| লেয়ার | টেকনোলজি | কারণ |
|---|---|---|
| Frontend Framework | **Next.js 14+ (App Router)** | SSR, Route protection, API routes, ভালো SEO — Portfolio প্রজেক্টে গুরুত্বপূর্ণ |
| UI Library | **React 18+** | Next.js এর সাথে built-in |
| স্টাইলিং | **Tailwind CSS + Custom Neomorphic Utility Classes** | দ্রুত ডেভেলপমেন্ট, কনসিস্টেন্ট shadow/spacing সিস্টেম |
| ব্যাকএন্ড/BaaS | **Supabase** (Auth + Postgres DB + Realtime + Storage) | একটাই প্ল্যাটফর্মে সব দরকারি সার্ভিস, MERN stack অভিজ্ঞতা থেকে ট্রানজিশন সহজ |
| ডাটাবেস | **PostgreSQL (Supabase managed)** | Supabase-এর নিজস্ব Postgres ইনস্ট্যান্স — আলাদা DB হোস্ট করা লাগবে না |
| রিয়েল-টাইম | **Supabase Realtime** (Postgres Changes + Presence + Broadcast) | Socket.io সার্ভার আলাদা মেইনটেইন করা লাগবে না |
| State Management | **Zustand** (client state) + **TanStack Query** (server state/cache) | হালকা, boilerplate কম, Next.js-এর সাথে ভালো কাজ করে |
| ফাইল আপলোড | **Supabase Storage** (bucket-based) | Auth-এর সাথেই ইন্টিগ্রেটেড, RLS দিয়ে সিকিউর করা যায় |
| ফর্ম হ্যান্ডলিং | **React Hook Form + Zod** | টাইপ-সেফ ভ্যালিডেশন |
| ডিপ্লয়মেন্ট (Frontend) | **Vercel** | Next.js-এর নেটিভ হোস্ট, ফ্রি টায়ার যথেষ্ট |
| ডিপ্লয়মেন্ট (Backend) | **Supabase Cloud** | ম্যানেজড, নিজে সার্ভার মেইনটেইন করা লাগবে না |

## ২. গুরুত্বপূর্ণ আর্কিটেকচারাল সিদ্ধান্ত (ADR — Architecture Decision Records)

### ADR-01: Supabase = Auth + DB, আলাদা না
আপনার আগের ধারণা ছিল "PostgreSQL আলাদা, Supabase Auth আলাদা" — এটা ঠিক না। Supabase নিজেই একটা managed PostgreSQL ইনস্ট্যান্স দেয়, Auth টেবিলগুলো (`auth.users`) একই ডাটাবেসে থাকে। **সিদ্ধান্ত:** পুরো ব্যাকএন্ড একটাই Supabase প্রজেক্টে থাকবে।

### ADR-02: Realtime এর জন্য Socket.io না, Supabase Realtime
Supabase Realtime তিনটা মোড দেয়:
- **Postgres Changes** — DB-তে INSERT হলেই সাবস্ক্রাইবড ক্লায়েন্ট পাবে (নতুন মেসেজের জন্য ব্যবহার হবে)
- **Presence** — কে অনলাইন আছে ট্র্যাক করার জন্য (Online status)
- **Broadcast** — ephemeral ইভেন্ট পাঠানোর জন্য, DB-তে সেভ হয় না (Typing indicator-এর জন্য পারফেক্ট, কারণ এটা DB-তে লেখার দরকার নেই)

**সিদ্ধান্ত:** Message = Postgres Changes, Online status = Presence, Typing = Broadcast।

### ADR-03: Row Level Security (RLS) বাধ্যতামূলক
যেহেতু ফ্রন্টএন্ড থেকে সরাসরি Supabase ক্লায়েন্ট দিয়ে DB-তে অ্যাক্সেস হবে (কোনো কাস্টম Express/Node ব্যাকএন্ড নেই), তাই **প্রতিটা টেবিলে RLS পলিসি ছাড়া ডেটা সিকিউর থাকবে না।** এটা স্কিপ করা যাবে না — এটাই আপনার একমাত্র সিকিউরিটি লেয়ার।

### ADR-04: কাস্টম Node/Express ব্যাকএন্ড লাগবে না (MVP-তে)
আপনার MERN অভিজ্ঞতা থেকে Express ব্যাকএন্ড বানানোর অভ্যাস থাকতে পারে, কিন্তু এই প্রজেক্টে সেটার দরকার নেই — Supabase নিজেই API লেয়ার (PostgREST + Realtime) দিয়ে দিচ্ছে। ভবিষ্যতে কমপ্লেক্স বিজনেস লজিক (যেমন নোটিফিকেশন প্রসেসিং) লাগলে **Supabase Edge Functions** ব্যবহার করবেন, আলাদা সার্ভার না।

## ৩. নন-ফাংশনাল রিকোয়ারমেন্ট

- **পারফরম্যান্স:** মেসেজ লিস্ট ভার্চুয়ালাইজেশন (react-window) — লম্বা চ্যাট হিস্ট্রিতে স্ক্রল স্মুথ রাখার জন্য
- **সিকিউরিটি:** RLS + Supabase Auth JWT ভ্যালিডেশন + ইমেজ আপলোডে ফাইল-টাইপ/সাইজ ভ্যালিডেশন
- **স্কেলেবিলিটি:** Supabase Connection Pooling (Supavisor) ব্যবহার
- **অ্যাক্সেসিবিলিটি:** Neomorphism ডিজাইনেও WCAG AA কনট্রাস্ট রেশিও মেনে চলা (৪.৫:১ মিনিমাম টেক্সটের জন্য)

## ৪. আপনার ল্যাপটপ কনসিডারেশন

আপনার MacBook Pro 2013 (i7, 16GB RAM, GT 750M) দিয়ে Next.js dev server + Supabase local (Docker) একসাথে চালালে RAM চাপ পড়তে পারে। **পরামর্শ:** লোকাল Supabase (Docker) না চালিয়ে সরাসরি Supabase Cloud-এর ফ্রি টায়ার dev প্রজেক্ট ব্যবহার করুন — এতে লোকাল রিসোর্স বাঁচবে।
