import { ChatThread } from "@/components/chat/ChatThread";


export default async function ChatPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const { conversationId } = await params;
    return <ChatThread conversationId={conversationId} />;
}
