// src/context/ConnectionContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { supabase } from '../services/supabase';

export const INVALID_PROFILE_PAGE_ERROR = 'invalid-profile-page';

export type Connection = {
  id?: string;
  name: string;
  meetingPlace?: string | null;
  userCompanyAtTheTime?: string | null;
  notes?: string | null;
  linkedInUrl?: string;
};

export type ConnectionFormData = {
  meetingPlace?: string;
  userCompanyAtTheTime?: string;
  notes?: string;
};

type ConnectionContextState = {
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  connection: Connection | null;
  allConnections: Connection[];
  isListView: boolean;
  isSettingsView: boolean;
  isHelpView: boolean;
  toastMessage: string;
  isInitialized: boolean;
  isInitializing: boolean;
  isOffline: boolean;
  setToastMessage: (message: string) => void;
  fetchData: () => Promise<void>;
  fetchAllConnections: (silent?: boolean) => Promise<void>;
  showListView: () => Promise<void>;
  hideListView: () => void;
  showSettingsView: () => void;
  hideSettingsView: () => void;
  showHelpView: () => void;
  hideHelpView: () => void;
  selectConnection: (connection: Connection) => void;
  handleCreateConnection: (data: ConnectionFormData) => Promise<void>;
  handleUpdate: (data: ConnectionFormData) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleLoginSuccess: () => void;
  cleanAllNames: () => Promise<void>;
  clearError: () => void;
};

const ConnectionContext = createContext<ConnectionContextState | undefined>(undefined);

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
  warnOnce(
    'connection-storage',
    '[ConnectionContext] Storage API is unavailable. Running outside the extension environment.'
  );
  return null;
};

const getTabs = () => {
  if (typeof browser !== 'undefined' && browser.tabs) {
    return browser.tabs;
  }
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    return chrome.tabs;
  }
  warnOnce(
    'connection-tabs',
    '[ConnectionContext] Tabs API is unavailable. Running outside the extension environment.'
  );
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

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [isListView, setIsListView] = useState<boolean>(false);
  const [isSettingsView, setIsSettingsView] = useState<boolean>(false);
  const [isHelpView, setIsHelpView] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Keep latest reference to fetchAllConnections to avoid stale closure in effects
  const fetchAllConnectionsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

  // Cache management functions
  const loadCachedConnections = useCallback(async (): Promise<Connection[]> => {
    try {
      const storage = getStorage();
      if (!storage) {
        warnOnce('connection-cache-read', '[ConnectionContext] chrome.storage.local ontbreekt - cache kan niet geladen worden');
        return [];
      }
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
      if (!storage) {
        warnOnce('connection-cache-write', '[ConnectionContext] chrome.storage.local ontbreekt - sla cache over');
        return;
      }
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
        console.log('Loaded cached connections:', cachedConnections.length);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize from cache:', error);
      setIsInitialized(true);
    }
  }, [loadCachedConnections]);


  // Listen for auth state changes and perform initial check
  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setConnection(null);
          setAllConnections([]);
        }
      } catch (error) {
        console.error('Error checking session in ConnectionContext:', error);
        setIsLoggedIn(false);
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setConnection(null);
        setAllConnections([]);
      }
    });

    // Listen for storage changes from background script
    // When the background script stores a session, we need to manually trigger a session check
    const handleStorageChange = async (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        // Check if any Supabase auth key changed
        const authKeys = Object.keys(changes).filter(key => key.startsWith('sb-') && key.includes('-auth-token'));
        if (authKeys.length > 0) {
          console.log('Auth session changed in storage, reloading session...');

          // Get the key that changed
          const authKey = authKeys[0];
          const newValue = changes[authKey].newValue;

          if (newValue) {
            try {
              // Parse the session data
              const sessionData = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;

              // Get current session to check if it's different
              const { data: { session: currentSession } } = await supabase.auth.getSession();

              // Only set session if the access token is different (prevents infinite loop)
              if (currentSession?.access_token === sessionData.access_token) {
                console.log('Session unchanged, skipping setSession to prevent loop');
                return;
              }

              // Explicitly set the session in Supabase client
              // This is crucial - getSession() alone won't update the client's internal state
              const { error } = await supabase.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token || '',
              });

              if (error) {
                console.error('Error setting session from storage:', error);
              } else {
                console.log('New session detected and set, logging in...');
                setIsLoggedIn(true);
                setToastMessage('Succesvol ingelogd!');
              }
            } catch (error) {
              console.error('Error parsing session from storage:', error);
            }
          }
        }
      }
    };

    // Add storage listener if available
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      subscription.unsubscribe();
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setToastMessage('Internetverbinding hersteld!');
      // Optionally refetch data when coming back online
      if (isLoggedIn) {
        // Use a timeout to avoid dependency issues and race conditions
        setTimeout(() => {
          const callFetch = fetchAllConnectionsRef.current;
          if (callFetch) {
            callFetch(true).catch(console.error);
          }
        }, 1000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setToastMessage('Geen internetverbinding. Je werkt nu offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isLoggedIn]); // Removed allConnections.length to prevent infinite loop

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setIsLoggedIn(false);
        setConnection(null);
        return;
      }
      const supabaseAccessToken = session.access_token;
      setIsLoggedIn(true);

      const tabsApi = getTabs();
      if (!tabsApi) {
        setError('Deze functionaliteit werkt alleen binnen de Rolodink-extensie.');
        setConnection(null);
        // Do NOT set isLoggedIn(false) here, as we still have a valid session
        return;
      }

      const tabs = await tabsApi.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0]?.url;
      if (!currentUrl || !currentUrl.includes('linkedin.com/in/')) {
        setError(INVALID_PROFILE_PAGE_ERROR);
        setConnection(null);
        return;
      }

      const normalizedUrl = normalizeLinkedInUrl(currentUrl);
      const response = await fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(normalizedUrl)}`, {
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const picked = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
        setConnection(picked);
        if (!picked) setAllConnections([]);
      } else if (response.status === 404) {
        setConnection(null);
      } else if (response.status === 401) {
        // Token invalid/expired → force logout and friendly message
        setIsLoggedIn(false);
        setConnection(null);
        setError('Je sessie is verlopen. Log opnieuw in.');
        setToastMessage('Je sessie is verlopen. Log opnieuw in.');
        setToastMessage('Je sessie is verlopen. Log opnieuw in.');
        await supabase.auth.signOut();
        return;
        return;
      } else {
        throw new Error(`Serverfout: ${response.statusText}`);
      }
    } catch (e: unknown) {
      console.error('Fout bij ophalen van connectie:', e);

      // Check if it's a network error
      if (e instanceof TypeError && e.message.includes('fetch')) {
        setError('Geen internetverbinding. Controleer je wifi of mobiele data.');
      } else if (e instanceof Error) {
        if (e.message.includes('401')) {
          setError('Je sessie is verlopen. Log opnieuw in.');
          setIsLoggedIn(false);
          setConnection(null);
          await supabase.auth.signOut(); // Ensure we sign out to prevent loop
        } else if (e.message.includes('403')) {
          setError('Je hebt geen toegang tot deze functie.');
        } else if (e.message.includes('500')) {
          setError('Er is een serverprobleem. Probeer het later opnieuw.');
        } else {
          setError(e.message || 'Kon de connectie-data niet ophalen.');
        }
      } else {
        setError('Kon de connectie-data niet ophalen.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize from cache first, then fetch data
  useEffect(() => {
    const initialize = async () => {
      await initializeFromCache();
      await fetchData();
    };
    initialize();
  }, [initializeFromCache, fetchData]);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
    setToastMessage('Succesvol ingelogd.');
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const storage = getStorage();
    if (storage) {
      await storage.remove([
        'cachedConnections',
        'connectionsCacheTimestamp',
      ]);
    }
    setIsLoggedIn(false);
    setConnection(null);
    setError(null);
    setIsListView(false);
    setAllConnections([]);
    setToastMessage('Uitgelogd.');
  };

  const fetchAllConnections = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Niet ingelogd');
      const supabaseAccessToken = session.access_token;

      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

      if (response.status === 401) {
        setIsLoggedIn(false);
        setConnection(null);
        if (!silent) {
          setError('Je sessie is verlopen. Log opnieuw in.');
          setToastMessage('Je sessie is verlopen. Log opnieuw in.');
        }
        await supabase.auth.signOut();
        return;
      }
      if (!response.ok) throw new Error(`Serverfout: ${response.statusText}`);

      const connections = await response.json();
      setAllConnections(connections);

      // Save to cache
      await saveConnectionsToCache(connections);

      if (silent) {
        console.log('Background refresh completed:', connections.length, 'connections');
      }
    } catch (e) {
      console.error('Fout bij ophalen van alle connecties:', e);
      if (!silent) {
        setError('Kon de connecties niet ophalen.');
        setToastMessage('Kon de connecties niet ophalen.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [saveConnectionsToCache]);

  // Sync ref with the latest fetchAllConnections function
  useEffect(() => {
    fetchAllConnectionsRef.current = fetchAllConnections;
  }, [fetchAllConnections]);

  const showListView = useCallback(async () => {
    setIsListView(true);

    // If we already have connections loaded, show them immediately
    if (allConnections.length > 0) {
      // Trigger background refresh
      fetchAllConnections(true);
    } else {
      // Load from cache first, then fetch from server
      const cachedConnections = await loadCachedConnections();
      if (cachedConnections.length > 0) {
        setAllConnections(cachedConnections);
      }
      // Then fetch fresh data
      await fetchAllConnections();
    }
  }, [allConnections.length, loadCachedConnections, fetchAllConnections]);

  const hideListView = () => {
    setIsListView(false);
  };

  const showSettingsView = () => {
    setIsSettingsView(true);
    setIsListView(false);
    setConnection(null);
  };

  const hideSettingsView = () => {
    setIsSettingsView(false);
  };

  const showHelpView = () => {
    setIsHelpView(true);
    setIsListView(false);
    setIsSettingsView(false);
    setConnection(null);
  };

  const hideHelpView = () => {
    setIsHelpView(false);
  };

  const selectConnection = (conn: Connection) => {
    setConnection(conn);
    setIsListView(false);
    setIsSettingsView(false);
    setIsHelpView(false);
  };

  const handleCreateConnection = async (formData: ConnectionFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Niet ingelogd');
      const supabaseAccessToken = session.access_token;

      const tabsApi = getTabs();
      if (!tabsApi) throw new Error('chrome.tabs is niet beschikbaar.');
      const tabs = await tabsApi.query({ active: true, currentWindow: true });
      const profileUrl = tabs[0]?.url;
      const profileName = tabs[0]?.title?.split(' | ')[0] || 'Onbekende Naam';

      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAccessToken}`
        },
        body: JSON.stringify({ name: profileName, url: profileUrl, ...formData })
      });

      if (!response.ok) throw new Error('Opslaan mislukt');
      const newConnection = await response.json();
      setConnection(newConnection);

      // Update cache with new connection
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
      if (!session?.access_token) return null;
      const supabaseAccessToken = session.access_token;
      const urlCandidate = current?.linkedInUrl;
      const urlToUse = urlCandidate || (await (async () => {
        const tabsApi = getTabs();
        if (!tabsApi) return null;
        const tabs = await tabsApi.query({ active: true, currentWindow: true });
        return tabs[0]?.url || null;
      })());
      if (!urlToUse) return null;
      const normalizedUrl = normalizeLinkedInUrl(urlToUse);
      const resp = await fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(normalizedUrl)}`, {
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const picked = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
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
      if (!session?.access_token) throw new Error('Niet ingelogd');
      const supabaseAccessToken = session.access_token;

      let idToUse: string | undefined = connection?.id;
      if (!idToUse) {
        idToUse = await resolveConnectionId(connection) || undefined;
      }
      if (!idToUse || idToUse === 'undefined' || idToUse === 'null') {
        throw new Error('Connection ID ontbreekt. Ververs en probeer opnieuw.');
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
          'Authorization': `Bearer ${supabaseAccessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Update mislukt`);
      }

      const updated = await response.json();
      setConnection(updated);

      // Update cache with updated connection
      const updatedConnections = allConnections.map(conn =>
        conn.id === updated.id ? updated : conn
      );
      setAllConnections(updatedConnections);
      await saveConnectionsToCache(updatedConnections);

      setToastMessage('Connectie bijgewerkt.');
    } catch (e: unknown) {
      console.error('Fout bij bijwerken:', e);
      const errorMessage = e instanceof Error ? e.message : 'Onbekende fout';
      setError(`Kon de connectie niet bijwerken: ${errorMessage}`);
      setToastMessage(errorMessage || 'Bijwerken mislukt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const confirmed = window.confirm('Weet je zeker dat je deze connectie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.');
      if (!confirmed) {
        setIsLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Niet ingelogd');
      const supabaseAccessToken = session.access_token;

      let idToUse: string | undefined = connection?.id;
      if (!idToUse) {
        idToUse = await resolveConnectionId(connection) || undefined;
      }
      if (!idToUse || idToUse === 'undefined' || idToUse === 'null') {
        throw new Error('Connection ID ontbreekt. Ververs en probeer opnieuw.');
      }

      const response = await fetch(`${API_BASE_URL}/api/connections/${idToUse}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

      if (response.status === 401) {
        throw new Error('Niet ingelogd of sessie verlopen. Log opnieuw in.');
      }
      if (!response.ok) throw new Error('Verwijderen mislukt');
      setConnection(null);

      // Update cache by removing deleted connection
      const updatedConnections = allConnections.filter(conn => conn.id !== idToUse);
      setAllConnections(updatedConnections);
      await saveConnectionsToCache(updatedConnections);

      setToastMessage('Connectie verwijderd.');
    } catch (e: unknown) {
      console.error('Fout bij verwijderen:', e);
      const errorMessage = e instanceof Error ? e.message : 'Onbekende fout';
      setError('Kon de connectie niet verwijderen.');
      setToastMessage(errorMessage || 'Verwijderen mislukt.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanAllNames = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Je bent niet ingelogd.');
        return;
      }
      const supabaseAccessToken = session.access_token;

      const response = await fetch(`${API_BASE_URL}/api/connections/clean-names`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Serverfout: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Clean names result:', result);

      if (result.success) {
        setToastMessage(`✅ ${result.updatedCount} namen opgeschoond van ${result.totalConnections} contacten`);
        // Refresh the connections list to show updated names
        await fetchAllConnections();
      } else {
        setToastMessage('Er is iets misgegaan bij het opschonen van de namen.');
      }
    } catch (e: unknown) {
      console.error('Fout bij opschonen namen:', e);
      setError('Kon de namen niet opschonen.');
      setToastMessage('Fout bij opschonen van namen.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllConnections]);

  const clearError = useCallback(() => setError(null), []);

  const value: ConnectionContextState = useMemo(() => ({
    isLoading,
    error,
    isLoggedIn,
    connection,
    allConnections,
    isListView,
    isSettingsView,
    isHelpView,
    toastMessage,
    isInitialized,
    isInitializing,
    isOffline,
    setToastMessage,
    fetchData,
    fetchAllConnections,
    showListView,
    hideListView,
    showSettingsView,
    hideSettingsView,
    showHelpView,
    hideHelpView,
    selectConnection,
    handleCreateConnection,
    handleUpdate,
    handleDelete,
    handleLogout,
    handleLoginSuccess,
    cleanAllNames,
    clearError,
  }), [
    isLoading,
    error,
    isLoggedIn,
    connection,
    allConnections,
    isListView,
    isSettingsView,
    isHelpView,
    toastMessage,
    isInitialized,
    isInitializing,
    isOffline,
    setToastMessage,
    fetchData,
    fetchAllConnections,
    showListView,
    hideListView,
    showSettingsView,
    hideSettingsView,
    showHelpView,
    hideHelpView,
    selectConnection,
    handleCreateConnection,
    handleUpdate,
    handleDelete,
    handleLogout,
    handleLoginSuccess,
    cleanAllNames,
    clearError,
  ]);

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnection(): ConnectionContextState {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within a ConnectionProvider');
  return ctx;
}
