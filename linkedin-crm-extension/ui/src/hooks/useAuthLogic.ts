import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { getBrowserAPI } from '../utils/browser';

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsInitializing(false);
        });

        // Listen for storage changes from background script
        const handleStorageChange = async (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local') {
                const authKeys = Object.keys(changes).filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
                if (authKeys.length > 0) {
                    const authKey = authKeys[0];
                    const newValue = changes[authKey].newValue;

                    if (newValue) {
                        try {
                            const sessionData = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
                            const { data: { session: currentSession } } = await supabase.auth.getSession();

                            if (currentSession?.access_token === sessionData.access_token) {
                                return;
                            }

                            const { error } = await supabase.auth.setSession({
                                access_token: sessionData.access_token,
                                refresh_token: sessionData.refresh_token || '',
                            });

                            if (error) {
                                console.error('Error setting session from storage:', error);
                            }
                        } catch (error) {
                            console.error('Error parsing session from storage:', error);
                        }
                    }
                }
            }
        };

        const browserAPI = getBrowserAPI();
        if (browserAPI?.storage?.onChanged) {
            browserAPI.storage.onChanged.addListener(handleStorageChange);
        }

        return () => {
            subscription.unsubscribe();
            if (browserAPI?.storage?.onChanged) {
                browserAPI.storage.onChanged.removeListener(handleStorageChange);
            }
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
