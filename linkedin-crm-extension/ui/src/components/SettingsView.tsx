// src/components/SettingsView.tsx
import { useState, useCallback, useEffect } from 'react';
import styles from './SettingsView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { useUpdate } from '../context/UpdateContext';
import { API_BASE_URL } from '../config';
import { supabase } from '../services/supabase';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';
import { isDeleteConfirmation } from '../utils/deleteConfirmation';
import { ConfirmPanel } from './ConfirmPanel';
import { buildFeedbackMailto, detectBrowserName, supportEmailFor } from '../utils/feedback';
import { downloadBlob } from '../utils/download';
import { useReadableExport } from '../hooks/useReadableExport';
import { ReadableExportSetting } from './ReadableExportSetting';

/** A setting row whose action opens a link in a new tab. */
function LinkSetting({ title, description, href, label }: Readonly<{
  title: string;
  description: string;
  href: string;
  label: string;
}>) {
  return (
    <div className={styles.settingItem}>
      <div className={styles.settingInfo}>
        <h4 className={styles.settingName}>{title}</h4>
        <p className={styles.settingDescription}>{description}</p>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
        {label}
      </a>
    </div>
  );
}

export function SettingsView() {
  const { setToastMessage, fetchAllConnections, handleLogout } = useConnection();
  const { t } = useExtensionTranslation();
  const { versionInfo, isCheckingForUpdates, checkForUpdates, getCurrentVersion } = useUpdate();
  const extensionVersion = getCurrentVersion();
  const browserName = detectBrowserName(typeof navigator === 'undefined' ? '' : navigator.userAgent);
  const uiLanguage = (typeof chrome !== 'undefined' && chrome.i18n ? chrome.i18n.getUILanguage() : 'nl').split('-')[0];
  const feedbackHref = buildFeedbackMailto(
    supportEmailFor(uiLanguage),
    t('feedback_mail_subject', [extensionVersion, browserName]),
    t('feedback_mail_body', [extensionVersion, browserName]),
  );
  const [isCleaning, setIsCleaning] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { exportingFormat, progress: exportProgress, exportReadable } = useReadableExport(t, setToastMessage);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextFieldEnabled, setContextFieldEnabled] = useState(true);

  const loadSettings = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('contextFieldEnabled', (result) => {
        if (result.contextFieldEnabled !== undefined) {
          setContextFieldEnabled(result.contextFieldEnabled);
        }
      });
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

      // The email comes from the session that is already open, never from a
      // form field, so the check below can only sign in as the same user.
      const email = session?.user?.email;
      if (!session?.access_token || !email) {
        setToastMessage(t('msg_not_logged_in_password'));
        return;
      }

      // Check the current password for real. The previous check was a GET on
      // /api/user/export, which only proved the session was valid: any
      // current password was accepted.
      const { data: verified, error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: passwordData.currentPassword,
      });
      if (verifyError) {
        setToastMessage(t('msg_current_password_incorrect'));
        return;
      }
      if (verified?.user?.id !== session.user.id) {
        // Cannot happen with the session's own email, but if it ever did the
        // client would now hold someone else's session. Drop it rather than
        // change that account's password.
        await supabase.auth.signOut({ scope: 'local' });
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

      // End every other session of this account: those include the one the
      // check above replaced here, and any on another device that may belong
      // to whoever knew the old password. This session stays signed in. A
      // failure here does not undo the change, so it is only logged.
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
      if (signOutError) console.error('Could not end other sessions:', signOutError);

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
      const filenameMatch = contentDisposition ? /filename="([^"]+)"/.exec(contentDisposition) : null;
      const filename = filenameMatch ? filenameMatch[1] : 'linkedin-crm-export.json';

      downloadBlob(await response.blob(), filename);

      setToastMessage(t('msg_export_success'));
    } catch (e) {
      setToastMessage(t('msg_export_error_network'));
    } finally {
      setIsExporting(false);
    }
  }, [setToastMessage]);

  // Called by the inline ConfirmPanel with what the user typed. That panel
  // replaced globalThis.confirm + prompt(), which in a Firefox popup can open
  // as a separate window and close the popup.
  const handleDeleteAccount = useCallback(async (verification: string) => {
    setShowDeleteConfirm(false);
    if (!isDeleteConfirmation(verification)) {
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
      // The account is gone; log out now instead of after a timer that did
      // not run if the popup closed first. The success toast comes after, so
      // the logout's own "logged out" toast does not replace it.
      await handleLogout().catch(console.error);
      setToastMessage(t('msg_delete_success', [data.deletedConnections]));
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

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('passphrase_title')}</h4>
              <p className={styles.settingDescription}>
                {t('passphrase_description')}
              </p>
            </div>
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

          <ReadableExportSetting
            t={t}
            exportingFormat={exportingFormat}
            progress={exportProgress}
            onExport={(format) => void exportReadable(format)}
          />

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <h4 className={styles.settingName}>{t('delete_account_title')}</h4>
              <p className={styles.settingDescription}>
                {t('delete_account_description')}
              </p>
            </div>
            <button
              className={`${styles.actionButton} ${styles.dangerButton}`}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting || showDeleteConfirm}
            >
              {isDeleting ? t('deleting_button') : t('delete_account_button')}
            </button>
          </div>

          {showDeleteConfirm && (
            <ConfirmPanel
              message={t('msg_delete_warning')}
              confirmLabel={t('delete_account_confirm_button')}
              cancelLabel={t('cancel_button')}
              busy={isDeleting}
              typedConfirmation={{
                label: t('msg_delete_prompt'),
                isValid: (verification) => isDeleteConfirmation(verification),
              }}
              onConfirm={(verification) => void handleDeleteAccount(verification)}
              onCancel={() => {
                setShowDeleteConfirm(false);
                setToastMessage(t('msg_delete_cancelled'));
              }}
            />
          )}

          <LinkSetting
            title={t('privacy_policy_title')}
            description={t('privacy_policy_description')}
            href={`https://rolodink.app/${uiLanguage}/privacy`}
            label={t('privacy_policy_button')}
          />
        </div>

        {/* Feedback: version and browser only, nothing about pages or the account. */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('feedback_section_title')}</h3>
          <LinkSetting
            title={t('feedback_title')}
            description={t('feedback_description')}
            href={feedbackHref}
            label={t('feedback_button')}
          />
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
