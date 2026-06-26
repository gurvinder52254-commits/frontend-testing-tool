import { useState, useEffect } from 'react';

const API_URL = `http://${window.location.hostname}:3001/api`;

function ReportsPage({ onSelectProject }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reports`);
      const data = await res.json();
      if (data.success) {
        // Sort by date, newest first
        const sorted = (data.reports || [])
          .filter((r) => r.hasReport)
          .sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
        setReports(sorted);
      } else {
        setError(data.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Unable to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  function getScoreClass(s) {
    if (s >= 80) return 'excellent';
    if (s >= 60) return 'good';
    if (s >= 40) return 'fair';
    return 'poor';
  }

  function getGrade(s) {
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B';
    if (s >= 60) return 'C';
    if (s >= 50) return 'D';
    return 'F';
  }

  function formatDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function extractDomain(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  function getFavicon(url) {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch {
      return null;
    }
  }

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-page__header">
          <h1 className="reports-page__title">
            📊 Project <span className="reports-page__title-gradient">Reports</span>
          </h1>
          <p className="reports-page__subtitle">Loading your test reports...</p>
        </div>
        <div className="reports-page__loading">
          <div className="reports-page__spinner"></div>
          <span>Fetching reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <div className="reports-page__header">
          <h1 className="reports-page__title">
            📊 Project <span className="reports-page__title-gradient">Reports</span>
          </h1>
        </div>
        <div className="reports-page__error">
          <span className="reports-page__error-icon">⚠️</span>
          <p>{error}</p>
          <button className="reports-page__retry-btn" onClick={fetchReports}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <div>
          <h1 className="reports-page__title">
            📊 Project <span className="reports-page__title-gradient">Reports</span>
          </h1>
          <p className="reports-page__subtitle">
            {reports.length} project{reports.length !== 1 ? 's' : ''} tested — click to view dashboard
          </p>
        </div>
        <button className="reports-page__refresh-btn" onClick={fetchReports} title="Refresh reports">
          🔄
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="reports-page__empty">
          <div className="reports-page__empty-icon">📭</div>
          <h3>No Reports Yet</h3>
          <p>Run your first website test to see reports here.</p>
        </div>
      ) : (
        <div className="reports-page__grid">
          {reports.map((report, idx) => (
            <div
              key={report.testId}
              className="reports-card"
              style={{ animationDelay: `${idx * 0.07}s` }}
              onClick={() => onSelectProject(report.testId)}
            >
              {/* Card Header */}
              <div className="reports-card__header">
                <div className="reports-card__site-info">
                  {getFavicon(report.frontendUrl) && (
                    <img
                      className="reports-card__favicon"
                      src={getFavicon(report.frontendUrl)}
                      alt=""
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  )}
                  <div>
                    <div className="reports-card__domain">{extractDomain(report.frontendUrl)}</div>
                    <div className="reports-card__url">{report.frontendUrl}</div>
                  </div>
                </div>
                <div className={`reports-card__score reports-card__score--${getScoreClass(report.overallScore)}`}>
                  <span className="reports-card__score-value">{report.overallScore || '—'}</span>
                  <span className="reports-card__score-grade">{report.overallScore ? getGrade(report.overallScore) : ''}</span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="reports-card__meta">
                <div className="reports-card__meta-item">
                  <span className="reports-card__meta-icon">📄</span>
                  <span>{report.totalPages} page{report.totalPages !== 1 ? 's' : ''}</span>
                </div>
                <div className="reports-card__meta-item">
                  <span className="reports-card__meta-icon">🕐</span>
                  <span>{formatDate(report.testDate)}</span>
                </div>
                <div className="reports-card__meta-item">
                  <span className="reports-card__meta-icon">🆔</span>
                  <span className="reports-card__test-id">{report.testId}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="reports-card__footer">
                <span className="reports-card__view-btn">
                  View Dashboard
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
