import React, { useState, useEffect } from 'react';
import { LoginView } from './components/LoginView';

// Placeholder for the main application view once logged in
function MainAppView({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My Connections</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <p>Welcome! Your connections would be listed here.</p>
      {/* You would render your main components like ConnectionList here */}
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
        if (supabaseAccessToken) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await chrome.storage.local.remove(['supabaseAccessToken', 'supabaseRefreshToken', 'supabaseExpiresAt']);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center"><p>Loading...</p></div>;
  }

  return (
    <div className="w-[320px] bg-gray-50 min-h-[200px]">
      {isLoggedIn ? <MainAppView onLogout={handleLogout} /> : <LoginView onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}

export default App;