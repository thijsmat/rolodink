// src/components/ErrorMessage.tsx
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  showDismiss?: boolean;
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss, 
  type = 'error',
  showRetry = false,
  showDismiss = true 
}: ErrorMessageProps) {
  const getErrorIcon = () => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  };

  const getErrorMessage = (error: string): string => {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'Failed to fetch': 'Geen internetverbinding. Controleer je wifi of mobiele data.',
      'Network request failed': 'Verbindingsprobleem. Controleer je internetverbinding.',
      '401': 'Je sessie is verlopen. Log opnieuw in.',
      '403': 'Je hebt geen toegang tot deze functie.',
      '404': 'De gevraagde informatie kon niet worden gevonden.',
      '500': 'Er is een serverprobleem. Probeer het later opnieuw.',
      'Unauthorized': 'Je sessie is verlopen. Log opnieuw in.',
      'Forbidden': 'Je hebt geen toegang tot deze functie.',
      'Not Found': 'De gevraagde informatie kon niet worden gevonden.',
      'Internal Server Error': 'Er is een serverprobleem. Probeer het later opnieuw.',
      'Connection ID is missing': 'Er is een probleem met deze connectie. Probeer de pagina te vernieuwen.',
      'Connectie bestaat al voor deze URL': 'Deze LinkedIn connectie is al toegevoegd aan Rolodink.',
    };

    // Check for exact matches first
    if (errorMap[error]) {
      return errorMap[error];
    }

    // Check for partial matches
    for (const [key, message] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    // Return original error if no mapping found
    return error;
  };

  const userFriendlyError = getErrorMessage(error);

  return (
    <div className={`${styles.errorMessage} ${styles[type]}`}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>{getErrorIcon()}</div>
        <div className={styles.errorText}>
          <p className={styles.errorTitle}>{userFriendlyError}</p>
          {error !== userFriendlyError && (
            <details className={styles.technicalDetails}>
              <summary>Technische details</summary>
              <code>{error}</code>
            </details>
          )}
        </div>
      </div>
      
      <div className={styles.errorActions}>
        {showRetry && onRetry && (
          <button 
            onClick={onRetry} 
            className={`${styles.button} ${styles.retryButton}`}
            title="Probeer opnieuw"
          >
            🔄 Opnieuw
          </button>
        )}
        {showDismiss && onDismiss && (
          <button 
            onClick={onDismiss} 
            className={`${styles.button} ${styles.dismissButton}`}
            title="Sluiten"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// Specific error components for common scenarios
export function NetworkError({ onRetry, onDismiss }: { onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <ErrorMessage 
      error="Network request failed"
      onRetry={onRetry}
      onDismiss={onDismiss}
      type="error"
      showRetry={true}
    />
  );
}

export function AuthError({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <ErrorMessage 
      error="401"
      onDismiss={onDismiss}
      type="warning"
      showRetry={false}
    />
  );
}

export function OfflineError({ onRetry, onDismiss }: { onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <ErrorMessage 
      error="Failed to fetch"
      onRetry={onRetry}
      onDismiss={onDismiss}
      type="info"
      showRetry={true}
    />
  );
}
