import { ConversationList } from "@/components/chat/ConversationList";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen">
            <aside className="min-w-72 w-[30%] m-5 rounded-[30px] shadow-neo-raised dark:shadow-neo-raised-dark">
                <ConversationList />
            </aside>
            <main className="flex-1">{children}</main>
        </div>
    );
}
