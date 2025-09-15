// src/context/ConnectionContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

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
  toastMessage: string;
  isInitialized: boolean;
  setToastMessage: (msg: string) => void;
  fetchData: () => Promise<void>;
  fetchAllConnections: () => Promise<void>;
  showListView: () => Promise<void>;
  hideListView: () => void;
  selectConnection: (conn: Connection) => void;
  handleCreateConnection: (formData: ConnectionFormData) => Promise<void>;
  handleUpdate: (formData: ConnectionFormData) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleLoginSuccess: () => void;
};

const ConnectionContext = createContext<ConnectionContextState | undefined>(undefined);

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
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Cache management functions
  const loadCachedConnections = useCallback(async (): Promise<Connection[]> => {
    try {
      const result = await chrome.storage.local.get('cachedConnections');
      return result.cachedConnections || [];
    } catch (error) {
      console.error('Failed to load cached connections:', error);
      return [];
    }
  }, []);

  const saveConnectionsToCache = useCallback(async (connections: Connection[]) => {
    try {
      await chrome.storage.local.set({ 
        cachedConnections: connections,
        connectionsCacheTimestamp: Date.now()
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) {
        setIsLoggedIn(false);
        setConnection(null);
        return;
      }
      setIsLoggedIn(true);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0]?.url;
      if (!currentUrl || !currentUrl.includes('linkedin.com/in/')) {
        setError('Dit is geen geldige LinkedIn profielpagina.');
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
      } else {
        throw new Error(`Serverfout: ${response.statusText}`);
      }
    } catch (e) {
      console.error('Fout bij ophalen van connectie:', e);
      setError('Kon de connectie-data niet ophalen.');
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

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setToastMessage('Succesvol ingelogd.');
    fetchData();
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove(['supabaseAccessToken', 'cachedConnections', 'connectionsCacheTimestamp']);
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
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

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

  const selectConnection = (conn: Connection) => {
    setConnection(conn);
    setIsListView(false);
  };

  const handleCreateConnection = async (formData: ConnectionFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) return null;
      const urlCandidate = current?.linkedInUrl;
      const urlToUse = urlCandidate || (await (async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

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
    } catch (e: any) {
      console.error('Fout bij bijwerken:', e);
      setError(`Kon de connectie niet bijwerken: ${e?.message || 'Onbekende fout'}`);
      setToastMessage(e?.message || 'Bijwerken mislukt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const confirmed = window.confirm('Weet je zeker dat je deze connectie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.');
      if (!confirmed) return;

      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

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
    } catch (e: any) {
      console.error('Fout bij verwijderen:', e);
      setError('Kon de connectie niet verwijderen.');
      setToastMessage(e?.message || 'Verwijderen mislukt.');
    } finally {
      setIsLoading(false);
    }
  };

  const value: ConnectionContextState = useMemo(() => ({
    isLoading,
    error,
    isLoggedIn,
    connection,
    allConnections,
    isListView,
    toastMessage,
    isInitialized,
    setToastMessage,
    fetchData,
    fetchAllConnections,
    showListView,
    hideListView,
    selectConnection,
    handleCreateConnection,
    handleUpdate,
    handleDelete,
    handleLogout,
    handleLoginSuccess,
  }), [
    isLoading,
    error,
    isLoggedIn,
    connection,
    allConnections,
    isListView,
    toastMessage,
    isInitialized,
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


