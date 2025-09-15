// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import styles from './App.module.css';
import { LoginView } from './components/LoginView';
import { ConnectionView } from './components/ConnectionView';
import { ConnectionForm, ConnectionFormData } from './components/ConnectionForm';

const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

interface Connection {
  id: string;
  name: string;
  meetingPlace?: string;
  userCompanyAtTheTime?: string;
  notes?: string;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchData = useCallback(async () => {
    // Deze functie wordt nu de enige bron voor het ophalen van data
    setIsLoading(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0]?.url;

      if (!currentUrl || !currentUrl.includes('linkedin.com/in/')) {
        setError('Dit is geen geldige LinkedIn profielpagina.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(currentUrl)}`, {
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

      if (response.ok) {
        setConnection(await response.json());
      } else if (response.status === 404) {
        setConnection(null);
      } else {
        throw new Error(`Serverfout: ${response.statusText}`);
      }
    } catch (e) {
      console.error("Fout bij ophalen van connectie:", e);
      setError('Kon de connectie-data niet ophalen.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchData();
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove('supabaseAccessToken');
    setIsLoggedIn(false);
    setConnection(null);
    setError(null);
  };

  const handleConnectionDeleted = () => {
    setConnection(null);
    setError(null);
  };

  const fetchAllConnections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        headers: { 'Authorization': `Bearer ${supabaseAccessToken}` }
      });

      if (!response.ok) throw new Error(`Serverfout: ${response.statusText}`);
      
      const connections = await response.json();
      setAllConnections(connections);

    } catch (e) {
      console.error("Fout bij ophalen van alle connecties:", e);
      setError('Kon de connecties niet ophalen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnection = async (formData: ConnectionFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const profileUrl = tabs[0]?.url;
      const profileName = tabs[0]?.title?.split(' | ')[0] || "Onbekende Naam";

      const response = await fetch(`${API_BASE_URL}/api/connections`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAccessToken}`
          },
          body: JSON.stringify({
              name: profileName,
              url: profileUrl,
              ...formData
          }),
      });

      if (!response.ok) throw new Error('Opslaan mislukt');
      
      const newConnection = await response.json();
      setConnection(newConnection);
    } catch (e) {
      console.error("Fout bij opslaan:", e);
      setError("Kon de connectie niet opslaan.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) return <p className={styles.loading}>CRM-data wordt geladen...</p>;
    if (!isLoggedIn) return <LoginView onLoginSuccess={handleLoginSuccess} />;
    if (error) return <p className={styles.error}>{error}</p>;

    if (connection) {
      return (
        <ConnectionView 
          connection={connection} 
          onConnectionUpdate={setConnection}
          onConnectionDeleted={handleConnectionDeleted}
        />
      );
    }

    if (allConnections.length > 0) {
      return (
        <div>
          <h2 className={styles.title}>Alle Connecties ({allConnections.length})</h2>
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={() => setAllConnections([])} 
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Terug naar nieuwe connectie
            </button>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {allConnections.map((conn) => (
              <div key={conn.id} style={{ 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                marginBottom: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <strong>{conn.name}</strong>
                {conn.meetingPlace && <div>Ontmoet op: {conn.meetingPlace}</div>}
                {conn.notes && <div>Notities: {conn.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className={styles.title}>Nieuwe Connectie</h2>
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={fetchAllConnections} 
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Laden...' : 'Toon alle connecties'}
          </button>
        </div>
        <ConnectionForm
          onSubmit={handleCreateConnection}
          isSubmitting={isLoading}
          submitText="Connectie Opslaan"
        />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>LinkedIn CRM</h1>
        {isLoggedIn && (
          <button onClick={handleLogout} className={`${styles.button} ${styles.buttonSecondary}`}>
            Logout
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
}

export default App;