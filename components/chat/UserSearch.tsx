"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserSearch } from "@/lib/hooks/useUserSearch";
import { useStartConversation } from "@/lib/hooks/useStartConversation";
import { useAuthStore } from "@/lib/stores/AuthStore";

export function UserSearch() {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.user);
    const [query, setQuery] = useState("");
    const [starting, setStarting] = useState(false);
    const { results, loading } = useUserSearch(query);
    const { startConversation } = useStartConversation();

    async function handleSelect(otherUserId: string) {
        if (!currentUser || starting) return;
        setStarting(true);

        try {
            const conversationId = await startConversation(
                otherUserId,
                currentUser.id,
            );
            setQuery("");
            router.push(`/chat/${conversationId}`);
        } finally {
            setStarting(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <input
                type="text"
                placeholder="Search people..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-neo bg-base-light px-4 py-2 text-sm text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
            />

            {query.trim().length >= 2 && (
                <div className="flex flex-col gap-1 rounded-neo bg-base-light p-2 shadow-neo-raised dark:bg-base-dark dark:shadow-neo-raised-dark">
                    {loading && (
                        <p className="px-2 py-1 text-xs text-ink-light/50 dark:text-ink-dark/50">
                            Searching...
                        </p>
                    )}

                    {!loading && results.length === 0 && (
                        <p className="px-2 py-1 text-xs text-ink-light/50 dark:text-ink-dark/50">
                            No one found
                        </p>
                    )}

                    {results.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => handleSelect(r.id)}
                            disabled={starting}
                            className="rounded-neo px-3 py-2 text-left text-sm text-ink-light transition hover:shadow-neo-pressed disabled:opacity-50 dark:text-ink-dark"
                        >
                            <span className="font-medium">
                                {r.display_name ?? r.username}
                            </span>{" "}
                            <span className="text-ink-light/50 dark:text-ink-dark/50">
                                @{r.username}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
