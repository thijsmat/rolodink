// src/components/SettingsView.tsx
import { useState, useCallback } from 'react';
import styles from './SettingsView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { useUpdate } from '../context/UpdateContext';
import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function SettingsView() {
  const { setToastMessage, fetchAllConnections, handleLogout } = useConnection();
  const { versionInfo, isCheckingForUpdates, checkForUpdates, getCurrentVersion } = useUpdate();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

      // Validate current password by making a test API call
      const testResponse = await fetch(`${API_BASE_URL}/api/user/export`, {
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        setToastMessage('Huidig wachtwoord is onjuist of sessie is verlopen.');
        return;
      }

      // Use Supabase client-side password update with proper authentication
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Set the session token
      await supabase.auth.setSession({
        access_token: supabaseAccessToken,
        refresh_token: '', // We don't store refresh tokens
      });

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

  const handleExportData = useCallback(async () => {
    try {
      setIsExporting(true);
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) {
        setToastMessage('Niet ingelogd. Log in om data te exporteren.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/user/export`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${supabaseAccessToken}`,
        },
      });
      
      if (!response.ok) {
        setToastMessage('Export mislukt. Probeer later opnieuw.');
        return;
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'linkedin-crm-export.json';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setToastMessage('Data succesvol geëxporteerd!');
    } catch (e) {
      setToastMessage('Kon data niet exporteren. Controleer je internetverbinding.');
    } finally {
      setIsExporting(false);
    }
  }, [setToastMessage]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = window.confirm(
      'WAARSCHUWING: Dit zal je account en alle gegevens permanent verwijderen!\n\n' +
      'Dit omvat:\n' +
      '• Alle connecties en notities\n' +
      '• Je account informatie\n' +
      '• Alle gerelateerde data\n\n' +
      'Deze actie kan NIET ongedaan worden gemaakt!\n\n' +
      'Typ "VERWIJDER" om te bevestigen:'
    );
    
    if (!confirmed) return;
    
    const verification = prompt('Typ "VERWIJDER" om je account permanent te verwijderen:');
    if (verification !== 'VERWIJDER') {
      setToastMessage('Account verwijdering geannuleerd.');
      return;
    }
    
    try {
      setIsDeleting(true);
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) {
        setToastMessage('Niet ingelogd. Log in om account te verwijderen.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/user/delete`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${supabaseAccessToken}`,
        },
      });
      
      if (!response.ok) {
        setToastMessage('Account verwijdering mislukt. Probeer later opnieuw.');
        return;
      }
      
      const data = await response.json();
      setToastMessage(`Account succesvol verwijderd. ${data.deletedConnections} connecties verwijderd.`);
      
      // Log user out after successful deletion
      setTimeout(() => {
        handleLogout();
      }, 2000);
      
    } catch (e) {
      setToastMessage('Kon account niet verwijderen. Controleer je internetverbinding.');
    } finally {
      setIsDeleting(false);
    }
  }, [setToastMessage, handleLogout]);

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

        {/* GDPR Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Privacy & GDPR</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Exporteer mijn data</h4>
              <p className={styles.settingDescription}>
                Download een volledig overzicht van al je connecties en notities als JSON bestand.
              </p>
            </div>
            <button 
              className={styles.actionButton}
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? '⏳ Exporteren...' : '📊 Exporteer data'}
            </button>
          </div>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Verwijder mijn account</h4>
              <p className={styles.settingDescription}>
                Permanent verwijderen van je account en alle gerelateerde gegevens. Deze actie kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button 
              className={`${styles.actionButton} ${styles.dangerButton}`}
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? '⏳ Verwijderen...' : '🗑️ Verwijder account'}
            </button>
          </div>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Privacybeleid</h4>
              <p className={styles.settingDescription}>
                Lees ons privacybeleid om te begrijpen hoe we je gegevens beschermen en gebruiken.
              </p>
            </div>
            <button 
              className={styles.disabledButton} 
              disabled
              title="Binnenkort beschikbaar"
            >
              📄 Binnenkort beschikbaar
            </button>
          </div>
        </div>

        {/* Update Information Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Updates</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Huidige versie</h4>
              <p className={styles.settingDescription}>
                Je gebruikt versie {getCurrentVersion()} van de Rolodink extensie.
              </p>
            </div>
            <div className={styles.versionInfo}>
              <span className={styles.currentVersion}>{getCurrentVersion()}</span>
              {versionInfo?.updateAvailable && (
                <span className={styles.updateAvailable}>
                  → {versionInfo.latest} beschikbaar
                </span>
              )}
            </div>
          </div>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>Controleer op updates</h4>
              <p className={styles.settingDescription}>
                Controleer handmatig of er een nieuwe versie beschikbaar is.
              </p>
            </div>
            <button 
              className={styles.actionButton}
              onClick={checkForUpdates}
              disabled={isCheckingForUpdates}
            >
              {isCheckingForUpdates ? '⏳ Controleren...' : '🔄 Controleer updates'}
            </button>
          </div>

          {versionInfo?.updateAvailable && (
            <div className={styles.updateInfo}>
              <div className={styles.updateType}>
                {versionInfo.updateType === 'major' && '🚀 Nieuwe hoofdversie'}
                {versionInfo.updateType === 'minor' && '✨ Nieuwe functies'}
                {versionInfo.updateType === 'patch' && '🔧 Verbeteringen'}
              </div>
              <p className={styles.updateDescription}>{versionInfo.releaseNotes}</p>
              {versionInfo.features.length > 0 && (
                <div className={styles.updateFeatures}>
                  <strong>Nieuwe functies:</strong>
                  <ul>
                    {versionInfo.features.slice(0, 3).map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
