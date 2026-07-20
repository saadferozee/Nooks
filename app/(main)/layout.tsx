import { ConversationList } from "@/components/chat/ConversationList";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen">
            <aside className="w-72 border-r border-ink-light/10 dark:border-ink-dark/10">
                <ConversationList />
            </aside>
            <main className="flex-1">{children}</main>
        </div>
    );
}
