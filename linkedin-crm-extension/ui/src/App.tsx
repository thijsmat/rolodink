// src/App.tsx
import styles from './App.module.css';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { LoginView } from './components/LoginView';
import { ConnectionView } from './components/ConnectionView';
import { ConnectionForm } from './components/ConnectionForm';
import { Toast } from './components/Toast';
import { AllConnectionsView } from './components/AllConnectionsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorMessage, OfflineError } from './components/ErrorMessage';

function Content() {
  const { isLoading, isLoggedIn, error, connection, isListView, showListView, hideListView, handleLogout, toastMessage, setToastMessage, isOffline, fetchData } = useConnection();

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
      <div className={styles.header}>
        <h1 className={styles.title}>LinkedIn CRM</h1>
        <div className={styles.headerActions}>
          {isLoggedIn && !isListView && (
            <button onClick={showListView} className={styles.button}>Toon alle connecties</button>
          )}
          {isLoggedIn && isListView && (
            <button onClick={hideListView} className={`${styles.button} ${styles.buttonSecondary}`}>Terug naar context</button>
          )}
          {isLoggedIn && (
            <button onClick={handleLogout} className={`${styles.button} ${styles.buttonSecondary}`}>
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
      <ConnectionProvider>
        <Content />
      </ConnectionProvider>
    </ErrorBoundary>
  );
}

export default App;