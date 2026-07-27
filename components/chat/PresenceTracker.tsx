"use client";

import { useAuthStore } from "@/libraries/stores/AuthStore";
import { usePresenceStore } from "@/libraries/stores/presenceStore";
import { createClient } from "@/libraries/supabase/client";
import { useEffect } from "react";

export function PresenceTracker() {
    const user = useAuthStore((state) => state.user);
    const setOnlineUserIds = usePresenceStore(
        (state) => state.setOnlineUserIds,
    );

    useEffect(() => {
        if (!user) return;

        const supabase = createClient();
        const channel = supabase.channel("online-users", {
            config: { presence: { key: user.id } },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                setOnlineUserIds(new Set(Object.keys(state)));
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            // ? keep record: record last seen before disconnecting.
            supabase
                .from("profiles")
                .update({
                    status: "offline",
                    last_seen: new Date().toISOString(),
                })
                .eq("id", user.id)
                .then();

            supabase.removeChannel(channel);
        };
    }, [user, setOnlineUserIds]);

    return null;
}
