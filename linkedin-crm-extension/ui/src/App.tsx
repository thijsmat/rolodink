// src/App.tsx
import styles from './App.module.css';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { LoginView } from './components/LoginView';
import { ConnectionView } from './components/ConnectionView';
import { ConnectionForm } from './components/ConnectionForm';
import { Toast } from './components/Toast';

function Content() {
  const { isLoading, isLoggedIn, error, connection, allConnections, isListView, showListView, hideListView, handleLogout, toastMessage, setToastMessage } = useConnection();

  const renderContent = () => {
    if (isLoading) return <p className={styles.loading}>CRM-data wordt geladen...</p>;
    if (!isLoggedIn) return <LoginView />;
    if (error) return <p className={styles.error}>{error}</p>;

    if (isListView) {
      return (
        <div>
          <h2 className={styles.title}>Alle Connecties ({allConnections.length})</h2>
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={hideListView}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Terug naar context
            </button>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {allConnections.map((conn) => (
              <div key={conn.id || conn.linkedInUrl} style={{ 
                padding: '12px', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '8px',
                backgroundColor: 'var(--bg-surface)'
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

    // Contextual view: either a specific connection or new connection form
    return (
      <div>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={showListView} className={styles.button}>Toon alle connecties</button>
        </div>
        {connection ? <ConnectionView /> : (
          <>
            <h2 className={styles.title}>Nieuwe Connectie</h2>
            <ConnectionForm />
          </>
        )}
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
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

function App() {
  return (
    <ConnectionProvider>
      <Content />
    </ConnectionProvider>
  );
}

export default App;