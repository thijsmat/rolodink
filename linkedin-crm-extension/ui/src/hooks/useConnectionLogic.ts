import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { API_BASE_URL } from '../config';
import { supabase } from '../services/supabase';
import type { Connection, ConnectionFormData } from '../context/ConnectionContext';
import { INVALID_PROFILE_PAGE_ERROR } from '../context/ConnectionContext';

// Helper functions (copied from ConnectionContext)
const warnOnce = (() => {
    const cache = new Set<string>();
    return (key: string, message: string) => {
        if (cache.has(key)) return;
        cache.add(key);
        console.warn(message);
    };
})();

const getStorage = () => {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
        return browser.storage.local;
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return chrome.storage.local;
    }
    warnOnce('connection-storage', '[useConnectionLogic] Storage API unavailable.');
    return null;
};

const getTabs = () => {
    if (typeof browser !== 'undefined' && browser.tabs) {
        return browser.tabs;
    }
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        return chrome.tabs;
    }
    warnOnce('connection-tabs', '[useConnectionLogic] Tabs API unavailable.');
    return null;
};

function normalizeLinkedInUrl(raw: string): string {
    try {
        const u = new URL(raw);
        u.search = '';
        u.hash = '';
        if (u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
        return u.toString();
    } catch {
        return raw;
    }
}

function pickFirstConnection(data: any): Connection | null {
    if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : null;
    }
    return data;
}

async function getCurrentTabUrl(): Promise<string | null> {
    const tabsApi = getTabs();
    if (!tabsApi) return null;
    const tabs = await tabsApi.query({ active: true, currentWindow: true });
    return tabs[0]?.url || null;
}

async function fetchConnectionData(token: string, url: string) {
    const normalizedUrl = normalizeLinkedInUrl(url);
    return fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(normalizedUrl)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export function useConnectionLogic(user: User | null) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [connection, setConnection] = useState<Connection | null>(null);
    const [allConnections, setAllConnections] = useState<Connection[]>([]);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
    const [toastMessage, setToastMessage] = useState<string>('');

    const fetchAllConnectionsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

    // Cache management
    const loadCachedConnections = useCallback(async (): Promise<Connection[]> => {
        try {
            const storage = getStorage();
            if (!storage) return [];
            const result = await storage.get('cachedConnections');
            return result.cachedConnections || [];
        } catch (error) {
            console.error('Failed to load cached connections:', error);
            return [];
        }
    }, []);

    const saveConnectionsToCache = useCallback(async (connections: Connection[]) => {
        try {
            const storage = getStorage();
            if (!storage) return;
            await storage.set({
                cachedConnections: connections,
                connectionsCacheTimestamp: Date.now(),
            });
        } catch (error) {
            console.error('Failed to save connections to cache:', error);
        }
    }, []);

    const initializeFromCache = useCallback(async () => {
        try {
            const cachedConnections = await loadCachedConnections();
            if (cachedConnections.length > 0) {
                setAllConnections(cachedConnections);
            }
            setIsInitialized(true);
        } catch (error) {
            console.error('Failed to initialize from cache:', error);
            setIsInitialized(true);
        }
    }, [loadCachedConnections]);

    // Offline detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setToastMessage('Internetverbinding hersteld!');
            if (user) {
                setTimeout(() => {
                    const callFetch = fetchAllConnectionsRef.current;
                    if (callFetch) callFetch(true).catch(console.error);
                }, 1000);
            }
        };

        const handleOffline = () => {
            setIsOffline(true);
            setToastMessage('Geen internetverbinding. Je werkt nu offline.');
        };

        globalThis.addEventListener('online', handleOnline);
        globalThis.addEventListener('offline', handleOffline);

        return () => {
            globalThis.removeEventListener('online', handleOnline);
            globalThis.removeEventListener('offline', handleOffline);
        };
    }, [user]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!user) {
                setConnection(null);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const currentUrl = await getCurrentTabUrl();
            if (!currentUrl) {
                setError('Deze functionaliteit werkt alleen binnen de Rolodink-extensie.');
                setConnection(null);
                return;
            }

            if (!currentUrl.includes('linkedin.com/in/')) {
                setError(INVALID_PROFILE_PAGE_ERROR);
                setConnection(null);
                return;
            }

            const response = await fetchConnectionData(token, currentUrl);

            if (response.ok) {
                const data = await response.json();
                const picked = pickFirstConnection(data);
                setConnection(picked);
                if (!picked) setAllConnections([]);
            } else if (response.status === 404) {
                setConnection(null);
            } else if (response.status === 401) {
                setError('Je sessie is verlopen. Log opnieuw in.');
                await supabase.auth.signOut();
            } else {
                throw new Error(`Serverfout: ${response.statusText}`);
            }
        } catch (e: unknown) {
            console.error('Fout bij ophalen van connectie:', e);
            if (e instanceof TypeError && e.message.includes('fetch')) {
                setError('Geen internetverbinding.');
            } else if (e instanceof Error) {
                setError(e.message || 'Kon de connectie-data niet ophalen.');
            } else {
                setError('Kon de connectie-data niet ophalen.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const fetchAllConnections = useCallback(async (silent = false) => {
        if (!silent) {
            setIsLoading(true);
            setError(null);
        }
        try {
            if (!user) throw new Error('Niet ingelogd');
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Niet ingelogd');

            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                if (!silent) setError('Je sessie is verlopen.');
                await supabase.auth.signOut();
                return;
            }
            if (!response.ok) throw new Error(`Serverfout: ${response.statusText}`);

            const connections = await response.json();
            setAllConnections(connections);
            await saveConnectionsToCache(connections);

            if (silent) {
                // console.log removed
            }
        } catch (e) {
            console.error('Fout bij ophalen van alle connecties:', e);
            if (!silent) {
                setError('Kon de connecties niet ophalen.');
                setToastMessage('Kon de connecties niet ophalen.');
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [user, saveConnectionsToCache]);

    useEffect(() => {
        fetchAllConnectionsRef.current = fetchAllConnections;
    }, [fetchAllConnections]);

    // Initialize
    useEffect(() => {
        const initialize = async () => {
            await initializeFromCache();
            if (user) {
                await fetchData();
            }
        };
        initialize();
    }, [initializeFromCache, fetchData, user]);

    const handleCreateConnection = async (formData: ConnectionFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Niet ingelogd');

            const tabsApi = getTabs();
            if (!tabsApi) throw new Error('chrome.tabs is niet beschikbaar.');
            const tabs = await tabsApi.query({ active: true, currentWindow: true });
            const profileUrl = tabs[0]?.url;
            const profileName = tabs[0]?.title?.split(' | ')[0] || 'Onbekende Naam';

            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: profileName, url: profileUrl, ...formData })
            });

            if (!response.ok) throw new Error('Opslaan mislukt');
            const newConnection = await response.json();
            setConnection(newConnection);

            const updatedConnections = [...allConnections, newConnection];
            setAllConnections(updatedConnections);
            await saveConnectionsToCache(updatedConnections);

            setToastMessage('Connectie opgeslagen.');
        } catch (e) {
            console.error('Fout bij opslaan:', e);
            setError('Kon de connectie niet opslaan.');
            setToastMessage('Kon de connectie niet opslaan.');
        } finally {
            setIsLoading(false);
        }
    };

    async function resolveConnectionId(current: Connection | null): Promise<string | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return null;

            const urlCandidate = current?.linkedInUrl;
            const urlToUse = urlCandidate || (await getCurrentTabUrl());

            if (!urlToUse) return null;

            const resp = await fetchConnectionData(token, urlToUse);
            if (!resp.ok) return null;
            const data = await resp.json();
            const picked = pickFirstConnection(data);
            return picked?.id || null;
        } catch {
            return null;
        }
    }

    const handleUpdate = async (formData: ConnectionFormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Niet ingelogd');

            let idToUse: string | undefined = connection?.id;
            if (!idToUse) {
                idToUse = await resolveConnectionId(connection) || undefined;
            }
            if (!idToUse || idToUse === 'undefined' || idToUse === 'null') {
                throw new Error('Connection ID ontbreekt.');
            }

            const payload = {
                id: idToUse,
                meetingPlace: formData.meetingPlace || null,
                userCompanyAtTheTime: formData.userCompanyAtTheTime || null,
                notes: formData.notes || null
            };

            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Update mislukt`);

            const updated = await response.json();
            setConnection(updated);

            const updatedConnections = allConnections.map(conn =>
                conn.id === updated.id ? updated : conn
            );
            setAllConnections(updatedConnections);
            await saveConnectionsToCache(updatedConnections);

            setToastMessage('Connectie bijgewerkt.');
        } catch (e: unknown) {
            console.error('Fout bij bijwerken:', e);
            setError('Kon de connectie niet bijwerken.');
            setToastMessage('Bijwerken mislukt.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const confirmed = globalThis.confirm('Weet je zeker dat je deze connectie wilt verwijderen?');
            if (!confirmed) {
                setIsLoading(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Niet ingelogd');

            let idToUse: string | undefined = connection?.id;
            if (!idToUse) {
                idToUse = await resolveConnectionId(connection) || undefined;
            }
            if (!idToUse) throw new Error('Connection ID ontbreekt.');

            const response = await fetch(`${API_BASE_URL}/api/connections/${idToUse}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Verwijderen mislukt');
            setConnection(null);

            const updatedConnections = allConnections.filter(conn => conn.id !== idToUse);
            setAllConnections(updatedConnections);
            await saveConnectionsToCache(updatedConnections);

            setToastMessage('Connectie verwijderd.');
        } catch (e) {
            console.error('Fout bij verwijderen:', e);
            setError('Kon de connectie niet verwijderen.');
            setToastMessage('Verwijderen mislukt.');
        } finally {
            setIsLoading(false);
        }
    };

    const cleanAllNames = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                setError('Je bent niet ingelogd.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/connections/clean-names`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Serverfout: ${response.statusText}`);

            const result = await response.json();
            if (result.success) {
                setToastMessage(`✅ ${result.updatedCount} namen opgeschoond`);
                await fetchAllConnections();
            } else {
                setToastMessage('Er is iets misgegaan bij het opschonen.');
            }
        } catch (e) {
            console.error('Fout bij opschonen namen:', e);
            setError('Kon de namen niet opschonen.');
            setToastMessage('Fout bij opschonen van namen.');
        } finally {
            setIsLoading(false);
        }
    }, [fetchAllConnections]);

    const clearConnectionState = useCallback(async () => {
        setConnection(null);
        setAllConnections([]);
        setError(null);
        const storage = getStorage();
        if (storage) {
            await storage.remove(['cachedConnections', 'connectionsCacheTimestamp']);
        }
    }, []);

    return {
        isLoading,
        error,
        connection,
        allConnections,
        isInitialized,
        isOffline,
        toastMessage,
        setToastMessage,
        setConnection,
        setError,
        fetchData,
        fetchAllConnections,
        handleCreateConnection,
        handleUpdate,
        handleDelete,
        cleanAllNames,
        clearConnectionState
    };
}
