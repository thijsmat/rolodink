// src/components/LoginView.tsx
import { useState } from 'react';
import styles from '../App.module.css';
import { useConnection } from '../context/ConnectionContext';

const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

export function LoginView() {
  const { handleLoginSuccess } = useConnection();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const callAuth = async (endpoint: string, payload: any) => {
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
    setMessage(type === 'signin' ? 'Bezig met inloggen...' : 'Bezig met aanmelden...');
    setIsError(false);

    try {
      const data = await callAuth(type, { email, password });
      if (data.session?.access_token) {
        await chrome.storage.local.set({ supabaseAccessToken: data.session.access_token });
        handleLoginSuccess();
      } else {
        setIsError(false);
        setMessage('Account aangemaakt! Check je e-mail voor bevestiging.');
      }
    } catch (e: any) {
      setIsError(true);
      setMessage(e.message || `${type} mislukt.`);
    }
  };

  return (
    <div>
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
        <button onClick={() => handleAuth('signin')} className={styles.button}>Sign in</button>
        <button onClick={() => handleAuth('signup')} className={styles.button} style={{backgroundColor: '#6c757d'}}>Sign up</button>
      </div>
      {message && <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}