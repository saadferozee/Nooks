"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "../stores/AuthStore";

export type SearchResult = {
    id: string;
    username: string;
    display_name: string | null;
};

export function useUserSearch(query: string) {
    const currentUser = useAuthStore((s) => s.user);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.trim().length < 2 || !currentUser) {
            // eslint-disable-next-line
            setResults([]);
            return;
        }

        setLoading(true);
        const supabase = createClient();

        const timeout = setTimeout(async () => {
            const { data } = await supabase
                .from("profiles")
                .select("id, username, display_name")
                .neq("id", currentUser.id) // never show yourself in results
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(10);

            setResults(data ?? []);
            setLoading(false);
        }, 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, currentUser?.id]);

    return { results, loading };
}
