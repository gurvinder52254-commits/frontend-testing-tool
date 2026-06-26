import { useState } from 'react';

function TestForm({ onSubmit, disabled }) {
  const [frontendUrl, setFrontendUrl] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [scanType, setScanType] = useState('url');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!frontendUrl.trim()) return;
    onSubmit(frontendUrl.trim(), backendUrl.trim(), scanType);
  };

  return (
    <div className="test-form-wrapper">
      <form className="test-form" onSubmit={handleSubmit}>
        <div className="test-form__terminal-label">TERMINAL_V.2.0</div>
        
        {/* Scan Type Toggle */}
        <div className="scan-toggle">
          <div className="scan-toggle__track">
            <button
              className={`scan-toggle__btn ${scanType === 'url' ? 'scan-toggle__btn--active' : ''}`}
              onClick={(e) => { e.preventDefault(); setScanType('url'); }}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              SINGLE URL
            </button>
            <button
              className={`scan-toggle__btn ${scanType === 'domain' ? 'scan-toggle__btn--active' : ''}`}
              onClick={(e) => { e.preventDefault(); setScanType('domain'); }}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              FULL DOMAIN
            </button>
          </div>
        </div>

        {/* Input + Submit Row */}
        <div className="test-form__input-row">
          <div className="test-form__input-group">
            <span className="test-form__input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
              </svg>
            </span>
            <input
              id="frontend-url-input"
              className="test-form__input test-form__input--main"
              type="text"
              placeholder="https://your-node-address.network"
              value={frontendUrl}
              onChange={(e) => setFrontendUrl(e.target.value)}
              required
              autoFocus
            />
            {frontendUrl.trim() && (
              <div className="test-form__input-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="start-test-btn"
            className="test-form__submit"
            type="submit"
            disabled={disabled || !frontendUrl.trim()}
          >
            {disabled ? (
              <>
                <div className="spinner spinner--sm"></div>
                CONNECTING...
              </>
            ) : (
              <>
                INITIATE SCAN
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="test-form__submit-arrow">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Advanced Toggle */}
        <button
          type="button"
          className="test-form__advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
          ADVANCED SETTINGS
        </button>

        {/* Backend URL - shown when advanced is toggled */}
        {showAdvanced && (
          <div className="test-form__group test-form__group--advanced">
            <label className="test-form__label" htmlFor="backend-url-input">
              <span className="test-form__label-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </span>
              Backend Node
              <span className="test-form__optional">optional</span>
            </label>
            <input
              id="backend-url-input"
              className="test-form__input"
              type="text"
              placeholder="api.your-backend.com"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default TestForm;
