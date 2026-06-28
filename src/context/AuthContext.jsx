import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * Checks if our local 7-day session token is expired
 */
function isTokenExpired(token) {
  if (!token) return true;
  if (!token.startsWith('webtest_session_')) {
    // If it's a legacy Google access token, let the backend handle the verification
    return false;
  }
  try {
    const payloadPart = token.substring('webtest_session_'.length).split('.')[0];
    const payload = JSON.parse(atob(payloadPart));
    return Date.now() > payload.expiry;
  } catch (e) {
    return true; // Treat malformed tokens as expired
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('webtest_token');
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem('webtest_token');
      localStorage.removeItem('webtest_user');
      sessionStorage.setItem('login_error', 'Google token expired. Please login again.');
      return null;
    }
    return storedToken || null;
  });

  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem('webtest_token');
    if (storedToken && isTokenExpired(storedToken)) {
      return null;
    }
    try {
      const stored = localStorage.getItem('webtest_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((googleCredential, userInfo) => {
    setToken(googleCredential);
    setUser(userInfo);
    localStorage.setItem('webtest_token', googleCredential);
    localStorage.setItem('webtest_user', JSON.stringify(userInfo));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('webtest_token');
    localStorage.removeItem('webtest_user');
  }, []);

  // Intercept all fetch requests globally to catch 401 Token Expiry errors
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (
            data.error === 'Google token expired' ||
            data.error?.includes('expired') ||
            data.error?.includes('login again')
          ) {
            logout();
            sessionStorage.setItem('login_error', 'Google token expired. Please login again.');
          }
        } catch (e) {
          // Ignore parsing errors for non-JSON 401s
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  // Memoized so the object reference is stable — prevents TanStack Query cache misses
  const authHeaders = useMemo(
    () =>
      token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' },
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authHeaders, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

