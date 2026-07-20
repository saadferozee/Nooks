"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/AuthStore";

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

export function ChatThread({ conversationId }: { conversationId: string }) {
    const supabase = createClient();
    const user = useAuthStore((s) => s.user);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        supabase
            .from("messages")
            .select("id, sender_id, content, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
                if (data) setMessages(data);
            });
        // eslint-disable-next-line
    }, [conversationId]);

    useEffect(() => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line
    }, [conversationId]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || !user) return;

        await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: input,
        });

        setInput("");
    }

    return (
        <div className="flex h-screen flex-col p-4">
            <div className="flex-1 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`max-w-xs rounded-neo px-4 py-2 ${
                            m.sender_id === user?.id
                                ? "ml-auto bg-primary-light text-white dark:bg-primary-dark"
                                : "bg-surface-light text-ink-light dark:bg-surface-dark dark:text-ink-dark"
                        }`}
                    >
                        {m.content}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 pt-4">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 rounded-neo bg-base-light px-4 py-3 text-ink-light shadow-neo-pressed outline-none dark:bg-base-dark dark:text-ink-dark dark:shadow-neo-pressed-dark"
                />
                <button
                    type="submit"
                    className="rounded-neo bg-base-light px-4 py-3 text-primary-light shadow-neo-raised dark:bg-base-dark dark:text-primary-dark dark:shadow-neo-raised-dark"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
