import React from 'react';

const Header = ({ status, wsConnected, activeView, onNavigate }) => {
  return (
    <header className="header">
      <div className="header__brand" onClick={() => onNavigate && onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
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
          onClick={() => onNavigate && onNavigate('dashboard')}
        >
          Dashboard
        </span>
        <span
          className={`header__nav-link ${activeView === 'reports' ? 'header__nav-link--active' : ''}`}
          onClick={() => onNavigate && onNavigate('reports')}
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
      </div>
    </header>
  );
};

export default Header;
