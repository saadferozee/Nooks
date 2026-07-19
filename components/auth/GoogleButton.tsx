"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
    const supabase = createClient();

    async function handleGoogleLogin() {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            className="rounded-neo bg-base-light w-full px-4 py-3 font-medium text-ink-light shadow-neo-raised transition active:shadow-neo-pressed dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-raised-dark dark:active:shadow-neo-pressed-dark"
        >
            Continue with Google
        </button>
    );
}
