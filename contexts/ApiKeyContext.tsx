import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  removeApiKey: () => void;
  isUsingServerKey: boolean; // True if Vercel backend has a key (user doesn't need to provide one)
  isConfigured: boolean;     // True if we have a usable key (server or user-provided)
  isLoading: boolean;        // True while checking server key status
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isUsingServerKey, setIsUsingServerKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Check if backend has a key
      try {
        const res = await fetch('/api/key-status');
        if (res.ok) {
          const data = await res.json();
          if (data.hasServerKey) {
            // Backend has the key — frontend doesn't need one
            setIsUsingServerKey(true);
            setApiKeyState('__server__'); // Sentinel value: signals "use proxy"
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Local dev or fetch failed — fall through to BYOK
      }

      // 2. No server key — check localStorage for user-provided key
      const storedKey = localStorage.getItem('user_gemini_api_key');
      if (storedKey) {
        setApiKeyState(storedKey);
      }
      setIsUsingServerKey(false);
      setIsLoading(false);
    };

    init();
  }, []);

  const setApiKey = (key: string) => {
    if (!key.trim()) return;
    setApiKeyState(key);
    setIsUsingServerKey(false);
    localStorage.setItem('user_gemini_api_key', key);
  };

  const removeApiKey = () => {
    setApiKeyState(null);
    setIsUsingServerKey(false);
    localStorage.removeItem('user_gemini_api_key');
  };

  return (
    <ApiKeyContext.Provider value={{
      apiKey,
      setApiKey,
      removeApiKey,
      isUsingServerKey,
      isConfigured: !!apiKey,
      isLoading,
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};