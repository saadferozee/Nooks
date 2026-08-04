"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/AuthStore";
import { createClient } from "../supabase/client";

type Profile = {
    id: string;
    username: string;
    display_name: string | null;
    last_seen: string | null;
};

type ConversationInfo = {
    conversationType: string;
    name: string | null;
    otherUser: Profile | null; //? only useful if (conversationType === "direct")
    allParticipants: Profile[]; //? more than one profiles are stored if its group conversation.
};

const useConversationParticipants = (conversationId: string) => {
    const currentUser = useAuthStore((s) => s.user);
    const [info, setInfo] = useState<ConversationInfo | null>(null);

    useEffect(() => {
        if (!currentUser) return;
        const supabase = createClient();

        const load = async () => {
            const { data: convo } = await supabase
                .from("conversations")
                .select("type, name")
                .eq("id", conversationId)
                .single();

            const { data: participants } = await supabase
                .from("conversation_participants")
                .select(
                    "user_id, profiles(id, username, display_name, last_seen)",
                )
                .eq("conversation_id", conversationId);

            const allProfiles = (participants ?? []).map(
                // eslint-disable-next-line
                (p: any) => p.profiles as Profile
            )

            const otherUser = allProfiles.find((p) => p.id !== currentUser!.id) ?? null;

            setInfo({
                conversationType: convo!.type ?? "direct",
                name: convo!.name ?? null,
                otherUser,
                allParticipants: allProfiles,

            })

        };

        load();
    }, [conversationId, currentUser]);

    return info;
};

export default useConversationParticipants;
