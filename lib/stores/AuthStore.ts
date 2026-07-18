import { User } from "@supabase/supabase-js"
import { create } from "zustand";

type AuthState = {
    user: User | null;
    loading: boolean;
    setUser: (User: User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({user}),
    setLoading: (loading) => set({loading}),
}))