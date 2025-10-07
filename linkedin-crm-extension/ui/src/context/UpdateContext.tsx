import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

interface VersionInfo {
  latest: string;
  current: string;
  updateAvailable: boolean;
  updateType: 'major' | 'minor' | 'patch' | null;
  releaseNotes: string;
  downloadUrl: string;
  features: string[];
  bugFixes: string[];
  breakingChanges: string[];
}

interface UpdateContextState {
  versionInfo: VersionInfo | null;
  isCheckingForUpdates: boolean;
  updateDismissed: boolean;
  checkForUpdates: () => Promise<void>;
  dismissUpdate: () => void;
  getCurrentVersion: () => string;
}

const UpdateContext = createContext<UpdateContextState | undefined>(undefined);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const getCurrentVersion = useCallback(() => {
    // Get version from manifest.json
    return '1.0.0'; // This should match your manifest.json version
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      setIsCheckingForUpdates(true);
      const currentVersion = getCurrentVersion();
      
      const response = await fetch(
        `${API_BASE_URL}/api/version?version=${currentVersion}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to check for updates');
        return;
      }

      const data = await response.json();
      setVersionInfo(data);

      // Store update info in chrome storage for persistence
      if (data.updateAvailable) {
        await chrome.storage.local.set({
          updateInfo: data,
          lastUpdateCheck: Date.now(),
        });
      } else {
        // Clear any existing update info if no update available
        await chrome.storage.local.remove(['updateInfo']);
      }

    } catch (error) {
      console.warn('Error checking for updates:', error);
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [getCurrentVersion]);

  const dismissUpdate = useCallback(async () => {
    setUpdateDismissed(true);
    
    // Store dismissal in chrome storage
    if (versionInfo?.latest) {
      await chrome.storage.local.set({
        dismissedVersion: versionInfo.latest,
        updateDismissed: true,
      });
    }
  }, [versionInfo]);

  // Load previously dismissed update info
  useEffect(() => {
    const loadDismissedUpdate = async () => {
      try {
        const result = await chrome.storage.local.get(['dismissedVersion', 'updateInfo']);
        const currentVersion = getCurrentVersion();
        console.log('Checking for updates, current version:', currentVersion);
        
        // If user dismissed this specific version, don't show update notification
        if (result.dismissedVersion === result.updateInfo?.latest) {
          setUpdateDismissed(true);
        }
        
        // Load cached update info
        if (result.updateInfo) {
          setVersionInfo(result.updateInfo);
        }
      } catch (error) {
        console.warn('Error loading dismissed update info:', error);
      }
    };

    loadDismissedUpdate();
  }, [getCurrentVersion]);

  // Check for updates on app start (with delay to not interfere with login)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000); // Wait 3 seconds after app start

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  // Periodically check for updates (every 24 hours)
  useEffect(() => {
    const checkPeriodically = async () => {
      try {
        const result = await chrome.storage.local.get(['lastUpdateCheck']);
        const lastCheck = result.lastUpdateCheck || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (now - lastCheck > oneDay) {
          checkForUpdates();
        }
      } catch (error) {
        console.warn('Error in periodic update check:', error);
      }
    };

    // Check immediately
    checkPeriodically();

    // Set up interval for periodic checks
    const interval = setInterval(checkPeriodically, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  const value: UpdateContextState = {
    versionInfo,
    isCheckingForUpdates,
    updateDismissed,
    checkForUpdates,
    dismissUpdate,
    getCurrentVersion,
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
}
