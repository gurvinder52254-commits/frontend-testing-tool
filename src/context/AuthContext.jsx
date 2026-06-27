import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Persist login across page refreshes
    try {
      const stored = localStorage.getItem('webtest_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('webtest_token') || null);

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

  // Returns headers object with Authorization token for all API calls
  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

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
