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
    // Get version from Chrome extension manifest
    try {
      return chrome.runtime.getManifest().version;
    } catch (error) {
      console.error('Failed to get extension version:', error);
      return '1.0.0'; // Fallback version
    }
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
      
      // Check if this is a new update (different from previously dismissed)
      const result = await chrome.storage.local.get(['dismissedVersion']);
      const isNewUpdate = data.updateAvailable && data.latest !== result.dismissedVersion;
      
      // Reset dismissal state if this is a new update
      if (isNewUpdate) {
        setUpdateDismissed(false);
        console.log('New update available:', data.latest);
      }
      
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
    if (!versionInfo?.latest) {
      console.warn('Cannot dismiss update: no version info available');
      return;
    }

    // Store dismissal in chrome storage first to ensure consistency
    try {
      await chrome.storage.local.set({
        dismissedVersion: versionInfo.latest,
      });
      
      // Only update local state after successful storage
      setUpdateDismissed(true);
      console.log('Update dismissed for version:', versionInfo.latest);
    } catch (error) {
      console.error('Failed to store dismissal state:', error);
      // Don't update local state if storage fails
    }
  }, [versionInfo]);

  // Initialize update system (load cached data and check for updates)
  useEffect(() => {
    const initializeUpdateSystem = async () => {
      try {
        const result = await chrome.storage.local.get(['dismissedVersion', 'updateInfo', 'lastUpdateCheck']);
        const currentVersion = getCurrentVersion();
        console.log('Initializing update system, current version:', currentVersion);
        
        // Load cached update info if available
        if (result.updateInfo) {
          setVersionInfo(result.updateInfo);
          
          // Check if this specific update was previously dismissed
          if (result.dismissedVersion === result.updateInfo.latest) {
            setUpdateDismissed(true);
            console.log('Update notification dismissed for version:', result.updateInfo.latest);
          } else {
            // If cached update is different from dismissed version, it's a newer update
            setUpdateDismissed(false);
            console.log('New update available (different from dismissed):', result.updateInfo.latest);
          }
        }
        
        // Always check for updates if enough time has passed, regardless of dismissal state
        // This ensures users get notified of newer versions even after dismissing older ones
        const lastCheck = result.lastUpdateCheck || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const shouldCheck = !result.updateInfo || (now - lastCheck > oneDay);
        
        if (shouldCheck) {
          // Delay initial check to not interfere with login
          setTimeout(() => {
            checkForUpdates();
          }, 3000);
        } else {
          console.log('Using cached update info, next check in', Math.round((oneDay - (now - lastCheck)) / (60 * 60 * 1000)), 'hours');
        }
        
      } catch (error) {
        console.warn('Error initializing update system:', error);
        // Fallback: check for updates after delay
        setTimeout(() => {
          checkForUpdates();
        }, 3000);
      }
    };

    initializeUpdateSystem();
  }, [getCurrentVersion, checkForUpdates]);

  // Periodic update check (every hour, but only if no update is currently available)
  useEffect(() => {
    const checkPeriodically = async () => {
      try {
        // Only check periodically if no update is currently available
        if (versionInfo?.updateAvailable) {
          return;
        }
        
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

    // Set up interval for periodic checks (every hour)
    const interval = setInterval(checkPeriodically, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [versionInfo, checkForUpdates]);

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
