"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "./GoogleButton";

export function LoginForm() {
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

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="neo-surface flex w-full max-w-sm flex-col gap-4 p-8"
        >
            <h1 className="text-xl font-bold ">Login </h1>

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
                {loading ? "Loging in..." : "Login"}
            </button>

            <a
                href="/signup"
                className="text-center text-sm text-ink-light/70 dark:text-ink-dark/70"
            >
                Don&apos;t have an account? Signup
            </a>

            <div className="flex items-center gap-2 text-xs text-ink-light/50 dark:text-ink-dark/50">
                <div className="h-px flex-1 bg-ink-light/20 dark:bg-ink-dark/20" />
                or
                <div className="h-px flex-1 bg-ink-light/20 dark:bg-ink-dark/20" />
            </div>
            <GoogleButton />
        </form>
    );
}
