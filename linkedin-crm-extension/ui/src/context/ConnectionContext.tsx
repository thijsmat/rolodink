// src/context/ConnectionContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuthLogic } from '../hooks/useAuthLogic';
import { useConnectionLogic } from '../hooks/useConnectionLogic';

export const INVALID_PROFILE_PAGE_ERROR = 'invalid-profile-page';

export type Connection = {
  id?: string;
  name: string;
  meetingPlace?: string | null;
  userCompanyAtTheTime?: string | null;
  notes?: string | null;
  linkedInUrl?: string;
};

export type ConnectionFormData = {
  meetingPlace?: string;
  userCompanyAtTheTime?: string;
  notes?: string;
};

type ConnectionContextState = {
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  connection: Connection | null;
  allConnections: Connection[];
  isListView: boolean;
  isSettingsView: boolean;
  isHelpView: boolean;
  toastMessage: string;
  isInitialized: boolean;
  isInitializing: boolean;
  isOffline: boolean;
  setToastMessage: (message: string) => void;
  fetchData: () => Promise<void>;
  fetchAllConnections: (silent?: boolean) => Promise<void>;
  showListView: () => Promise<void>;
  hideListView: () => void;
  showSettingsView: () => void;
  hideSettingsView: () => void;
  showHelpView: () => void;
  hideHelpView: () => void;
  selectConnection: (connection: Connection) => void;
  handleCreateConnection: (data: ConnectionFormData) => Promise<void>;
  handleUpdate: (data: ConnectionFormData) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleLoginSuccess: () => void;
  cleanAllNames: () => Promise<void>;
  clearError: () => void;
};

const ConnectionContext = createContext<ConnectionContextState | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI State (kept in Context as it's view-specific)
  const [isListView, setIsListView] = useState<boolean>(false);
  const [isSettingsView, setIsSettingsView] = useState<boolean>(false);
  const [isHelpView, setIsHelpView] = useState<boolean>(false);

  // Hooks
  const { session, user, isInitializing, signOut, refreshSession } = useAuthLogic();
  const {
    isLoading,
    error,
    connection,
    allConnections,
    isInitialized,
    isOffline,
    toastMessage,
    setToastMessage,
    setConnection,
    setError,
    fetchData,
    fetchAllConnections,
    handleCreateConnection,
    handleUpdate,
    handleDelete,
    cleanAllNames,
    clearConnectionState
  } = useConnectionLogic(user);

  const isLoggedIn = !!session;

  const handleLoginSuccess = useCallback(() => {
    refreshSession(); // Ensure auth state is up to date
    setToastMessage('Succesvol ingelogd.');
    fetchData();
  }, [fetchData, refreshSession, setToastMessage]);

  const handleLogout = async () => {
    await signOut();
    await clearConnectionState();
    setIsListView(false);
    setToastMessage('Uitgelogd.');
  };

  const showListView = useCallback(async () => {
    setIsListView(true);
    if (allConnections.length > 0) {
      fetchAllConnections(true);
    } else {
      await fetchAllConnections();
    }
  }, [allConnections.length, fetchAllConnections]);

  const hideListView = () => setIsListView(false);

  const showSettingsView = () => {
    setIsSettingsView(true);
    setIsListView(false);
    setConnection(null);
  };

  const hideSettingsView = () => setIsSettingsView(false);

  const showHelpView = () => {
    setIsHelpView(true);
    setIsListView(false);
    setIsSettingsView(false);
    setConnection(null);
  };

  const hideHelpView = () => setIsHelpView(false);

  const selectConnection = (conn: Connection) => {
    setConnection(conn);
    setIsListView(false);
    setIsSettingsView(false);
    setIsHelpView(false);
  };

  const clearError = useCallback(() => setError(null), [setError]);

  const value: ConnectionContextState = useMemo(() => ({
    isLoading,
    error,
    isLoggedIn,
    connection,
    allConnections,
    isListView,
    isSettingsView,
    isHelpView,
    toastMessage,
    isInitialized,
    isInitializing,
    isOffline,
    setToastMessage,
    fetchData,
    fetchAllConnections,
    showListView,
    hideListView,
    showSettingsView,
    hideSettingsView,
    showHelpView,
    hideHelpView,
    selectConnection,
    handleCreateConnection,
    handleUpdate,
    handleDelete,
    handleLogout,
    handleLoginSuccess,
    cleanAllNames,
    clearError,
  }), [
    isLoading,
    error,
    isLoggedIn,
    connection,
    allConnections,
    isListView,
    isSettingsView,
    isHelpView,
    toastMessage,
    isInitialized,
    isInitializing,
    isOffline,
    setToastMessage,
    fetchData,
    fetchAllConnections,
    showListView,
    hideListView,
    showSettingsView,
    hideSettingsView,
    showHelpView,
    hideHelpView,
    selectConnection,
    handleCreateConnection,
    handleUpdate,
    handleDelete,
    handleLogout,
    handleLoginSuccess,
    cleanAllNames,
    clearError,
  ]);

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnection(): ConnectionContextState {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return ctx;
}
