// src/components/LoginView.tsx
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
} from 'react';

import styles from './LoginView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { API_BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { getAuthRedirectUrl } from '../utils/auth';
import { getBrowserAPI } from '../utils/browser';
import { supabase } from '../services/supabase';
import { useTranslation } from '../hooks/useTranslation';

export function LoginView() {
  const { t } = useTranslation();
  const { handleLoginSuccess, isInitializing } = useConnection();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lastAuthIntentRef = useRef<'signin' | 'signup'>('signin');
  const edgePointerHandledRef = useRef(false);

  if (isInitializing) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  const isEdgeBrowser = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /\bEdg\//i.test(navigator.userAgent);
  }, []);
  type AuthPayload = {
    email: string;
    password: string;
  };

  const callAuth = useCallback(async (endpoint: string, payload: AuthPayload) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || t('msg_unknown_error'));
    return data;
  }, [t]);

  const handleAuth = useCallback(async (type: 'signin' | 'signup') => {
    if (!email || !password) {
      setIsError(true);
      setMessage(t('msg_enter_email_password'));
      return;
    }

    setIsLoading(true);
    setMessage(type === 'signin' ? t('msg_logging_in') : t('msg_registering'));
    setIsError(false);

    try {
      const data = await callAuth(type, { email, password });
      if (data.session?.access_token) {
        const { error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
        });
        if (error) throw error;
        handleLoginSuccess();
      } else {
        setIsError(false);
        setMessage(t('msg_account_created'));
      }
    } catch (e: unknown) {
      setIsError(true);
      const errorMessage = e instanceof Error ? e.message : `${type}${t('msg_failed_suffix')}`;
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callAuth, email, handleLoginSuccess, password, t]);

  const triggerAuth = useCallback((type: 'signin' | 'signup', event?: SyntheticEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>) => {
    // Only prevent default if it's not a form submit event we want to allow
    // But here we are triggering auth manually
    event?.preventDefault();
    event?.stopPropagation();
    void handleAuth(type);
  }, [handleAuth]);

  const createClickHandler = useCallback((type: 'signin' | 'signup') => (event?: MouseEvent<HTMLButtonElement>) => {
    lastAuthIntentRef.current = type;
    if (isEdgeBrowser) {
      if (edgePointerHandledRef.current) {
        edgePointerHandledRef.current = false;
        event?.preventDefault();
        event?.stopPropagation();
        return;
      }
    }
    // If it's the submit button (signin), let the form submit handler handle it?
    // Or just trigger auth directly.
    // The original code triggered auth directly.
    triggerAuth(type, event);
  }, [isEdgeBrowser, triggerAuth]);

  const createPointerHandler = useCallback((type: 'signin' | 'signup') => (event: PointerEvent<HTMLButtonElement>) => {
    if (!isEdgeBrowser) return;
    lastAuthIntentRef.current = type;
    edgePointerHandledRef.current = true;
    event.preventDefault();
    event.stopPropagation();
    triggerAuth(type, event);
  }, [isEdgeBrowser, triggerAuth]);

  const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Default to signin on enter key
    void handleAuth('signin');
  }, [handleAuth]);

  const handleLinkedInLogin = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setMessage(t('msg_supabase_config_missing'));
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage(t('msg_linkedin_login_progress'));
    setIsError(false);

    try {
      const redirectUrl = getAuthRedirectUrl('provider_cb');

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          scopes: 'email profile openid',
        },
      });

      if (authError) throw authError;
      if (!data?.url) throw new Error(t('msg_no_auth_url'));

      getBrowserAPI().runtime.sendMessage({
        type: 'START_AUTH',
        url: data.url,
      });

      setMessage(t('msg_auth_background_processing'));

    } catch (e: unknown) {
      console.error('LinkedIn login error:', e);
      setIsError(true);
      setMessage(e instanceof Error ? e.message : t('msg_linkedin_login_failed'));
      setIsLoading(false);
    }
  }, [handleLoginSuccess, t]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>in</div>
        <h1 className={styles.title}>{t('appName')}</h1>
        <p className={styles.subtitle}>
          {t('subtitle')}
        </p>
      </div>

      <form className={styles.form} onSubmit={handleFormSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            {t('email_label')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder={t('email_placeholder')}
            disabled={isLoading}
            required
            autoComplete="username"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            {t('password_label')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder={t('password_placeholder')}
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            onClick={createClickHandler('signin')}
            onPointerDown={isEdgeBrowser ? createPointerHandler('signin') : undefined}
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isLoading}
          >
            {isLoading ? t('processing') : t('login_button')}
          </button>
          <button
            type="button"
            onClick={createClickHandler('signup')}
            onPointerDown={isEdgeBrowser ? createPointerHandler('signup') : undefined}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoading}
          >
            {t('register_button')}
          </button>
        </div>

        <div className={styles.divider}>
          <span>{t('or')}</span>
        </div>

        <button
          type="button"
          onClick={handleLinkedInLogin}
          className={`${styles.button} ${styles.buttonLinkedIn}`}
          disabled={isLoading}
        >
          <svg className={styles.linkedinIcon} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
          </svg>
          {t('login_linkedin_button')}
        </button>
      </form>

      {message && (
        <div className={`${styles.message} ${isError ? styles.messageError : styles.messageSuccess}`}>
          {message}
        </div>
      )}

      <div className={styles.features}>
        <h3 className={styles.featuresTitle}>{t('features_title')}</h3>
        <div className={styles.featuresList}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✓</span>
            <span>{t('feature_add_profiles')}</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✓</span>
            <span>{t('feature_save_notes')}</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✓</span>
            <span>{t('feature_view_connections')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}