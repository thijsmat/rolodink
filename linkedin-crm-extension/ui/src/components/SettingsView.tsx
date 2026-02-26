// src/components/SettingsView.tsx
import { useState, useCallback, useEffect } from 'react';
import styles from './SettingsView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { useUpdate } from '../context/UpdateContext';
import { API_BASE_URL } from '../config';
import { supabase } from '../services/supabase';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';
import { getPasswordKey, encryptText, decryptText } from '../utils/cryptoHelper';

export function SettingsView() {
  const { setToastMessage, fetchAllConnections, handleLogout, isNewUser } = useConnection();
  const { t } = useExtensionTranslation();
  const { versionInfo, isCheckingForUpdates, checkForUpdates, getCurrentVersion } = useUpdate();
  const [isCleaning, setIsCleaning] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);
  const [passphraseActive, setPassphraseActive] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [contextFieldEnabled, setContextFieldEnabled] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [isSavingPassphrase, setIsSavingPassphrase] = useState(false);

  // Load initial settings and check if a passphrase is active
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('contextFieldEnabled', (result) => {
        if (result.contextFieldEnabled !== undefined) {
          setContextFieldEnabled(result.contextFieldEnabled);
        }
      });
    }
    // Check if a passphrase is currently set in the session
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'CHECK_PASSPHRASE' })
        .then((res: { active?: boolean } | undefined) => {
          setPassphraseActive(res?.active === true);
        })
        .catch(() => setPassphraseActive(false));
    }
  }, []);

  const toggleContextField = useCallback(async () => {
    const newValue = !contextFieldEnabled;
    setContextFieldEnabled(newValue);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ contextFieldEnabled: newValue });
    }
  }, [contextFieldEnabled]);

  const handleCleanNames = useCallback(async () => {
    try {
      setIsCleaning(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setToastMessage(t('msg_not_logged_in_clean'));
        return;
      }
      const supabaseAccessToken = session.access_token;

      const resp = await fetch(`${API_BASE_URL}/api/connections/clean-names`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!resp.ok) {
        setToastMessage(t('msg_clean_failed'));
        return;
      }

      const data = await resp.json().catch(() => null);
      const updated = data?.updatedCount ?? 0;
      setToastMessage(t('msg_clean_success', [updated]));

      // Refresh list silently
      await fetchAllConnections();
    } catch (e) {
      setToastMessage(t('msg_clean_error_network'));
    } finally {
      setIsCleaning(false);
    }
  }, [fetchAllConnections, setToastMessage]);

  const handleSavePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    try {
      setIsSavingPassphrase(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const token = session.access_token;
      let salt = '';

      // API_BASE_URL is imported from '../config'
      const API_KEY_ENDPOINT = `${API_BASE_URL}/api/user/key`;

      const getResp = await fetch(API_KEY_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (getResp.ok) {
        const userKey: { salt: string, encrypted_key: string } = await getResp.json();
        salt = userKey.salt;

        try {
          const key = await getPasswordKey(passphrase, salt);
          const verifyText = await decryptText(userKey.encrypted_key, key);
          if (verifyText !== 'rolodink-verify') {
            throw new Error('Onjuist wachtwoord.');
          }
        } catch (err) {
          console.error('Passphrase verification failed:', err);
          setToastMessage(t('msg_passphrase_error')); // Of een specifieke "Onjuist wachtwoord" melding
          setIsSavingPassphrase(false);
          return;
        }
      } else if (getResp.status === 404) {
        salt = crypto.randomUUID();
        const key = await getPasswordKey(passphrase, salt);
        const encrypted_key = await encryptText('rolodink-verify', key);

        const postResp = await fetch(API_KEY_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ salt, encrypted_key })
        });

        if (!postResp.ok) throw new Error('Failed to save key to server');
      } else {
        throw new Error('Server error');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'SET_PASSPHRASE',
        passphrase: passphrase,
        salt: salt
      });

      if (response && response.success) {
        setPassphraseActive(true);
        setToastMessage(t('msg_passphrase_saved'));
        setPassphrase('');
      } else {
        const errorMsg = response?.error || t('msg_passphrase_error');
        setToastMessage(errorMsg);
      }
    } catch (e) {
      console.error(e);
      setToastMessage(t('msg_passphrase_error'));
    } finally {
      setIsSavingPassphrase(false);
    }
  };

  const SENSITIVE_FIELDS = ['notes', 'meetingPlace', 'userCompanyAtTheTime', 'email', 'phone'] as const;

  const handleMigration = async () => {
    if (!passphraseActive) {
      setToastMessage('⚠️ Stel eerst een wachtwoordzin in voordat je migreert.');
      return;
    }

    const confirmed = window.confirm(
      'Dit versleutelt alle bestaande leesbare tekst in je privacyvelden. Doorgaan?'
    );
    if (!confirmed) return;

    setIsMigrating(true);
    setMigrateResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setToastMessage('Niet ingelogd.');
        return;
      }
      const token = session.access_token;

      // Fetch all connections
      const resp = await fetch(`${API_BASE_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('Kon connecties niet ophalen.');
      const connections: Record<string, string | null>[] = await resp.json();

      let migratedCount = 0;
      const errors: string[] = [];

      for (const conn of connections) {
        const updates: Record<string, string> = {};

        for (const field of SENSITIVE_FIELDS) {
          const value = conn[field];
          if (typeof value === 'string' && value.length > 0 && !value.startsWith('rolodink-enc:')) {
            try {
              const encResp = await chrome.runtime.sendMessage({ type: 'ENCRYPT_TEXT', text: value });
              if (encResp?.success) {
                updates[field] = encResp.ciphertext;
              }
            } catch (err) {
              console.error(`Failed to encrypt field '${field}' for connection ${conn.id}:`, err);
              errors.push(conn.id as string);
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          try {
            const patchResp = await fetch(`${API_BASE_URL}/api/connections`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ id: conn.id, ...updates }),
            });
            if (patchResp.ok) {
              migratedCount++;
            } else {
              errors.push(conn.id as string);
            }
          } catch (err) {
            console.error(`Failed to migrate connection ${conn.id}:`, err);
            errors.push(conn.id as string);
          }
        }
      }

      const resultMsg = errors.length > 0
        ? `✅ ${migratedCount} profiel(en) versleuteld. ❌ ${errors.length} fout(en).`
        : `✅ ${migratedCount} profiel(en) succesvol versleuteld!`;
      setMigrateResult(resultMsg);
      setToastMessage(resultMsg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Onbekende fout';
      setMigrateResult(`❌ Migratie mislukt: ${msg}`);
      setToastMessage(`Migratie mislukt: ${msg}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToastMessage(t('msg_password_mismatch'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setToastMessage(t('msg_password_too_short'));
      return;
    }

    try {
      setIsChangingPassword(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setToastMessage(t('msg_not_logged_in_password'));
        return;
      }
      const supabaseAccessToken = session.access_token;

      // Validate current password by making a test API call
      const testResponse = await fetch(`${API_BASE_URL}/api/user/export`, {
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        setToastMessage(t('msg_current_password_incorrect'));
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setToastMessage(t('msg_password_change_failed', [error.message]));
        return;
      }

      // Tokens are automatically persisted by the client

      setToastMessage(t('msg_password_change_success'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (e) {
      setToastMessage(t('msg_password_change_error_network'));
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setToastMessage(t('msg_not_logged_in_export'));
        return;
      }
      const supabaseAccessToken = session.access_token;

      const response = await fetch(`${API_BASE_URL}/api/user/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
        },
      });

      if (!response.ok) {
        setToastMessage(t('msg_export_failed'));
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

      setToastMessage(t('msg_export_success'));
    } catch (e) {
      setToastMessage(t('msg_export_error_network'));
    } finally {
      setIsExporting(false);
    }
  }, [setToastMessage]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = window.confirm(t('msg_delete_warning'));

    if (!confirmed) return;

    const verification = prompt(t('msg_delete_prompt'));
    if (verification !== 'VERWIJDER') {
      setToastMessage(t('msg_delete_cancelled'));
      return;
    }

    try {
      setIsDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setToastMessage(t('msg_not_logged_in_delete'));
        return;
      }
      const supabaseAccessToken = session.access_token;

      const response = await fetch(`${API_BASE_URL}/api/user/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
        },
      });

      if (!response.ok) {
        setToastMessage(t('msg_delete_failed'));
        return;
      }

      const data = await response.json();
      setToastMessage(t('msg_delete_success', [data.deletedConnections]));

      // Log user out after successful deletion
      setTimeout(() => {
        handleLogout();
      }, 2000);

    } catch (e) {
      setToastMessage(t('msg_delete_error_network'));
    } finally {
      setIsDeleting(false);
    }
  }, [setToastMessage, handleLogout]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('settings_title')}</h2>
        <p className={styles.subtitle}>{t('settings_subtitle')}</p>
      </div>

      <div className={styles.content}>
        {/* Data Management Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('data_management')}</h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('clean_names_title')}</h4>
              <p className={styles.settingDescription}>
                {t('clean_names_description')}
              </p>
            </div>
            <button
              className={styles.actionButton}
              onClick={handleCleanNames}
              disabled={isCleaning}
            >
              {isCleaning ? t('cleaning_button') : t('clean_names_button')}
            </button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('profile_context_field_title')}</h4>
              <p className={styles.settingDescription}>
                {t('profile_context_field_description')}
              </p>
            </div>
            <label className={styles.toggleSwitch} aria-label={t('context_field_aria_label')}>
              <input
                type="checkbox"
                checked={contextFieldEnabled}
                onChange={toggleContextField}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('security_encryption_title')}</h3>

          {isNewUser && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '4px',
              color: '#166534',
              fontSize: '13px',
              lineHeight: '1.5',
            }}>
              👋 <strong>Welkom bij Rolodink!</strong> Om je netwerk veilig te houden, maken we gebruik van een versleutelde kluis. Stel hieronder je eenmalige wachtwoordzin in.
            </div>
          )}

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('passphrase_title')}</h4>
              <p className={styles.settingDescription}>
                {t('passphrase_description')}
              </p>
            </div>
          </div>

          <form className={styles.passwordForm} onSubmit={handleSavePassphrase}>
            <div className={styles.inputGroup}>
              <label htmlFor="passphrase" className={styles.label}>
                {t('passphrase_label')}
              </label>
              <input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className={styles.input}
                placeholder={t('passphrase_placeholder')}
                required
              />
            </div>

            <div className={styles.formActions} style={{ justifyContent: 'flex-start', marginTop: '12px' }}>
              <button
                type="submit"
                className={styles.actionButton}
                disabled={isSavingPassphrase || !passphrase.trim()}
              >
                {isSavingPassphrase ? t('processing_button') : t('passphrase_save_button')}
              </button>
            </div>
          </form>

          {/* Migration subsection */}
          <div className={styles.passwordForm} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 className={styles.formTitle} style={{ margin: 0 }}>🔄 Migreer bestaande data</h4>
              <p className={styles.settingDescription}>
                Versleutel alle nog leesbare tekst in je privacyvelden (notities, locatie, e-mail, telefoon). Stel eerst een wachtwoordzin in.
              </p>
            </div>

            <button
              className={styles.actionButton}
              style={{ alignSelf: 'flex-start' }}
              onClick={handleMigration}
              disabled={isMigrating || !passphraseActive}
              title={!passphraseActive ? 'Stel eerst een wachtwoordzin in' : undefined}
            >
              {isMigrating ? '⏳ Bezig…' : '🔒 Migreer naar veilige kluis'}
            </button>

            {migrateResult && (
              <span style={{ marginTop: '8px', fontWeight: 600, color: migrateResult.includes('❌') ? '#dc3545' : '#057642' }}>
                {migrateResult}
              </span>
            )}
          </div>
        </div>

        {/* Account Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('account_section_title')}</h3>

          {!showPasswordForm ? (
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h4 className={styles.settingName}>{t('change_password_title')}</h4>
                <p className={styles.settingDescription}>
                  {t('change_password_description')}
                </p>
              </div>
              <button
                className={styles.actionButton}
                onClick={() => setShowPasswordForm(true)}
              >
                {t('change_password_button')}
              </button>
            </div>
          ) : (
            <form className={styles.passwordForm} onSubmit={handlePasswordChange}>
              <h4 className={styles.formTitle}>{t('change_password_title')}</h4>

              <div className={styles.inputGroup}>
                <label htmlFor="currentPassword" className={styles.label}>
                  {t('current_password_label')}
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handleInputChange('currentPassword')}
                  className={styles.input}
                  placeholder={t('current_password_placeholder')}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  {t('new_password_label')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handleInputChange('newPassword')}
                  className={styles.input}
                  placeholder={t('new_password_placeholder')}
                  required
                  minLength={6}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  {t('confirm_password_label')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className={styles.input}
                  placeholder={t('confirm_password_placeholder')}
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
                  {t('cancel_button')}
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? t('processing_button') : t('submit_change_password_button')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* GDPR Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('privacy_gdpr_title')}</h3>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('export_data_title')}</h4>
              <p className={styles.settingDescription}>
                {t('export_data_description')}
              </p>
            </div>
            <button
              className={styles.actionButton}
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? t('exporting_button') : t('export_data_button')}
            </button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('delete_account_title')}</h4>
              <p className={styles.settingDescription}>
                {t('delete_account_description')}
              </p>
            </div>
            <button
              className={`${styles.actionButton} ${styles.dangerButton}`}
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? t('deleting_button') : t('delete_account_button')}
            </button>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('privacy_policy_title')}</h4>
              <p className={styles.settingDescription}>
                {t('privacy_policy_description')}
              </p>
            </div>
            <a
              href={`https://rolodink.app/${(typeof chrome !== 'undefined' && chrome.i18n ? chrome.i18n.getUILanguage() : 'nl').split('-')[0]}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionButton}
            >
              {t('privacy_policy_button')}
            </a>
          </div>
        </div>

        {/* Update Information Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('updates_section_title')}</h3>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('current_version_title')}</h4>
              <p className={styles.settingDescription}>
                {t('current_version_description', [getCurrentVersion()])}
              </p>
            </div>
            <div className={styles.versionInfo}>
              <span className={styles.currentVersion}>{getCurrentVersion()}</span>
              {versionInfo?.updateAvailable && (
                <span className={styles.updateAvailable}>
                  {t('update_available_label', [versionInfo.latest])}
                </span>
              )}
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('check_updates_title')}</h4>
              <p className={styles.settingDescription}>
                {t('check_updates_description')}
              </p>
            </div>
            <button
              className={styles.actionButton}
              onClick={checkForUpdates}
              disabled={isCheckingForUpdates}
            >
              {isCheckingForUpdates ? t('checking_button') : t('check_updates_button')}
            </button>
          </div>

          {versionInfo?.updateAvailable && (
            <div className={styles.updateInfo}>
              <div className={styles.updateType}>
                {versionInfo.updateType === 'major' && t('update_type_major')}
                {versionInfo.updateType === 'minor' && t('update_type_minor')}
                {versionInfo.updateType === 'patch' && t('update_type_patch')}
              </div>
              <p className={styles.updateDescription}>{versionInfo.releaseNotes}</p>
              {versionInfo.features.length > 0 && (
                <div className={styles.updateFeatures}>
                  <strong>{t('new_features_label')}</strong>
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
      </div >
    </div >
  );
}
