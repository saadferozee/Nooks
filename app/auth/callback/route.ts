import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        const supabase = await createClient();
        const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_complete")
                .eq("id", data.user.id)
                .single();

            if (!profile?.onboarding_complete) {
                return NextResponse.redirect(`${origin}/onboarding/username`);
            }
            return NextResponse.redirect(`${origin}/`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}