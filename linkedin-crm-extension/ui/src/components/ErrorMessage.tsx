// src/components/ErrorMessage.tsx
import { type ReactNode } from 'react';
import { INVALID_PROFILE_PAGE_ERROR } from '../context/ConnectionContext';
import styles from './ErrorMessage.module.css';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  showDismiss?: boolean;
  description?: ReactNode;
  retryLabel?: string;
  variant?: 'default' | 'profileHint';
}

export function ErrorMessage({
  error,
  onRetry,
  onDismiss,
  type = 'error',
  showRetry = false,
  showDismiss = true,
  description,
  retryLabel,
  variant = 'default',
}: ErrorMessageProps) {
  const { t } = useExtensionTranslation();

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
      'Failed to fetch': t('error_network'),
      'Network request failed': t('error_request_failed'),
      '401': t('error_401'),
      '403': t('error_403'),
      '404': t('error_404'),
      '500': t('error_500'),
      'Unauthorized': t('error_unauthorized'),
      'Forbidden': t('error_forbidden'),
      'Not Found': t('error_not_found'),
      'Internal Server Error': t('error_internal_server'),
      'Connection ID is missing': t('error_missing_id'),
      'Connectie bestaat al voor deze URL': t('error_duplicate'),
      [INVALID_PROFILE_PAGE_ERROR]: t('error_invalid_page'),
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
  const shouldShowTechnicalDetails = error !== userFriendlyError && error !== INVALID_PROFILE_PAGE_ERROR;
  const containerClasses = [styles.errorMessage, styles[type]];
  if (variant === 'profileHint') {
    containerClasses.push(styles.profileHint);
  }

  return (
    <div className={containerClasses.join(' ')}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>{getErrorIcon()}</div>
        <div className={styles.errorText}>
          <p className={styles.errorTitle}>{userFriendlyError}</p>
          {description && (
            <p className={styles.errorBody}>{description}</p>
          )}
          {shouldShowTechnicalDetails && (
            <details className={styles.technicalDetails}>
              <summary>{t('technical_details')}</summary>
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
            title={retryLabel ?? t('retry_button_title')}
          >
            {retryLabel ?? t('retry_button_label')}
          </button>
        )}
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className={`${styles.button} ${styles.dismissButton}`}
            title={t('dismiss_button_title')}
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
