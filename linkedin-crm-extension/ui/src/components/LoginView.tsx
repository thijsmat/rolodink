// src/components/LoginView.tsx
import { useState } from 'react';
import styles from './LoginView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { API_BASE_URL } from '../config';

export function LoginView() {
  const { handleLoginSuccess } = useConnection();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  type AuthPayload = {
    email: string;
    password: string;
  };

  const callAuth = async (endpoint: string, payload: AuthPayload) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Unknown error');
    return data;
  };

  const handleAuth = async (type: 'signin' | 'signup') => {
    if (!email || !password) {
      setIsError(true);
      setMessage('Vul e-mail en wachtwoord in.');
      return;
    }
    
    setIsLoading(true);
    setMessage(type === 'signin' ? 'Bezig met inloggen...' : 'Bezig met registreren...');
    setIsError(false);

    try {
      const data = await callAuth(type, { email, password });
      if (data.session?.access_token) {
        await chrome.storage.local.set({
          supabaseAccessToken: data.session.access_token,
          supabaseRefreshToken: data.session.refresh_token ?? null,
          supabaseSessionExpiresAt: data.session.expires_at ?? null,
        });
        handleLoginSuccess();
      } else {
        setIsError(false);
        setMessage('Account aangemaakt! Check je e-mail voor bevestiging.');
      }
    } catch (e: unknown) {
      setIsError(true);
      const errorMessage = e instanceof Error ? e.message : `${type} mislukt.`;
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>in</div>
        <h1 className={styles.title}>Rolodink</h1>
        <p className={styles.subtitle}>
          Beheer je LinkedIn connecties op één plek met Rolodink
        </p>
      </div>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="je@email.com"
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="••••••••"
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={() => handleAuth('signin')}
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isLoading}
          >
            {isLoading ? 'Bezig...' : 'Inloggen'}
          </button>
          <button
            onClick={() => handleAuth('signup')}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoading}
          >
            Registreren
          </button>
        </div>
      </form>

      {message && (
        <div className={`${styles.message} ${isError ? styles.messageError : styles.messageSuccess}`}>
          {message}
        </div>
      )}

      <div className={styles.features}>
        <h3 className={styles.featuresTitle}>Wat kun je doen?</h3>
        <div className={styles.featuresList}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✓</span>
            <span>Voeg LinkedIn profielen toe aan Rolodink</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✓</span>
            <span>Bewaar notities en ontmoetingsdetails</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✓</span>
            <span>Bekijk al je connecties overzichtelijk</span>
          </div>
        </div>
      </div>
    </div>
  );
}