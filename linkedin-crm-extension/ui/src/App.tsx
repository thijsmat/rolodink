// src/App.tsx
import { useEffect } from 'react';
import styles from './App.module.css';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { UpdateProvider } from './context/UpdateContext';
import { LoginView } from './components/LoginView';
import { ConnectionView } from './components/ConnectionView';
import { ConnectionForm } from './components/ConnectionForm';
import { Toast } from './components/Toast';
import { AllConnectionsView } from './components/AllConnectionsView';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';
import { UpdateNotification } from './components/UpdateNotification';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorMessage, OfflineError } from './components/ErrorMessage';

function Content() {
  const { isLoading, isLoggedIn, error, connection, isListView, isSettingsView, isHelpView, showListView, hideListView, showSettingsView, hideSettingsView, showHelpView, hideHelpView, handleLogout, toastMessage, setToastMessage, isOffline, fetchData } = useConnection();

  // Global keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when logged in and not in form inputs
      if (!isLoggedIn) return;
      
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Escape key for navigation
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isListView) {
          hideListView();
        } else if (connection) {
          // Go back to list view from connection details
          showListView();
        }
      }

      // Alt+L for logout (when not in list view)
      if (event.altKey && event.key === 'l' && !isListView) {
        event.preventDefault();
        handleLogout();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, isListView, connection, showListView, hideListView, handleLogout]);

  const renderContent = () => {
    if (isLoading) return <p className={styles.loading}>CRM-data wordt geladen...</p>;
    if (!isLoggedIn) return <LoginView />;
    if (error) {
      return (
        <div className={styles.errorContainer}>
          {isOffline ? (
            <OfflineError onRetry={fetchData} onDismiss={() => setToastMessage('')} />
          ) : (
            <ErrorMessage 
              error={error} 
              onRetry={fetchData} 
              onDismiss={() => setToastMessage('')}
              showRetry={true}
            />
          )}
        </div>
      );
    }

    if (isListView) {
      return (
        <div>
          <h2 className={styles.title}>Alle Connecties</h2>
          <AllConnectionsView />
        </div>
      );
    }

    if (isSettingsView) {
      return <SettingsView />;
    }

    if (isHelpView) {
      return <HelpView />;
    }

    // Contextual view: either a specific connection or new connection form
    return (
      <div>
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
      {/* Update Notification */}
      <UpdateNotification />
      
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>LinkedIn CRM</h1>
        <div className={styles.headerActions}>
          {isLoggedIn && !isListView && !isSettingsView && (
            <button onClick={showListView} className={styles.compactButton}>Toon alle connecties</button>
          )}
          {isLoggedIn && !isListView && !isSettingsView && (
            <button onClick={showSettingsView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>⚙️ Instellingen</button>
          )}
          {isLoggedIn && isListView && (
            <button onClick={hideListView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>Terug naar context</button>
          )}
          {isLoggedIn && isSettingsView && (
            <button onClick={hideSettingsView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>Terug naar context</button>
          )}
          {isLoggedIn && isHelpView && (
            <button onClick={hideHelpView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>Terug naar context</button>
          )}
          {isLoggedIn && !isHelpView && (
            <button onClick={showHelpView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>❓ Help</button>
          )}
          {isLoggedIn && (
            <button onClick={handleLogout} className={`${styles.compactButton} ${styles.buttonSecondary}`}>
              Logout
            </button>
          )}
        </div>
      </div>
      <div className={styles.contentArea}>
        {renderContent()}
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <UpdateProvider>
        <ConnectionProvider>
          <Content />
        </ConnectionProvider>
      </UpdateProvider>
    </ErrorBoundary>
  );
}

export default App;