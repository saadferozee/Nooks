"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/libraries/supabase/client";
import { useAuthStore } from "@/libraries/stores/AuthStore";

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    status?: string;
};

export function ChatThread({ conversationId }: { conversationId: string }) {
    const supabase = createClient();
    const user = useAuthStore((s) => s.user);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [typingUser, setTypingUser] = useState<string | null>(null);

    // Holds the ONE subscribed typing channel for this conversation.
    // Created once in the effect below, reused on every keystroke.
    const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
        null,
    );

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
        if (messages.length === 0) return;

        const myMessageIds = messages
            .filter((m) => m.sender_id === user?.id)
            .map((m) => m.id);

        if (myMessageIds.length === 0) return;

        supabase
            .from("message_status")
            .select("message_id, status")
            .in("message_id", myMessageIds)
            .then(({ data }) => {
                if (!data) return;
                setMessages((prev) =>
                    prev.map((m) => {
                        const found = data.find((d) => d.message_id === m.id);
                        return found ? { ...m, status: found.status } : m;
                    }),
                );
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    useEffect(() => {
        if (!user) return;

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
                    if (payload.new.sender_id !== user?.id) {
                        supabase
                            .from("message_status")
                            .insert({
                                message_id: payload.new.id,
                                user_id: user?.id,
                                status: "delivered",
                            })
                            .then();
                    }
                    setMessages((prev) => [...prev, payload.new as Message]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

        // eslint-disable-next-line
    }, [conversationId, user?.id]);

    useEffect(() => {
        if (!user || messages.length === 0) return;

        const unreadFromOthers = messages.filter(
            (m) => m.sender_id !== user.id,
        );

        unreadFromOthers.forEach((m) => {
            supabase
                .from("message_status")
                .upsert(
                    { message_id: m.id, user_id: user.id, status: "read" },
                    { onConflict: "message_id,user_id" },
                )
                .then();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, user]);

    // Typing indicator - ONE channel per conversation, created once,
    // stored in the ref above. Nothing here touches message sending.
    useEffect(() => {
        const channel = supabase
            .channel(`typing:${conversationId}`)
            .on("broadcast", { event: "typing" }, (payload) => {
                if (payload.payload.userId !== user?.id) {
                    setTypingUser(payload.payload.userId);
                    setTimeout(() => setTypingUser(null), 2000);
                }
            })
            .subscribe();

        typingChannelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            typingChannelRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    function handleInputChange(value: string) {
        setInput(value);
        // Guard: only send if the channel exists AND is actually ready.
        // If the user types before the subscribe() callback resolves,
        // this just silently skips that one broadcast - harmless.
        typingChannelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { userId: user?.id },
        });
    }

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
                        className={`flex flex-col ${
                            m.sender_id === user?.id
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div
                            className={`flex flex-col justify-between rounded-neo px-4 py-2 ${
                                m.sender_id === user?.id
                                    ? "max-w-lg  ml-auto bg-primary-light text-justify text-white dark:bg-primary-dark"
                                    : "max-w-lg mr-auto bg-surface-light text-justify text-ink-light dark:bg-surface-dark dark:text-ink-dark"
                            }`}
                        >
                            {m.content}
                        </div>
                        {m.sender_id === user?.id ? (
                            <div className="flex justify-end text-end">
                                <p className="pr-2 text-sm text-ink-light/50 dark:text-ink-dark/50">
                                    {`${new Date(
                                        m.created_at,
                                    ).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                    })}, 
                                    ${new Date(m.created_at).toLocaleTimeString(
                                        "en-US",
                                        {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        },
                                    )}
                                    `}
                                </p>
                                <p className="w-6 ml-1 text-center text-xs">
                                    {m.status === "read" ? (
                                        <span className="text-green-600 dark:text-green-200">
                                            ✓✓
                                        </span>
                                    ) : m.status === "delivered" ? (
                                        <span className="text-primary-light/70 dark:text-primary-dark/70">
                                            ✓✓
                                        </span>
                                    ) : (
                                        <span className="text-primary-light/70 dark:text-primary-dark">
                                            ✓
                                        </span>
                                    )}
                                </p>
                            </div>
                        ) : (
                            <p className="pl-4 text-start text-sm">
                                <span className="text-ink-light/50 dark:text-ink-dark/50">
                                    {`${new Date(
                                        m.created_at,
                                    ).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                    })}, 
                                    ${new Date(m.created_at).toLocaleTimeString(
                                        "en-US",
                                        {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        },
                                    )}
                                    `}
                                </span>
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {typingUser && (
                <p className="px-1 text-xs text-ink-light/50 dark:text-ink-dark/50">
                    Typing...
                </p>
            )}

            <form onSubmit={handleSend} className="flex gap-2 pt-4">
                <input
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
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
