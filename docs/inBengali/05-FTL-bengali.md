# FTL — Feature Task List (Development Roadmap)
## প্রজেক্ট: Nooks

সিঙ্গেল ডেভেলপার হিসেবে বাস্তবসম্মত টাইমলাইন ধরে ৬টা ফেজে ভাগ করা হয়েছে। প্রতিটা ফেজ শেষে একটা workable ডেমো থাকবে — এতে মোটিভেশন ধরে রাখা সহজ হবে।

---

## Phase 0: Setup & Foundation (২-৩ দিন)
- [ ] Next.js প্রজেক্ট ইনিশিয়ালাইজ (App Router, TypeScript)
- [ ] Tailwind CSS কনফিগার + Neomorphic base utility classes লেখা
- [ ] Supabase প্রজেক্ট তৈরি (Cloud, free tier)
- [ ] Supabase JS SDK কানেক্ট (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] `.env.local` সেটআপ (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Folder structure সাজানো (SAD অনুযায়ী)

## Phase 1: Authentication (৩-৪ দিন)
- [ ] Signup/Login পেজ UI (Neomorphic form)
- [ ] Supabase Auth ইন্টিগ্রেশন (email/password)
- [ ] `profiles` টেবিল + trigger (নতুন user সাইনআপে auto profile তৈরি)
- [ ] Protected route middleware (Next.js middleware.ts দিয়ে)
- [ ] Logout ফাংশনালিটি
- [ ] **Milestone:** ইউজার সাইনআপ/লগইন করে dashboard-এ ঢুকতে পারবে

## Phase 2: Core 1:1 Messaging (৫-৬ দিন)
- [ ] `conversations`, `conversation_participants`, `messages` টেবিল তৈরি
- [ ] RLS পলিসি লেখা ও টেস্ট করা (প্রতিটা টেবিলের জন্য)
- [ ] ইউজার সার্চ + নতুন conversation তৈরি
- [ ] মেসেজ পাঠানো/দেখানো (static fetch দিয়ে প্রথমে, realtime ছাড়া)
- [ ] Supabase Realtime সাবস্ক্রাইব করে instant message update
- [ ] মেসেজ বাবল UI (sent vs received স্টাইল আলাদা)
- [ ] **Milestone:** দুইজন ইউজার রিয়েল-টাইমে 1:1 মেসেজ চালাচালি করতে পারবে

## Phase 3: Group Chat (৩-৪ দিন)
- [ ] গ্রুপ তৈরির UI + মাল্টি-সিলেক্ট মেম্বার পিকার
- [ ] Group conversation লজিক (type='group')
- [ ] Admin/Member রোল হ্যান্ডলিং
- [ ] গ্রুপ ইনফো প্যানেল (মেম্বার লিস্ট, add/remove)
- [ ] **Milestone:** ৩+ ইউজার একটা গ্রুপে মেসেজ করতে পারবে

## Phase 4: Realtime Presence Features (৩-৪ দিন)
- [ ] Presence চ্যানেল সেটআপ (Online/Offline)
- [ ] Online status dot + "Last seen" UI
- [ ] Broadcast চ্যানেল দিয়ে Typing indicator
- [ ] `message_status` টেবিল + Read Receipt লজিক (✓/✓✓/নীল ✓✓)
- [ ] **Milestone:** সম্পূর্ণ WhatsApp-স্টাইল রিয়েল-টাইম ফিডব্যাক কাজ করবে

## Phase 5: Media Sharing (২-৩ দিন)
- [ ] Supabase Storage bucket তৈরি + RLS পলিসি
- [ ] ফাইল আপলোড UI (drag-drop + click)
- [ ] আপলোড প্রোগ্রেস বার
- [ ] ইমেজ প্রিভিউ/লাইটবক্স
- [ ] ফাইল টাইপ/সাইজ ভ্যালিডেশন
- [ ] **Milestone:** ইমেজ ও ফাইল শেয়ার করা যাবে

## Phase 6: Polish & Deploy (৩-৪ দিন)
- [ ] Dark mode টগল (Neomorphic dark palette)
- [ ] প্রোফাইল এডিট পেজ (নাম, অ্যাভাটার, বায়ো)
- [ ] Responsive/Mobile UI টেস্ট ও ফিক্স
- [ ] Loading states, Skeleton screens
- [ ] Error boundary + Reconnect UI
- [ ] Lighthouse audit + পারফরম্যান্স অপটিমাইজেশন
- [ ] Vercel-এ ডিপ্লয় + কাস্টম ডোমেইন (যদি থাকে)
- [ ] README + ডেমো ভিডিও/GIF (পোর্টফোলিও/LinkedIn এর জন্য)
- [ ] **Milestone:** প্রোডাকশন-রেডি, শেয়ারযোগ্য লিংক

---

## সর্বমোট আনুমানিক সময়: ৩.৫ - ৪.৫ সপ্তাহ (প্রতিদিন ২-৩ ঘণ্টা ধরে)

## মেন্টর টিপস
1. **RLS প্রথমেই লিখুন, শেষে না** — Phase 2-তেই টেবিল বানানোর সাথে সাথে পলিসি লিখুন
2. **প্রতি Phase শেষে Git commit + push** — পোর্টফোলিওতে commit history-ও একটা সিগন্যাল
3. **Realtime ডিবাগ করার সময়** দুইটা ব্রাউজার (একটা normal, একটা incognito) দিয়ে দুইজন ইউজার সিমুলেট করে টেস্ট করুন
4. **Phase 4 (Presence/Typing)** সবচেয়ে বেশি "মাথা ঘামানোর" জায়গা — edge cases (ট্যাব বন্ধ, নেট ড্রপ) আগে থেকেই মাথায় রাখুন
