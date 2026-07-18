import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login Form - Nooks"
};

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center p-8">
            <LoginForm />
        </main>
    )
}