import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { getBrowserAPI } from '../utils/browser';
import { isStaleUpdate, shouldCheckForUpdates, UPDATE_CHECK_INTERVAL_MS } from '../utils/updateCheck';

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

const warnOnce = (() => {
  const cache = new Set<string>();
  return (key: string, message: string) => {
    if (cache.has(key)) return;
    cache.add(key);
    console.warn(message);
  };
})();

// Through getBrowserAPI, not a bare chrome.*: in Firefox that global is a
// callback-style shim and an await on it yields undefined instead of the data.
// Outside the extension (vite dev, tests) neither global exists and
// getBrowserAPI throws a ReferenceError on `chrome`; that is "no platform".
const getPlatform = (): typeof chrome | null => {
  try {
    return getBrowserAPI() ?? null;
  } catch {
    return null;
  }
};

const getExtensionStorage = () => {
  const storage = getPlatform()?.storage?.local;
  if (!storage) {
    warnOnce(
      'update-storage',
      '[UpdateContext] storage.local is unavailable. Running outside the extension environment.'
    );
    return null;
  }
  return storage;
};

const getExtensionRuntime = () => {
  const runtime = getPlatform()?.runtime;
  if (!runtime?.getManifest) {
    warnOnce(
      'update-runtime',
      '[UpdateContext] runtime is unavailable. Running outside the extension environment.'
    );
    return null;
  }
  return runtime;
};

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const getCurrentVersion = useCallback(() => {
    // Get version from Chrome extension manifest
    try {
      const runtime = getExtensionRuntime();
      if (!runtime) {
        return '0.0.0';
      }
      return runtime.getManifest().version;
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
      const storage = getExtensionStorage();
      const result = storage ? await storage.get(['dismissedVersion']) : {};
      const isNewUpdate = data.updateAvailable && data.latest !== result?.dismissedVersion;
      
      // Reset dismissal state if this is a new update
      if (isNewUpdate) {
        setUpdateDismissed(false);
        console.log('New update available:', data.latest);
      }
      
      setVersionInfo(data);

      // Record every successful check, not only one that found an update.
      // Written only in that case, the 24-hour limit below never applied to
      // anyone already on the latest version: every popup open asked again.
      if (storage) {
        await storage.set({
          lastUpdateCheck: Date.now(),
          lastCheckedVersion: currentVersion,
        });
        if (data.updateAvailable) {
          await storage.set({ updateInfo: data });
        } else {
          // Clear any existing update info if no update available
          await storage.remove(['updateInfo']);
        }
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
      const storage = getExtensionStorage();
      if (!storage) {
        return;
      }
      await storage.set({
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
    const scheduleCheck = () => {
      // Delay initial check to not interfere with login
      setTimeout(() => {
        void checkForUpdates();
      }, 3000);
    };

    const initializeUpdateSystem = async () => {
      try {
        const storage = getExtensionStorage();
        if (!storage) {
          return;
        }
        const result = await storage.get([
          'dismissedVersion',
          'updateInfo',
          'lastUpdateCheck',
          'lastCheckedVersion',
        ]);
        const currentVersion = getCurrentVersion();
        console.log('Initializing update system, current version:', currentVersion);

        const cached: VersionInfo | undefined = result.updateInfo;
        if (cached && isStaleUpdate(currentVersion, cached.latest)) {
          // The banner offered a version that is installed by now.
          await storage.remove(['updateInfo']);
        } else if (cached) {
          setVersionInfo(cached);
          // Dismissed only for this exact version; a newer one shows again.
          setUpdateDismissed(result.dismissedVersion === cached.latest);
        }

        // Once a day, whether or not the last check found an update, and at
        // once after the extension itself was updated.
        const now = Date.now();
        if (shouldCheckForUpdates(result, currentVersion, now)) {
          scheduleCheck();
        } else {
          const hoursLeft = Math.round((UPDATE_CHECK_INTERVAL_MS - (now - result.lastUpdateCheck)) / (60 * 60 * 1000));
          console.log('Using cached update info, next check in', hoursLeft, 'hours');
        }
      } catch (error) {
        console.warn('Error initializing update system:', error);
        // Fallback: check for updates after delay
        scheduleCheck();
      }
    };

    void initializeUpdateSystem();
  }, [getCurrentVersion, checkForUpdates]);

  // Periodic update check (every hour, but only if no update is currently available)
  useEffect(() => {
    const checkPeriodically = async () => {
      try {
        // Only check periodically if no update is currently available
        if (versionInfo?.updateAvailable) {
          return;
        }
        
        const storage = getExtensionStorage();
        if (!storage) {
          return;
        }
        const result = await storage.get(['lastUpdateCheck', 'lastCheckedVersion']);
        if (shouldCheckForUpdates(result, getCurrentVersion(), Date.now())) {
          await checkForUpdates();
        }
      } catch (error) {
        console.warn('Error in periodic update check:', error);
      }
    };

    // Set up interval for periodic checks (every hour)
    const interval = setInterval(() => {
      void checkPeriodically();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [versionInfo, checkForUpdates, getCurrentVersion]);

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
