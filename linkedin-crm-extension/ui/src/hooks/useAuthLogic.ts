import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export function useAuthLogic() {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initial session check and listener
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error checking session:', error);
                setSession(null);
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsInitializing(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    }, []);

    return {
        session,
        user,
        isInitializing,
        signOut,
        // Helper to manually trigger a session check if needed (e.g. after login)
        refreshSession: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
        }
    };
}
