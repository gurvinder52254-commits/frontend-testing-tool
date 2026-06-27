import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ status, wsConnected, activeView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (view) => {
    onNavigate && onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header__brand" onClick={() => handleNavigate('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="header__logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#header_grad1)" opacity="0.9" />
            <path d="M2 17L12 22L22 17" stroke="url(#header_grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M2 12L12 17L22 12" stroke="url(#header_grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <defs>
              <linearGradient id="header_grad1" x1="2" y1="2" x2="22" y2="22">
                <stop stopColor="#00F0FF" />
                <stop offset="1" stopColor="#ddb7ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <div className="header__title">WebTest AI</div>
          <div className="header__subtitle">Intelligent Testing Platform</div>
        </div>
      </div>

      <nav className="header__nav">
        <span
          className={`header__nav-link ${activeView === 'dashboard' ? 'header__nav-link--active' : ''}`}
          onClick={() => handleNavigate('dashboard')}
        >
          Dashboard
        </span>
        <span
          className={`header__nav-link ${activeView === 'reports' ? 'header__nav-link--active' : ''}`}
          onClick={() => handleNavigate('reports')}
        >
          Reports
        </span>
        <span className="header__nav-link">Settings</span>
      </nav>

      <div className="header__right">
        <div className="header__search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="header__search-text">Search...</span>
        </div>

        <div className="header__status">
          <span
            className={`header__status-dot ${status === 'testing' ? 'header__status-dot--testing' : !wsConnected ? 'header__status-dot--error' : ''}`}
          />
          <span className="header__status-text">
            {status === 'testing' ? 'SCANNING...' : wsConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* User Avatar + Logout (Desktop) */}
        {user && (
          <div className="header__user header__user--desktop">
            <img
              className="header__user-avatar"
              src={user.picture}
              alt={user.name}
              title={`${user.name} (${user.email})`}
            />
            <span className="header__user-name">{user.name.split(' ')[0]}</span>
            <button className="header__logout-btn" onClick={logout} title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        <button
          className={`header__hamburger ${isMenuOpen ? 'header__hamburger--open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`header__mobile-menu ${isMenuOpen ? 'header__mobile-menu--open' : ''}`}>
        <nav className="header__mobile-nav">
          <span
            className={`header__mobile-nav-link ${activeView === 'dashboard' ? 'header__mobile-nav-link--active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            Dashboard
          </span>
          <span
            className={`header__mobile-nav-link ${activeView === 'reports' ? 'header__mobile-nav-link--active' : ''}`}
            onClick={() => handleNavigate('reports')}
          >
            Reports
          </span>
          <span className="header__mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Settings</span>
        </nav>

        <div className="header__mobile-widgets">
          <div className="header__search header__search--mobile">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="header__search-text">Search...</span>
          </div>

          <div className="header__status header__status--mobile">
            <span
              className={`header__status-dot ${status === 'testing' ? 'header__status-dot--testing' : !wsConnected ? 'header__status-dot--error' : ''}`}
            />
            <span className="header__status-text">
              {status === 'testing' ? 'SCANNING...' : wsConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {user && (
            <div className="header__user header__user--mobile">
              <img
                className="header__user-avatar"
                src={user.picture}
                alt={user.name}
              />
              <div className="header__user-info-mobile">
                <span className="header__user-name">{user.name}</span>
                <span className="header__user-email">{user.email}</span>
              </div>
              <button className="header__logout-btn" onClick={logout} title="Logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
