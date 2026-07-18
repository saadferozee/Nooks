import { SignupForm } from "@/components/auth/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign up - Nooks",
};

export default function SignupPage() {
    return(
        <main className="flex min-h-screen items-center justify-center p-8">
            <SignupForm />
        </main>
    )
}