"use client";

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const LogoutButton = () => {

    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <button onClick={handleLogout} className='neo-surface px-4 py-2 text-sm cursor-pointer'>
            Log Out
        </button>
    );
};

export default LogoutButton;