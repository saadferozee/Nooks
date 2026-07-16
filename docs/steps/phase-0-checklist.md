# Phase 0 — Setup & Foundation
## Project: Nooks

Follow this checklist top to bottom. Check off each step before moving to the next — don't skip ahead even if something looks optional.

---

## 1. Environment check

- [x] Confirm Node version is 18.17+
  ```bash
  node -v
  ```

## 2. Create the Next.js project

- [x] Run the CLI
  ```bash
  npx create-next-app@latest nooks
  ```
- [x] Answer the prompts:
  | Prompt | Answer |
  |---|---|
  | TypeScript? | Yes |
  | ESLint? | Yes |
  | Tailwind CSS? | Yes |
  | `src/` directory? | No |
  | App Router? | Yes |
  | Customize import alias? | No |

- [x] Move into the project and verify it runs
  ```bash
  cd nooks
  npm run dev
  ```
- [x] Open `http://localhost:3000` — confirm the default Next.js starter page loads
- [x] Stop the server (`Ctrl+C`) once confirmed

## 3. Confirm Tailwind is active

- [x] Check `package.json` for `tailwindcss` under dependencies
- [x] Confirm `tailwind.config.ts` and `postcss.config.mjs` exist in the project root
- [x] Confirm `app/globals.css` has `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` (or `@import "tailwindcss";` if on Tailwind v4)

## 4. Create the Supabase project (if not already done)

- [x] Go to [supabase.com](https://supabase.com), sign in, create a new project
- [x] Wait for provisioning to finish (a couple of minutes)
- [x] Go to **Settings → API Keys**
- [x] Copy the **Project URL**
- [x] Copy the **Publishable key** (this replaces the older "anon key" — same purpose, safe for client-side code)

## 5. Install Supabase packages

- [x] Run
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

## 6. Set up environment variables

- [x] Create both files in the project root
  ```bash
  touch .env.local .env.local.example
  ```
- [x] `.env.local.example` (safe to commit — template only):
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
  ```
- [x] `.env.local` (never commit — real values):
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-actual-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-publishable-key
  ```
- [x] Confirm `.gitignore` contains `.env*.local` (default in `create-next-app` — no changes needed)

## 7. Create the Supabase browser client

- [x] Create the folder and file
  ```bash
  mkdir -p lib/supabase
  touch lib/supabase/client.ts
  ```
- [x] Paste this code:
  ```typescript
  import { createBrowserClient } from "@supabase/ssr";

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  ```

## 8. Create the Supabase server client

- [x] Create the file
  ```bash
  touch lib/supabase/server.ts
  ```
- [x] Paste this code (uses the `getAll`/`setAll` cookie pattern and `await cookies()`, required on current Next.js versions):
  ```typescript
  import { createServerClient } from "@supabase/ssr";
  import { cookies } from "next/headers";

  export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component — safe to ignore,
              // since middleware handles session refresh separately.
            }
          },
        },
      }
    );
  }
  ```
- [x] Remember: this function is `async` — every place you call it needs `await createClient()`

## 9. Create the auth session middleware

- [x] Create the file at the project root (not inside `app/`)
  ```bash
  touch middleware.ts
  ```
- [x] Paste this code:
  ```typescript
  import { createServerClient } from "@supabase/ssr";
  import { NextResponse, type NextRequest } from "next/server";

  export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refreshes the auth session on every request.
    await supabase.auth.getUser();

    return response;
  }

  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  };
  ```
- [x] This is what makes `server.ts`'s cookie-write limitation safe to ignore — middleware runs on every request and keeps the session cookie fresh, independent of Server Components.

## 10. Add the neomorphic base styles

- [x] Open `tailwind.config.ts` and add the Nooks brand colors under `theme.extend.colors`:
  ```typescript
  colors: {
    base: { light: "#E0E5EC", dark: "#2A2D3A" },
    surface: { light: "#F5F7FA", dark: "#343849" },
    primary: { light: "#6C63FF", dark: "#8B85FF" },
    secondary: { light: "#FF8B6B", dark: "#FF9C7F" },
    online: { light: "#4ADE80", dark: "#5EE499" },
    ink: { light: "#3A3F4B", dark: "#E4E6EB" },
  },
  ```
- [x] Open `app/globals.css` and add reusable neomorphic surface classes below the `@tailwind` imports:
  ```css
  :root {
    --neo-base: #e0e5ec;
    --neo-text: #3a3f4b;
  }

  .dark {
    --neo-base: #2a2d3a;
    --neo-text: #e4e6eb;
  }

  body {
    background-color: var(--neo-base);
    color: var(--neo-text);
  }

  .neo-surface {
    background-color: var(--neo-base);
    border-radius: 20px;
    box-shadow: 6px 6px 12px #b8bcc5, -6px -6px 12px #ffffff;
  }

  .dark .neo-surface {
    box-shadow: 6px 6px 12px #21232d, -6px -6px 12px #333747;
  }
  ```

## 11. Verify everything together

- [x] Run the dev server again
  ```bash
  npm run dev
  ```
- [x] Confirm no TypeScript/build errors in the terminal
- [x] Confirm `http://localhost:3000` still loads without errors

## 12. Documentation and Git

- [x] Create a `docs/` folder in the project root and place `01-PRD.md` through `05-FTL.md` inside it
- [x] Confirm `.gitignore` excludes `node_modules/`, `.next/`, `.env.local`
- [x] Commit and push
  ```bash
  git add .
  git commit -m "Phase 0: Next.js + Tailwind + Supabase setup"
  git push
  ```

---

## Phase 0 complete when:
- Dev server runs with zero errors
- `.env.local` has real Supabase credentials, `.env.local.example` is committed instead
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, and `middleware.ts` all exist and match the code above
- Brand colors and neomorphic base styles are in `tailwind.config.ts` / `globals.css`
- Everything is committed and pushed to GitHub

Once all boxes are checked, move to **Phase 1 — Authentication** in `docs/05-FTL.md`.
