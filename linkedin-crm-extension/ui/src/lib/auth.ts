export async function getStoredToken(): Promise<string | null> {
  const result = await chrome.storage.session.get(['supabaseAccessToken']);
  const token = result?.supabaseAccessToken as string | undefined;
  if (!token) {
    console.warn('No session token found. User needs to re-authenticate.');
    return null;
  }
  return token;
}

export async function setStoredToken(token: string): Promise<void> {
  await chrome.storage.session.set({ supabaseAccessToken: token });
}

export async function clearStoredToken(): Promise<void> {
  await chrome.storage.session.remove(['supabaseAccessToken', 'cachedConnections', 'connectionsCacheTimestamp']);
}


