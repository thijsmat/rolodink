import React, { useState, FormEvent } from 'react';

const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

type LoginViewProps = {
  onLoginSuccess: () => void;
};

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function callAuth(endpoint: 'signin' | 'signup', payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'An unknown error occurred');
    }
    return data;
  }

  const handleAuth = async (type: 'signin' | 'signup') => {
    if (!email || !password) {
      setMessage('Please fill in both email and password.');
      return;
    }
    setIsSubmitting(true);
    setMessage(type === 'signin' ? 'Signing in...' : 'Signing up...');

    try {
      const data = await callAuth(type, { email, password });
      const session = data.session;

      if (session?.access_token) {
        await chrome.storage.local.set({
          supabaseAccessToken: session.access_token,
          supabaseRefreshToken: session.refresh_token || null,
          supabaseExpiresAt: session.expires_at || null,
        });
        setMessage('Success!');
        onLoginSuccess(); // Notify parent component
      } else {
        setMessage('Signed up! Please check your email to confirm.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAuth('signin');
  };

  const inputStyle = 'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100';
  const labelStyle = 'block text-sm font-medium text-gray-700';

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-center mb-4">LinkedIn CRM</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelStyle}>Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} placeholder="you@example.com" disabled={isSubmitting} required />
        </div>
        <div>
          <label htmlFor="password" className={labelStyle}>Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} placeholder="********" disabled={isSubmitting} required />
        </div>
        {message && <p className={`text-sm text-center ${message.includes('Success') || message.includes('check your email') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        <div className="space-y-2 pt-2">
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? 'Processing...' : 'Sign In'}
          </button>
          <button type="button" onClick={() => handleAuth('signup')} disabled={isSubmitting} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:bg-gray-100">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}