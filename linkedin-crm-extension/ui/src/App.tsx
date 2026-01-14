// src/App.tsx
import { useEffect } from 'react';
import styles from './App.module.css';
import { ConnectionProvider, useConnection, INVALID_PROFILE_PAGE_ERROR } from './context/ConnectionContext';
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
import { useExtensionTranslation } from './hooks/useExtensionTranslation';

function Content() {
  const { isLoading, isLoggedIn, error, connection, isListView, isSettingsView, isHelpView, showListView, hideListView, showSettingsView, hideSettingsView, showHelpView, hideHelpView, handleLogout, toastMessage, setToastMessage, isOffline, fetchData, clearError } = useConnection();
  const { t } = useExtensionTranslation();

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
    if (isLoading) return <p className={styles.loading}>{t('loading')}</p>;
    if (!isLoggedIn) return <LoginView />;
    if (error) {
      const isProfilePageWarning = error === INVALID_PROFILE_PAGE_ERROR;

      return (
        <div className={styles.errorContainer}>
          {isOffline ? (
            <OfflineError onRetry={fetchData} onDismiss={() => setToastMessage('')} />
          ) : (
            <ErrorMessage
              error={error}
              onRetry={isProfilePageWarning ? clearError : fetchData}
              onDismiss={() => {
                clearError();
                setToastMessage('');
              }}
              showRetry={true}
              retryLabel={isProfilePageWarning ? 'OK' : undefined}
              type={isProfilePageWarning ? 'info' : 'error'}
              description={
                isProfilePageWarning ? (
                  <>
                    Open een LinkedIn profiel om connecties te bekijken. Niet zeker waar te beginnen? Bekijk{' '}
                    <a
                      href="https://www.linkedin.com/in/matthijsgoes"
                      target="_blank"
                      rel="noreferrer"
                    >
                      mijn profiel
                    </a>{' '}
                    als voorbeeld.
                  </>
                ) : undefined
              }
              variant={isProfilePageWarning ? 'profileHint' : undefined}
            />
          )}
        </div>
      );
    }

    if (isListView) {
      return (
        <div>
          <h2 className={styles.title}>{t('feature_view_connections')}</h2>
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
            <h2 className={styles.title}>{t('new_connection_title')}</h2>
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
        <h1 className={styles.mainTitle}>{t('appName')}</h1>
        <div className={styles.headerActions}>
          {isLoggedIn && !isListView && !isSettingsView && (
            <button onClick={showListView} className={styles.compactButton}>{t('show_all_connections_button')}</button>
          )}
          {isLoggedIn && !isListView && !isSettingsView && (
            <button onClick={showSettingsView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>⚙️ {t('settings_button')}</button>
          )}
          {isLoggedIn && isListView && (
            <button onClick={hideListView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>{t('back_to_context_button')}</button>
          )}
          {isLoggedIn && isSettingsView && (
            <button onClick={hideSettingsView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>{t('back_to_context_button')}</button>
          )}
          {isLoggedIn && isHelpView && (
            <button onClick={hideHelpView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>{t('back_to_context_button')}</button>
          )}
          {isLoggedIn && !isHelpView && (
            <button onClick={showHelpView} className={`${styles.compactButton} ${styles.buttonSecondary}`}>❓ {t('help_button')}</button>
          )}
          {isLoggedIn && (
            <button onClick={handleLogout} className={`${styles.compactButton} ${styles.buttonSecondary}`}>
              {t('logout_button')}
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