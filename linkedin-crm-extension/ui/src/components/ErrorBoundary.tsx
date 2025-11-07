// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Er is iets misgegaan</h2>
          <p className={styles.errorMessage}>
            De extensie heeft een onverwachte fout ondervonden. Dit kan gebeuren door een tijdelijke storing.
          </p>
          
          {this.state.error && (
            <details className={styles.errorDetails}>
              <summary>Technische details</summary>
              <pre className={styles.errorStack}>
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className={styles.errorActions}>
            <button onClick={this.handleRetry} className={`${styles.button} ${styles.buttonPrimary}`}>
              🔄 Opnieuw proberen
            </button>
            <button onClick={this.handleReload} className={`${styles.button} ${styles.buttonSecondary}`}>
              🔄 Extensie herladen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
