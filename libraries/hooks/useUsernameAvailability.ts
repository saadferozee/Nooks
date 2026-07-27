"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type UsernameStatus =
    | "idle"
    | "checking"
    | "available"
    | "taken"
    | "invalid";

export function useUsernameAvailability(username: string) {
    const [status, setStatus] = useState<UsernameStatus>("idle");

    useEffect(() => {
        if (username.length < 3) {
            // eslint-disable-next-line
            setStatus("idle");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setStatus("invalid");
            return;
        }

        setStatus("checking");
        const supabase = createClient();
        const timeout = setTimeout(async () => {
            const { data } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", username)
                .maybeSingle();
            setStatus(data ? "taken" : "available");
        }, 500);

        return () => clearTimeout(timeout);
    }, [username]);

    return status;
}
