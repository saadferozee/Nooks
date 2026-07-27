"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserSearch } from "@/components/chat/UserSearch";
import { createClient } from "@/libraries/supabase/client";
import { useAuthStore } from "@/libraries/stores/AuthStore";
import { usePresenceStore } from "@/libraries/stores/presenceStore";

type ConversationRow = {
    conversation_id: string;
    conversations: { id: string; type: string; name: string | null };
    otherUser?: {
        id: string;
        username: string;
        display_name: string | null;
        last_seen: string | null;
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
                .then(async ({ data }) => {
                    if (!data) return;
                    const rows = data as unknown as ConversationRow[];

                    // For direct conversations, fetch who the OTHER person is
                    const directIds = rows
                        .filter((r) => r.conversations.type === "direct")
                        .map((r) => r.conversation_id);

                    if (directIds.length > 0) {
                        const { data: others } = await supabase
                            .from("conversation_participants")
                            .select(
                                "conversation_id, profiles(id, username, display_name, last_seen)",
                            )
                            .in("conversation_id", directIds)
                            .neq("user_id", user!.id);

                        const otherMap = new Map(
                            // ! this is not an error, this type has to be "any".
                            // eslint-disable-next-line
                            (others ?? []).map((o: any) => [
                                o.conversation_id,
                                o.profiles,
                            ]),
                        );

                        rows.forEach((r) => {
                            r.otherUser = otherMap.get(r.conversation_id);
                        });
                    }

                    setConversations(rows);
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

    const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

    return (
        <div className="flex flex-col gap-4 p-4">
            <UserSearch />

            <div className="flex flex-col gap-2">
                {conversations.map((c) => {
                    const isOnline =
                        c.otherUser && onlineUserIds.has(c.otherUser.id);
                    const label =
                        c.conversations.type === "group"
                            ? c.conversations.name
                            : (c.otherUser?.display_name ??
                              c.otherUser?.username ??
                              "can't find name: error!");

                    return (
                        <Link
                            key={c.conversation_id}
                            href={`/chat/${c.conversation_id}`}
                            className="flex items-center gap-2 rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-raised dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-raised-dark"
                        >
                            {c.conversations.type === "direct" && (
                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        isOnline
                                            ? "bg-online-light dark:bg-online-dark"
                                            : "bg-ink-light/30 dark:bg-ink-dark/30"
                                    }`}
                                />
                            )}
                            {label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
