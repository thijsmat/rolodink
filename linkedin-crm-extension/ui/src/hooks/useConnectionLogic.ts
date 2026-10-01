import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/auth-js';
import { SENSITIVE_FIELDS, isLinkedInProfileUrl, profileLookupUrl, readConflict, withExpectedVersion } from '@rolodink/core';
import type { SensitiveField } from '@rolodink/core';
import { API_BASE_URL } from '../config';
import { supabase } from '../services/supabase';
import type { Connection, ConnectionFormData } from '../context/ConnectionContext';
import { INVALID_PROFILE_PAGE_ERROR } from '../context/ConnectionContext';
import { ConnectionChangedElsewhereError, LOCKED_FIELD_PLACEHOLDER, pickFieldsToUpdate } from '../utils/connectionUpdate';
import { clearDecryptMemo } from '../utils/decryptMemo';
import { decryptWithMemo } from '../utils/decryptField';

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

const getRuntime = () => {
    if (typeof browser !== 'undefined' && browser.runtime) {
        return browser.runtime;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome.runtime;
    }
    return null;
};

// SENSITIVE_FIELDS and SensitiveField now come from @rolodink/core, so the
// extension and the backend cannot drift on which fields are encrypted at rest.
// The encrypt/decrypt helpers below are still local: they differ from core's
// encryptSensitiveFields/decryptSensitiveFields in how they report a failed
// decryption (a visible sentinel here, null plus onError there), and that is a
// user-facing choice to settle in its own change.

/** Encrypt a single text value via the background script. Throws on encryption failure. */
async function encryptField(value: string | null | undefined): Promise<string | null | undefined> {
    if (!value) return value;
    const runtime = getRuntime();
    if (!runtime) {
        throw new Error('Runtime API unavailable for encryption');
    }

    const response = await runtime.sendMessage({ type: 'ENCRYPT_TEXT', text: value });
    if (!response?.success) {
        throw new Error(response?.error || 'Encryption failed');
    }
    return response.ciphertext;
}

/** Encrypt all sensitive fields in a form data object before sending to the API. */
async function encryptFormData<T extends Partial<Record<SensitiveField, string | null | undefined>>>(
    data: T
): Promise<T> {
    const encrypted = { ...data };
    for (const field of SENSITIVE_FIELDS) {
        if (field in encrypted && encrypted[field]) {
            (encrypted as Record<string, string | null | undefined>)[field] =
                await encryptField(encrypted[field]);
        }
    }
    return encrypted;
}

type Runtime = NonNullable<ReturnType<typeof getRuntime>>;

/** Decrypt one value for display: a locked field shows the lock placeholder. */
async function decryptValue(runtime: Runtime, ownerId: string | null, ciphertext: string): Promise<string> {
    return (await decryptWithMemo(runtime, ownerId, ciphertext)) ?? LOCKED_FIELD_PLACEHOLDER;
}

/** Decrypt all sensitive fields in a connection. */
async function decryptConnections(connections: Connection[], ownerId: string | null): Promise<Connection[]> {
    const runtime = getRuntime();
    if (!runtime) return connections;

    // Every field of every row at once. Field by field, each row waited for
    // one round trip to the background script per encrypted field in turn.
    return Promise.all(connections.map(async (conn) => {
        const decrypted: Connection = { ...conn };
        await Promise.all(SENSITIVE_FIELDS.map(async (field) => {
            const raw = (conn as Record<string, unknown>)[field];
            if (typeof raw === 'string' && raw.startsWith('rolodink-enc:')) {
                (decrypted as Record<string, unknown>)[field] = await decryptValue(runtime, ownerId, raw);
            }
        }));
        return decrypted;
    }));
}

// The popup caches the server's rows (still encrypted) so the list shows at
// once. The cache records whose rows they are: a cache without an owner, or
// with another one, is never shown and is removed.
const CACHE_KEYS = ['cachedConnections', 'cachedConnectionsOwner', 'connectionsCacheTimestamp'];

async function clearConnectionsCache(): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    try {
        await storage.remove(CACHE_KEYS);
    } catch (error) {
        console.error('Failed to clear the connections cache:', error);
    }
}

/** The cached rows if they belong to ownerId; otherwise none, and a foreign cache is removed. */
async function readOwnedCache(ownerId: string | null): Promise<Connection[]> {
    if (!ownerId) return [];
    const storage = getStorage();
    if (!storage) return [];
    const result = await storage.get(['cachedConnections', 'cachedConnectionsOwner']);
    const cached: unknown = result.cachedConnections;
    if (!Array.isArray(cached)) return [];
    if (result.cachedConnectionsOwner !== ownerId) {
        await clearConnectionsCache();
        return [];
    }
    return cached as Connection[];
}

function pickFirstConnection(data: unknown): Connection | null {
    if (Array.isArray(data)) {
        return data.length > 0 ? (data[0] as Connection) : null;
    }
    return data as Connection | null;
}

async function getCurrentTabUrl(): Promise<string | null> {
    const tabsApi = getTabs();
    if (!tabsApi) return null;
    const tabs = await tabsApi.query({ active: true, currentWindow: true });
    return tabs[0]?.url || null;
}

async function fetchConnectionData(token: string, url: string) {
    // The same key the content script and the API use - one row per profile.
    const normalizedUrl = profileLookupUrl(url);
    return fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(normalizedUrl)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

const isProfileUrl = (url: string | null) => !!url && isLinkedInProfileUrl(url);

async function handleFetchResponse(
    response: Response,
    supabase: any,
    ownerId: string | null,
    isCurrent: () => boolean,
    setConnection: (c: Connection | null) => void,
    setError: (e: string) => void,
    onUnauthorized: () => Promise<void>
) {
    if (response.ok) {
        // A profile without a saved connection says nothing about the list,
        // so the list stays as it is.
        const picked = pickFirstConnection(await response.json());
        const decrypted = picked ? (await decryptConnections([picked], ownerId))[0] : null;
        if (isCurrent()) setConnection(decrypted);
    } else if (!isCurrent()) {
        // A newer load, or another account, owns the popup now. Not even a
        // 401: signing out on an old token could sign out the new account.
        return;
    } else if (response.status === 404) {
        setConnection(null);
    } else if (response.status === 401) {
        setError('Je sessie is verlopen. Log opnieuw in.');
        await onUnauthorized();
        // scope: 'local' - see the note on the other 401 handler below.
        await supabase.auth.signOut({ scope: 'local' });
    } else {
        throw new Error(`Serverfout: ${response.statusText}`);
    }
}

function handleFetchError(e: unknown, setError: (e: string) => void) {
    console.error('Fout bij ophalen van connectie:', e);
    if (e instanceof TypeError && e.message.includes('fetch')) {
        setError('Geen internetverbinding.');
    } else if (e instanceof Error) {
        setError(e.message || 'Kon de connectie-data niet ophalen.');
    } else {
        setError('Kon de connectie-data niet ophalen.');
    }
}

export function useConnectionLogic(user: User | null) {
    // A primitive for the effects and callbacks below. The user object is
    // replaced on every auth event (token refresh, SIGNED_IN), and with it as
    // a dependency the cache was decrypted two or three times per popup open.
    const userId = user?.id ?? null;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [connection, setConnection] = useState<Connection | null>(null);
    const [allConnections, setAllConnections] = useState<Connection[]>([]);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
    const [toastMessage, setToastMessage] = useState<string>('');

    const fetchAllConnectionsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

    // Load generations. Every load takes the next number and, after each
    // await, writes to state only while its number is still the latest. A new
    // load, an account switch and sign-out all move the number on, so an
    // answer that arrives late can never overwrite newer data or show the
    // previous owner's.
    const listGenRef = useRef(0);
    const profileGenRef = useRef(0);

    // Cache management
    const loadCachedConnections = useCallback(async (): Promise<Connection[]> => {
        try {
            return await readOwnedCache(userId);
        } catch (error) {
            console.error('Failed to load cached connections:', error);
            return [];
        }
    }, [userId]);

    const saveConnectionsToCache = useCallback(async (connections: Connection[]) => {
        // Without a user there is no owner to record, and an ownerless cache
        // would be thrown away on the next read anyway.
        if (!userId) return;
        try {
            const storage = getStorage();
            if (!storage) return;
            await storage.set({
                cachedConnections: connections,
                cachedConnectionsOwner: userId,
                connectionsCacheTimestamp: Date.now(),
            });
        } catch (error) {
            console.error('Failed to save connections to cache:', error);
        }
    }, [userId]);

    /** Show the cached list, decrypted. True when it put a list on screen. */
    const showCachedConnections = useCallback(async (): Promise<boolean> => {
        const gen = ++listGenRef.current;
        setIsLoading(true);
        try {
            const cachedConnections = await loadCachedConnections();
            if (cachedConnections.length === 0) return false;
            const decryptedConnections = await decryptConnections(cachedConnections, userId);
            if (gen !== listGenRef.current) return false;
            setAllConnections(decryptedConnections);
            return true;
        } finally {
            setIsLoading(false);
        }
    }, [userId, loadCachedConnections]);

    const initializeFromCache = useCallback(async () => {
        try {
            if (!userId) {
                // Until auth has loaded there is no user yet, but there may be
                // a session. Only with no session at all is the cache orphaned.
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) await clearConnectionsCache();
                return;
            }
            // The list is decrypted when it is opened (see showListView), not
            // on every popup open: on a profile the popup shows one connection.
            // Only the start screen uses the list at once, for its first-step hint.
            if (!isProfileUrl(await getCurrentTabUrl())) await showCachedConnections();
        } catch (error) {
            console.error('Failed to initialize from cache:', error);
        } finally {
            setIsInitialized(true);
        }
    }, [userId, showCachedConnections]);

    // Offline detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setToastMessage('Internetverbinding hersteld!');
            if (userId) {
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
    }, [userId]);

    const fetchData = useCallback(async () => {
        const gen = ++profileGenRef.current;
        const isCurrent = () => gen === profileGenRef.current;
        setIsLoading(true);
        setError(null);
        try {
            if (!userId) {
                setConnection(null);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const currentUrl = await getCurrentTabUrl();
            if (!isCurrent()) return;
            if (!currentUrl) {
                setError('Deze functionaliteit werkt alleen binnen de Rolodink-extensie.');
                setConnection(null);
                return;
            }

            if (!isProfileUrl(currentUrl)) {
                setError(INVALID_PROFILE_PAGE_ERROR);
                setConnection(null);
                return;
            }

            const response = await fetchConnectionData(token, currentUrl);
            await handleFetchResponse(response, supabase, userId, isCurrent, setConnection, setError, clearConnectionsCache);
        } catch (e: unknown) {
            if (isCurrent()) handleFetchError(e, setError);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const fetchAllConnections = useCallback(async (silent = false) => {
        const gen = ++listGenRef.current;
        const isCurrent = () => gen === listGenRef.current;
        if (!silent) {
            setIsLoading(true);
            // "Not a profile" describes the open tab, not this request. Keep
            // it, or closing the list lands on a new-connection form for a
            // page that is not a profile, instead of on the start screen.
            setError(prev => (prev === INVALID_PROFILE_PAGE_ERROR ? prev : null));
        }
        try {
            if (!userId) throw new Error('Niet ingelogd');
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Niet ingelogd');

            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!isCurrent()) return;

            if (response.status === 401) {
                if (!silent) setError('Je sessie is verlopen.');
                await clearConnectionsCache();
                // scope: 'local'. signOut() defaults to 'global' in auth-js,
                // which asks the server to revoke every refresh token this user
                // has - on their phone, on the website, in another browser. One
                // 401 here, from a token that had merely expired and could have
                // been refreshed, logged them out everywhere and made the
                // situation unrecoverable. 'local' clears this client only.
                await supabase.auth.signOut({ scope: 'local' });
                return;
            }
            if (!response.ok) throw new Error(`Serverfout: ${response.statusText}`);

            const connections = await response.json();
            const decryptedConnections = await decryptConnections(connections, userId);
            if (!isCurrent()) return;
            setAllConnections(decryptedConnections);
            await saveConnectionsToCache(connections); // save raw (encrypted) to cache
        } catch (e) {
            console.error('Fout bij ophalen van alle connecties:', e);
            // The last good list stays on screen; only the error is new.
            if (!silent && isCurrent()) {
                setError('Kon de connecties niet ophalen.');
                setToastMessage('Kon de connecties niet ophalen.');
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [userId, saveConnectionsToCache]);

    useEffect(() => {
        fetchAllConnectionsRef.current = fetchAllConnections;
    }, [fetchAllConnections]);

    // An account switch invalidates every load still under way and every
    // remembered plaintext, and the list on screen belonged to the previous
    // owner. Declared before the effect below, so it runs first.
    useEffect(() => {
        listGenRef.current += 1;
        profileGenRef.current += 1;
        clearDecryptMemo();
        setAllConnections(prev => (prev.length > 0 ? [] : prev));
    }, [userId]);

    // Initialize
    useEffect(() => {
        const initialize = async () => {
            await initializeFromCache();
            if (userId) {
                await fetchData();
            }
        };
        initialize().catch(console.error);
    }, [initializeFromCache, fetchData, userId]);

    // Like handleUpdate: no global isLoading or error, because App swaps the
    // whole view for either and the new-connection form would unmount with
    // the text the user typed. The form shows its own progress, and a failure
    // is thrown so the form stays up for another try.
    const handleCreateConnection = async (formData: ConnectionFormData) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Niet ingelogd');

            const tabsApi = getTabs();
            if (!tabsApi) throw new Error('chrome.tabs is niet beschikbaar.');
            const tabs = await tabsApi.query({ active: true, currentWindow: true });
            const tabUrl = tabs[0]?.url;
            const profileUrl = tabUrl ? profileLookupUrl(tabUrl) : tabUrl;
            const profileName = tabs[0]?.title?.split(' | ')[0] || 'Onbekende Naam';

            const encryptedForm = await encryptFormData({
                meetingPlace: formData.meetingPlace,
                userCompanyAtTheTime: formData.userCompanyAtTheTime,
                notes: formData.notes,
                email: formData.email,
                phone: formData.phone,
            });

            // Explicitely construct payload to ensure no fields are lost and empty strings are handled
            const payload = {
                name: profileName,
                url: profileUrl,
                meetingPlace: encryptedForm.meetingPlace || undefined,
                userCompanyAtTheTime: encryptedForm.userCompanyAtTheTime || undefined,
                notes: encryptedForm.notes || undefined,
                email: encryptedForm.email || undefined,
                phone: encryptedForm.phone || undefined,
            };

            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Opslaan mislukt');
            const newConnection: Connection = await response.json();
            const decArray = await decryptConnections([newConnection], userId);
            setConnection(decArray[0]);

            // A list not loaded yet stays unloaded: a list of one would show
            // when it is opened. The cache below gets the new row either way.
            if (allConnections.length > 0) setAllConnections([...allConnections, decArray[0]]);
            // Re-cache encrypted version from response
            const cachedConnections = await loadCachedConnections();
            await saveConnectionsToCache([...cachedConnections, newConnection]);

            setToastMessage('Connectie opgeslagen.');
        } catch (e) {
            console.error('Fout bij opslaan:', e);
            setToastMessage('Kon de connectie niet opslaan.');
            throw e;
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

    /**
     * A row the server now holds - saved, or found in a conflict - put on
     * screen and in the cache, which keeps the encrypted original. Returns it
     * decrypted.
     */
    const showStoredRow = async (stored: Connection): Promise<Connection> => {
        const [decrypted] = await decryptConnections([stored], userId);
        setConnection(decrypted);
        setAllConnections(prev => prev.map(conn => (conn.id === decrypted.id ? decrypted : conn)));
        const cachedConnections = await loadCachedConnections();
        await saveConnectionsToCache(cachedConnections.map((conn: Connection) => (conn.id === stored.id ? stored : conn)));
        return decrypted;
    };

    /**
     * Turns a refused PATCH into the error the form shows. A 409 conflict
     * (the row changed elsewhere since `expectedUpdatedAt`) carries the
     * stored row: that goes on screen behind the form, and back to the form
     * so the user can load it or overwrite it.
     */
    const refusedUpdate = async (response: Response): Promise<Error> => {
        const body: unknown = await response.json().catch(() => null);
        const current = readConflict(response.status, body);
        if (!current) return new Error('Update mislukt');
        return new ConnectionChangedElsewhereError(await showStoredRow(current as Connection));
    };

    // No global isLoading or error here: App swaps the whole view for either,
    // which unmounted the edit form and threw away what the user had typed.
    // ConnectionView shows its own progress, and a failure is thrown so the
    // form stays open with the text in it.
    //
    // expectedUpdatedAt: the version the form was opened on. With it the
    // server refuses to overwrite a newer save from the note card or another
    // device (ConnectionChangedElsewhereError); without it the save is
    // unconditional, as before.
    const handleUpdate = async (formData: ConnectionFormData, expectedUpdatedAt?: string | null) => {
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

            // Only what the form actually has, minus anything it showed as locked.
            // A field left out of a PATCH stays as it is on the server; null
            // would clear it. See pickFieldsToUpdate.
            const { fields, skippedUnreadable } = pickFieldsToUpdate(formData, SENSITIVE_FIELDS);
            const encryptedFields = await encryptFormData(fields);

            const payload = withExpectedVersion({ id: idToUse, ...encryptedFields }, expectedUpdatedAt);

            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw await refusedUpdate(response);

            await showStoredRow(await response.json());

            setToastMessage(skippedUnreadable.length > 0
                ? 'Connectie bijgewerkt. Vergrendelde velden zijn niet gewijzigd.'
                : 'Connectie bijgewerkt.');
        } catch (e: unknown) {
            // A conflict is not a failure to report: the form explains it.
            if (!(e instanceof ConnectionChangedElsewhereError)) {
                console.error('Fout bij bijwerken:', e);
                setToastMessage('Bijwerken mislukt.');
            }
            throw e;
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // No confirm() here: ConnectionView asks, once, before calling this.
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

            setAllConnections(allConnections.filter(conn => conn.id !== idToUse));

            // The cache holds the server's encrypted rows. allConnections is the
            // decrypted copy for display, and writing that back put every note
            // in plain text into browser storage.
            const cachedConnections = await loadCachedConnections();
            await saveConnectionsToCache(cachedConnections.filter((conn: Connection) => conn.id !== idToUse));

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

    // Sign-out: the previous owner's data goes, and so does anything still
    // loading for them.
    const clearConnectionState = useCallback(async () => {
        listGenRef.current += 1;
        profileGenRef.current += 1;
        clearDecryptMemo();
        setConnection(null);
        setAllConnections([]);
        setError(null);
        await clearConnectionsCache();
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
        showCachedConnections,
        handleCreateConnection,
        handleUpdate,
        handleDelete,
        cleanAllNames,
        clearConnectionState
    };
}
