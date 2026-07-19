"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPasswordChecks, isPasswordValid } from "@/lib/validation/password";
import { useUsernameAvailability } from "@/lib/hooks/useUsernameAvailability";
import { GoogleButton } from "./GoogleButton";

type Step = 1 | 2 | 3;
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function SignupForm() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState<Step>(1);

    // collecting basic details
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step1Error, setStep1Error] = useState<string | null>(null);

    // username setup
    const [username, setUsername] = useState("");
    // const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
    const usernameStatus = useUsernameAvailability(username);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const passwordChecks = getPasswordChecks(password);
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    function handleStep1Submit(e: React.FormEvent) {
        e.preventDefault();
        setStep1Error(null);

        if (!isPasswordValid(password)) {
            setStep1Error("Password doesn't meet all requirements yet.");
            return;
        }
        if (!passwordsMatch) {
            setStep1Error("Passwords don't match.");
            return;
        }
        setStep(2);
    }

    // Debounced live username availability check
    // useEffect(() => {
    //     if (username.length < 3) {
    //         // eslint-disable-next-line react-hooks/set-state-in-effect
    //         setUsernameStatus("idle");
    //         return;
    //     }
    //     if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    //         setUsernameStatus("invalid");
    //         return;
    //     }

    //     setUsernameStatus("checking");
    //     const timeout = setTimeout(async () => {
    //         const { data } = await supabase
    //             .from("profiles")
    //             .select("id")
    //             .eq("username", username)
    //             .maybeSingle();

    //         setUsernameStatus(data ? "taken" : "available");
    //     }, 500);

    //     return () => clearTimeout(timeout);
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [username]);

    async function handleFinalSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (usernameStatus !== "available") return;

        setSubmitting(true);
        setSubmitError(null);

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            setSubmitError(error.message);
            setSubmitting(false);
            return;
        }
        if (!data.user) {
            setSubmitError("Something went wrong. Please try again.");
            setSubmitting(false);
            return;
        }

        // The trigger already created a default profiles row (username = email
        // prefix). Overwrite it with what the user actually picked.
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                username,
                display_name: displayName,
                onboarding_complete: true,
            })
            .eq("id", data.user.id);

        if (profileError) {
            // Rare race condition: someone else took this exact username in the few seconds between the check and this update.
            setSubmitError(
                "That username was just taken — please go back and pick another.",
            );
            setSubmitting(false);
            setStep(2);
            // setUsernameStatus("taken");
            return;
        }

        setStep(3);
        setTimeout(() => {
            router.push("/");
            router.refresh();
        }, 1200);
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-neo bg-base-light p-8 shadow-neo-raised dark:bg-base-dark dark:shadow-neo-raised-dark">
            {step === 1 && (
                <form
                    onSubmit={handleStep1Submit}
                    className="flex flex-col gap-4"
                >
                    <h1 className="text-xl font-medium text-ink-light dark:text-ink-dark">
                        Create your account
                    </h1>

                    <input
                        type="text"
                        placeholder="Full name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
                    />

                    <ul className="flex flex-col gap-1 text-xs">
                        {passwordChecks.map((check) => (
                            <li
                                key={check.label}
                                className={
                                    check.passed
                                        ? "text-online-light dark:text-online-dark"
                                        : "text-ink-light/50 dark:text-ink-dark/50"
                                }
                            >
                                {check.passed ? "✓" : "○"} {check.label}
                            </li>
                        ))}
                    </ul>

                    {step1Error && (
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            {step1Error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="rounded-neo bg-base-light px-4 py-3 font-medium text-ink-light shadow-neo-raised transition active:shadow-neo-pressed dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-raised-dark dark:active:shadow-neo-pressed-dark"
                    >
                        Next
                    </button>

                    <a
                        href="/login"
                        className="text-center text-sm text-ink-light/70 dark:text-ink-dark/70"
                    >
                        Already have an account? Log in
                    </a>
                </form>
            )}

            <div className="flex items-center gap-2 text-xs text-ink-light/50 dark:text-ink-dark/50">
                <div className="h-px flex-1 bg-ink-light/20 dark:bg-ink-dark/20" />
                or
                <div className="h-px flex-1 bg-ink-light/20 dark:bg-ink-dark/20" />
            </div>
            
            <GoogleButton />

            {step === 2 && (
                <form
                    onSubmit={handleFinalSubmit}
                    className="flex flex-col gap-4"
                >
                    <h1 className="text-xl font-medium text-ink-light dark:text-ink-dark">
                        Choose a username
                    </h1>

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value.toLowerCase())
                        }
                        required
                        className={`rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark ${
                            usernameStatus === "taken" ||
                            usernameStatus === "invalid"
                                ? "ring-2 ring-secondary-light dark:ring-secondary-dark"
                                : usernameStatus === "available"
                                  ? "ring-2 ring-online-light dark:ring-online-dark"
                                  : ""
                        }`}
                    />

                    <p className="text-xs">
                        {usernameStatus === "checking" && (
                            <span className="text-ink-light/50 dark:text-ink-dark/50">
                                Checking availability...
                            </span>
                        )}
                        {usernameStatus === "available" && (
                            <span className="text-online-light dark:text-online-dark">
                                ✓ Username is available
                            </span>
                        )}
                        {usernameStatus === "taken" && (
                            <span className="text-secondary-light dark:text-secondary-dark">
                                ✗ Already taken, try another
                            </span>
                        )}
                        {usernameStatus === "invalid" && (
                            <span className="text-secondary-light dark:text-secondary-dark">
                                Only letters, numbers, and underscores allowed
                            </span>
                        )}
                    </p>

                    {submitError && (
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            {submitError}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 rounded-neo bg-base-light px-4 py-3 text-sm text-ink-light shadow-neo-raised dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-raised-dark"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={
                                usernameStatus !== "available" || submitting
                            }
                            className="flex-1 rounded-neo bg-base-light px-4 py-3 font-medium text-primary-light shadow-neo-raised transition active:shadow-neo-pressed disabled:opacity-50 dark:bg-base-dark dark:text-primary-dark dark:shadow-neo-raised-dark dark:active:shadow-neo-pressed-dark"
                        >
                            {submitting
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="text-3xl">🎉</div>
                    <h1 className="text-lg font-medium text-ink-light dark:text-ink-dark">
                        Welcome to Nooks, {displayName.split(" ")[0]}!
                    </h1>
                    <p className="text-sm text-ink-light/70 dark:text-ink-dark/70">
                        Taking you to your account...
                    </p>
                </div>
            )}
        </div>
    );
}
