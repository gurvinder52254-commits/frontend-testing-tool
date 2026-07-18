import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

const statusColor = (s) =>
  s === 0 ? '#6b7280' : s >= 500 ? '#ef4444' : s >= 400 ? '#f59e0b' : '#10b981';

export default function ScanPage() {
  const { authHeaders } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const scan = async (e) => {
    if (e) e.preventDefault();
    const target = url.trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/scan-page`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || 'Scan failed.');
    } catch (err) {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scan-page">
      <div className="scan-page__head">
        <h2 className="scan-page__title">🔗 Scan Page — Broken Links</h2>
        <p className="scan-page__desc">
          Enter a page URL to scan all of its links and find broken ones, with status codes.
        </p>
      </div>

      <form className="scan-page__form" onSubmit={scan}>
        <input
          className="scan-page__input"
          type="text"
          placeholder="https://example.com/page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <button className="scan-page__btn" type="submit" disabled={loading || !url.trim()}>
          {loading ? (<><span className="ai-action-spinner" /> Scanning…</>) : '🔍 Scan Page'}
        </button>
      </form>

      {error && (
        <div className="ai-error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {loading && (
        <div className="scan-page__loading">
          <div className="reports-page__spinner" />
          <span>Checking every link on the page… this can take a little while.</span>
        </div>
      )}

      {result && !loading && (
        <div className="scan-page__results">
          <div className={`scan-page__summary ${result.brokenCount > 0 ? 'scan-page__summary--bad' : 'scan-page__summary--good'}`}>
            {result.brokenCount > 0
              ? `⚠️ ${result.brokenCount} broken ${result.brokenCount === 1 ? 'link' : 'links'} found out of ${result.checkedLinks} checked`
              : `✓ No broken links found — all ${result.checkedLinks} links are healthy`}
          </div>

          <div className="scan-page__stats">
            <div className="scan-page__stat">
              <span className="scan-page__stat-num">{result.totalLinks}</span>
              <span className="scan-page__stat-label">Links Found</span>
            </div>
            <div className="scan-page__stat">
              <span className="scan-page__stat-num" style={{ color: result.brokenCount > 0 ? '#ef4444' : '#10b981' }}>
                {result.brokenCount}
              </span>
              <span className="scan-page__stat-label">Broken Links</span>
            </div>
            <div className="scan-page__stat">
              <span className="scan-page__stat-num">{result.checkedLinks}</span>
              <span className="scan-page__stat-label">Checked</span>
            </div>
          </div>

          <div className="scan-page__scanned">
            Scanned: <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>
          </div>

          {result.capped && (
            <div className="scan-page__note">
              Note: only the first {result.checkedLinks} of {result.totalLinks} links were checked.
            </div>
          )}

          {result.brokenCount === 0 ? (
            <div className="rd-empty rd-empty--success">✓ No broken links found on this page.</div>
          ) : (
            <div className="scan-page__list">
              {result.brokenLinks.map((l, i) => (
                <div className="scan-page__item" key={i}>
                  <span
                    className="scan-page__status"
                    style={{ color: statusColor(l.status), borderColor: statusColor(l.status) }}
                    title={l.reason}
                  >
                    {l.status === 0 ? 'ERR' : l.status}
                  </span>
                  <div className="scan-page__item-body">
                    <a className="scan-page__url" href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a>
                    <div className="scan-page__meta">
                      {l.text ? `“${l.text}” · ` : ''}{l.reason || 'Unreachable'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
