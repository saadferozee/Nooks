"use client";

import { createClient } from "@/lib/supabase/client";

export function useStartConversation() {
    const supabase = createClient();

    async function startConversation(
        otherUserId: string,
        currentUserId: string,
    ) {
        // Check if a direct conversation between these two already exists
        const { data: existing } = await supabase
            .from("conversation_participants")
            .select("conversation_id, conversations!inner(type)")
            .eq("user_id", currentUserId);

        if (existing) {
            for (const row of existing) {
                const { data: otherParticipant } = await supabase
                    .from("conversation_participants")
                    .select("user_id")
                    .eq("conversation_id", row.conversation_id)
                    .eq("user_id", otherUserId)
                    .maybeSingle();

                if (
                    otherParticipant &&
                    // eslint-disable-next-line
                    (row as any).conversations.type === "direct"
                ) {
                    return row.conversation_id as string;
                }
            }
        }

        // No existing conversation - create one
        const { data: newConvo, error: convoError } = await supabase
            .from("conversations")
            .insert({ type: "direct", created_by: currentUserId })
            .select()
            .single();

        if (convoError || !newConvo) throw convoError;

        await supabase.from("conversation_participants").insert([
            { conversation_id: newConvo.id, user_id: currentUserId },
            { conversation_id: newConvo.id, user_id: otherUserId },
        ]);

        return newConvo.id as string;
    }

    return { startConversation };
}
