# Phase 1 — Authentication
## Project: Nooks

Follow this checklist top to bottom. Test each step before moving to the next.

---

## 1. Install form-handling dependencies

- [x] Run
  ```bash
  npm install react-hook-form zod @hookform/resolvers
  ```
  > `react-hook-form` manages form state, `zod` validates input, `@hookform/resolvers` connects the two.

## 2. Create the `profiles` table + auto-create trigger

- [x] Go to Supabase Dashboard → SQL Editor, paste and run:
  ```sql
  create table profiles (
    id uuid references auth.users(id) primary key,
    username text unique not null,
    display_name text,
    avatar_url text,
    status text default 'offline',
    last_seen timestamptz default now(),
    created_at timestamptz default now()
  );

  -- Auto-create a profile row whenever someone signs up
  create function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, username, display_name)
    values (
      new.id,
      split_part(new.email, '@', 1),
      split_part(new.email, '@', 1)
    );
    return new;
  end;
  $$ language plpgsql security definer;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  -- RLS
  alter table profiles enable row level security;

  create policy "profiles are viewable by everyone"
    on profiles for select using (true);

  create policy "users can update own profile"
    on profiles for update using (auth.uid() = id);
  ```
- [x] Confirm the table appears under Table Editor → `profiles`

## 3. Set up the route groups

- [x] Create the auth route group and pages
  ```bash
  mkdir -p "app/(auth)/login" "app/(auth)/signup"
  mkdir -p "app/(main)"
  ```
  > The `(auth)` and `(main)` folders are Next.js **route groups** — parentheses mean the folder name doesn't show up in the URL. They just let you apply different layouts to auth pages vs. the logged-in app.

## 4. Build the signup form

- [x] Create `app/(auth)/signup/page.tsx`:
  ```tsx
  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import { createClient } from "@/lib/supabase/client";

  export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    }

    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          className="neo-surface flex w-full max-w-sm flex-col gap-4 p-8"
        >
          <h1 className="text-xl font-medium">Create your account</h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="neo-pressed px-4 py-3 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="neo-pressed px-4 py-3 outline-none"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="neo-surface px-4 py-3 font-medium active:shadow-neo-pressed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <a href="/login" className="text-center text-sm text-ink-light/70 dark:text-ink-dark/70">
            Already have an account? Log in
          </a>
        </form>
      </main>
    );
  }
  ```
  > This uses plain `useState` first, not React Hook Form yet — get the raw Supabase Auth flow working before layering on form-validation. We'll swap in RHF + Zod once this works end to end (Step 8).

## 5. Build the login form

- [x] Create `app/(auth)/login/page.tsx` — same structure as signup, but swap the Supabase call:
  ```tsx
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  ```
  Copy the signup page as a starting point and change: the heading, the button text, the Supabase method above, and the bottom link (`"Don't have an account? Sign up"` → `/signup`).

## 6. Test signup + login manually

- [x] Run `npm run dev`, go to `/signup`, create a test account
- [x] Check Supabase Dashboard → Authentication → Users — confirm the new user appears
- [x] Check Table Editor → `profiles` — confirm a row was auto-created by the trigger
- [x] Go to `/login`, log in with the same credentials — confirm no errors

## 7. Protect routes with middleware

- [x] Open `middleware.ts` and extend it to redirect based on auth state:
  ```typescript
  import { createServerClient } from "@supabase/ssr";
  import { NextResponse, type NextRequest } from "next/server";

  export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request: { headers: request.headers } });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;
    const isAuthPage = path === "/login" || path === "/signup";

    if (!user && !isAuthPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user && isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  }

  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  };
  ```
- [ ] Test: while logged out, try visiting `/` directly — confirm it redirects to `/login`
- [ ] Test: while logged in, try visiting `/login` directly — confirm it redirects to `/`

## 8. Add logout functionality

- [x] Add a logout button anywhere in `app/(main)/` (e.g. a temporary button on the homepage for now):
  ```tsx
  "use client";
  import { createClient } from "@/lib/supabase/client";
  import { useRouter } from "next/navigation";

  export function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();

    async function handleLogout() {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }

    return (
      <button onClick={handleLogout} className="neo-surface px-4 py-2 text-sm">
        Log out
      </button>
    );
  }
  ```
- [x] Test: click logout, confirm you're redirected to `/login` and can no longer access `/` without logging in again

## 9. (Optional, but recommended) Layer in React Hook Form + Zod validation

- [ ] Once the raw flow works, replace the manual `useState` fields in both forms with `react-hook-form` + a `zod` schema (e.g. enforce valid email format, minimum password length with a clear error message). Do this once, then apply the same pattern to both forms.

---

## Phase 1 complete when:
- A new user can sign up, and a matching row appears in `profiles`
- A user can log in and log out
- Logged-out users get redirected away from protected pages
- Logged-in users get redirected away from `/login` and `/signup`
- No console errors during the full signup → logout → login cycle

Commit with `[Added] authentication flow: signup, login, logout, protected routes`, then move to **Phase 2 — Core 1:1 Messaging** in `docs/05-FTL.md`.