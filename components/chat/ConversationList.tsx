"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserSearch } from "@/components/chat/UserSearch";
import { useAuthStore } from "@/lib/stores/AuthStore";

type ConversationRow = {
    conversation_id: string;
    conversations: {
        id: string;
        type: string;
        name: string | null;
    };
};

export function ConversationList() {
    const supabase = createClient();
    const user = useAuthStore((s) => s.user);
    const [conversations, setConversations] = useState<ConversationRow[]>([]);

    useEffect(() => {
        if (!user) return;

        function loadConversations() {
            supabase
                .from("conversation_participants")
                .select("conversation_id, conversations(id, type, name)")
                .eq("user_id", user!.id)
                .then(({ data }) => {
                    if (data)
                        setConversations(data as unknown as ConversationRow[]);
                });
        }

        loadConversations();

        // Refetch the list whenever this user gets added to a new conversation
        // (covers both starting a chat yourself and someone else starting one with you)
        const channel = supabase
            .channel(`user-conversations:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "conversation_participants",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    loadConversations();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <div className="flex flex-col gap-4 p-4">
            <UserSearch />

            <div className="flex flex-col gap-2">
                {conversations.map((c) => (
                    <Link
                        key={c.conversation_id}
                        href={`/chat/${c.conversation_id}`}
                        className="rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-raised dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-raised-dark"
                    >
                        {c.conversations.name ?? "Direct message"}
                    </Link>
                ))}
            </div>
        </div>
    );
}
