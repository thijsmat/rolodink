// src/components/SettingsView.tsx
import { useState, useCallback } from 'react';
import styles from './SettingsView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function SettingsView() {
  const { setToastMessage, fetchAllConnections } = useConnection();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleCleanNames = useCallback(async () => {
    try {
      setIsCleaning(true);
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) {
        setToastMessage('Niet ingelogd. Log in om op te schonen.');
        return;
      }
      
      const resp = await fetch(`${API_BASE_URL}/api/connections/clean-names`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!resp.ok) {
        setToastMessage('Opschonen mislukt. Probeer later opnieuw.');
        return;
      }
      
      const data = await resp.json().catch(() => null);
      const updated = data?.updatedCount ?? 0;
      setToastMessage(`Namen opgeschoond: ${updated} bijgewerkt.`);
      
      // Refresh list silently
      await fetchAllConnections();
    } catch (e) {
      setToastMessage('Kon niet opschonen. Controleer je internetverbinding.');
    } finally {
      setIsCleaning(false);
    }
  }, [fetchAllConnections, setToastMessage]);

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToastMessage('Nieuwe wachtwoorden komen niet overeen.');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setToastMessage('Nieuw wachtwoord moet minimaal 6 tekens lang zijn.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) {
        setToastMessage('Niet ingelogd. Log in om wachtwoord te wijzigen.');
        return;
      }

      // Use Supabase client-side password update
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setToastMessage(`Wachtwoord wijzigen mislukt: ${error.message}`);
        return;
      }

      setToastMessage('Wachtwoord succesvol gewijzigd.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (e) {
      setToastMessage('Kon wachtwoord niet wijzigen. Controleer je internetverbinding.');
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordData, setToastMessage]);

  const handleInputChange = (field: keyof typeof passwordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Instellingen</h2>
        <p className={styles.subtitle}>Beheer je account en gegevens</p>
      </div>

      <div className={styles.content}>
        {/* Data Management Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Gegevensbeheer</h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Profielnamen opschonen</h4>
              <p className={styles.settingDescription}>
                Verwijder notificatie-aantallen zoals "(1)" of "(2)" uit profielnamen in je connecties.
              </p>
            </div>
            <button 
              className={styles.actionButton}
              onClick={handleCleanNames}
              disabled={isCleaning}
            >
              {isCleaning ? 'Bezig...' : '🧹 Opschonen'}
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Account</h3>
          
          {!showPasswordForm ? (
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingName}>Wachtwoord wijzigen</h4>
                <p className={styles.settingDescription}>
                  Wijzig je wachtwoord voor extra beveiliging.
                </p>
              </div>
              <button 
                className={styles.actionButton}
                onClick={() => setShowPasswordForm(true)}
              >
                🔒 Wijzigen
              </button>
            </div>
          ) : (
            <form className={styles.passwordForm} onSubmit={handlePasswordChange}>
              <h4 className={styles.formTitle}>Wachtwoord wijzigen</h4>
              
              <div className={styles.inputGroup}>
                <label htmlFor="currentPassword" className={styles.label}>
                  Huidige wachtwoord
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handleInputChange('currentPassword')}
                  className={styles.input}
                  placeholder="Huidige wachtwoord"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  Nieuw wachtwoord
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handleInputChange('newPassword')}
                  className={styles.input}
                  placeholder="Minimaal 6 tekens"
                  required
                  minLength={6}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Bevestig nieuw wachtwoord
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className={styles.input}
                  placeholder="Herhaal nieuw wachtwoord"
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  Annuleren
                </button>
                <button 
                  type="submit"
                  className={styles.submitButton}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Bezig...' : 'Wijzigen'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Future Features Placeholder */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Toekomstige functies</h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Data exporteren</h4>
              <p className={styles.settingDescription}>
                Exporteer je connecties naar CSV of Excel bestand.
              </p>
            </div>
            <button className={styles.disabledButton} disabled>
              📊 Binnenkort beschikbaar
            </button>
          </div>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Donkere modus</h4>
              <p className={styles.settingDescription}>
                Schakel tussen lichte en donkere interface.
              </p>
            </div>
            <button className={styles.disabledButton} disabled>
              🌙 Binnenkort beschikbaar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
