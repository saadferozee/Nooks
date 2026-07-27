"use client";

import { useEffect } from "react";
import { createClient } from "@/libraries/supabase/client";
import { useAuthStore } from "@/libraries/stores/AuthStore";

// ? mounts at the root, nothing renders
// ? sync with Supabase auth state

export function AuthListener() {
    const setUser = useAuthStore((state) => state.setUser);
    const setLoading = useAuthStore((state) => state.setLoading);

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data }) => {
            // console.log(data); 
            // ? it was for checking the user data.
            setUser(data.user);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            },
        );

        return () => {
            listener.subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
