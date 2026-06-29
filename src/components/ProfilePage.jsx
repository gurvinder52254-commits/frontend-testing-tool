import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate session token time left dynamically
  useEffect(() => {
    const calculateTime = () => {
      const token = localStorage.getItem('webtest_token');
      if (!token) return 'Expired';
      if (!token.startsWith('webtest_session_')) {
        return 'Standard Google Session';
      }
      try {
        const payloadPart = token.substring('webtest_session_'.length).split('.')[0];
        const payload = JSON.parse(atob(payloadPart));
        const diffMs = payload.expiry - Date.now();
        if (diffMs <= 0) return 'Expired';

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.join(' ');
      } catch (e) {
        return 'Invalid Session';
      }
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <div className="profile-page" style={{
      maxWidth: '600px',
      margin: '60px auto',
      padding: '0 20px',
      animation: 'cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards'
    }}>
      <div className="profile-card" style={{
        background: 'rgba(30, 41, 59, 0.45)', // sleek slate/dark glass background
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '40px 30px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* User Large Avatar with neon glow orbit */}
        <div className="profile-avatar-container" style={{
          position: 'relative',
          width: '130px',
          height: '130px',
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1
        }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#00F0FF',
            borderBottomColor: '#a855f7',
            animation: 'spin 4s linear infinite'
          }} />
          <img 
            src={user.picture} 
            alt={user.name} 
            style={{
              width: '114px',
              height: '114px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
            }}
          />
        </div>

        {/* User Identity */}
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#fff',
          margin: '0 0 6px 0',
          letterSpacing: '-0.5px'
        }}>{user.name}</h2>
        
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-muted)',
          margin: '0 0 30px 0'
        }}>{user.email}</p>

        {/* User Details Grid */}
        <div className="profile-details-list" style={{
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '35px',
          zIndex: 1,
          position: 'relative'
        }}>
          {/* Email row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>EMAIL ADDRESS</span>
            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{user.email}</span>
          </div>

          {/* Account provider row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>IDENTITY PROVIDER</span>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#00F0FF', 
              fontWeight: 700,
              background: 'rgba(0, 240, 255, 0.1)',
              padding: '3px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 240, 255, 0.2)'
            }}>Google OAuth 2.0</span>
          </div>

          {/* Session Token validity row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SESSION EXPIRES IN</span>
            <span style={{ 
              fontSize: '0.85rem', 
              color: '#a855f7', 
              fontWeight: 700,
              fontFamily: 'monospace'
            }}>{timeLeft}</span>
          </div>

          {/* User ID row */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>USER CLIENT ID</span>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)', 
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>{user.userId || user.sub || 'N/A'}</span>
          </div>
        </div>

        {/* Action Button: Logout */}
        <button 
          onClick={logout}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ff6b6b',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.1)';
          }}
        >
          Sign Out of WebTest AI
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
