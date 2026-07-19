"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUsernameAvailability } from "@/lib/hooks/useUsernameAvailability";

export function UsernameOnboardingForm() {
    const router = useRouter();
    const supabase = createClient();
    const [username, setUsername] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const usernameStatus = useUsernameAvailability(username);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (usernameStatus !== "available") return;

        setSubmitting(true);
        setError(null);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error: updateError } = await supabase
            .from("profiles")
            .update({ username, onboarding_complete: true })
            .eq("id", user.id);

        if (updateError) {
            setError("That username was just taken — try another.");
            setSubmitting(false);
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-sm flex-col gap-4 rounded-neo bg-base-light p-8 shadow-neo-raised dark:bg-base-dark dark:shadow-neo-raised-dark"
        >
            <h1 className="text-xl font-medium text-ink-light dark:text-ink-dark">
                One last step — pick a username
            </h1>

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                className="rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
            />

            <p className="text-xs">
                {usernameStatus === "checking" && (
                    <span className="text-ink-light/50 dark:text-ink-dark/50">
                        Checking...
                    </span>
                )}
                {usernameStatus === "available" && (
                    <span className="text-online-light dark:text-online-dark">
                        ✓ Available
                    </span>
                )}
                {usernameStatus === "taken" && (
                    <span className="text-secondary-light dark:text-secondary-dark">
                        ✗ Already taken
                    </span>
                )}
            </p>

            {error && (
                <p className="text-sm text-secondary-light dark:text-secondary-dark">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={usernameStatus !== "available" || submitting}
                className="rounded-neo bg-base-light px-4 py-3 font-medium text-primary-light shadow-neo-raised disabled:opacity-50 dark:bg-base-dark dark:text-primary-dark dark:shadow-neo-raised-dark"
            >
                {submitting ? "Saving..." : "Continue"}
            </button>
        </form>
    );
}