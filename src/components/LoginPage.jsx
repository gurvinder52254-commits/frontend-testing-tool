import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const err = sessionStorage.getItem('login_error');
    if (err) {
      setErrorMessage(err);
      sessionStorage.removeItem('login_error'); // Clear immediately so it does not persist on subsequent reloads
    }
  }, []);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Verify token with backend, which will upsert the user into the database
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        
        if (data.success && data.user) {
          // Store backend-issued 7-day session token, with fallback to Google access token
          login(data.token || tokenResponse.access_token, data.user);
        } else {
          console.error('Backend authentication failed:', data.error);
          setErrorMessage(data.error || 'Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('Failed to log in with backend:', err);
        setErrorMessage('Failed to connect to authentication server.');
      }
    },
    onError: (err) => {
      console.error('Google Login Error:', err);
      setErrorMessage('Google Login was unsuccessful or canceled.');
    },
  });

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Error Banner */}
        {errorMessage && (
          <div className="login-error-banner" style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#ef4444',
            padding: '12px',
            fontSize: '0.82rem',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 500
          }}>
            ⚠️ {errorMessage}
          </div>
        )}
        {/* Logo & Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#grad)" />
              <path d="M12 24L20 32L36 16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="login-title">WebTest AI</h1>
          <p className="login-subtitle">Intelligent Website Testing Platform</p>
        </div>

        {/* Feature Highlights */}
        <ul className="login-features">
          <li>
            <span className="login-feature-icon">🔍</span>
            Full-page screenshot & element analysis
          </li>
          <li>
            <span className="login-feature-icon">🧠</span>
            Groq AI-powered test suggestions
          </li>
          <li>
            <span className="login-feature-icon">📊</span>
            Detailed reports & scan history
          </li>
          <li>
            <span className="login-feature-icon">🔒</span>
            Private data — only you see your scans
          </li>
        </ul>

        {/* Google Sign In Button */}
        <button className="google-signin-btn" onClick={() => handleGoogleLogin()}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.39a4.6 4.6 0 01-2 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.32z" fill="#4285F4" />
            <path d="M10 20c2.7 0 4.96-.9 6.62-2.45l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H1.07v2.6A10 10 0 0010 20z" fill="#34A853" />
            <path d="M4.4 11.87A6.01 6.01 0 014.1 10c0-.65.11-1.28.3-1.87V5.53H1.07A10 10 0 000 10c0 1.61.38 3.14 1.07 4.47l3.33-2.6z" fill="#FBBC05" />
            <path d="M10 3.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.96 9.96 0 0010 0 10 10 0 001.07 5.53l3.33 2.6C5.19 5.72 7.4 3.96 10 3.96z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        <p className="login-disclaimer">
          Your scan data is private and linked only to your Google account.
        </p>
      </div>
    </div>
  );
}
