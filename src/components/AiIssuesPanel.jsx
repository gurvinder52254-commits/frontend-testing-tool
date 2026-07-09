import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

/* ── Priority / Severity config ── */
const PRIORITY_CONFIG = {
  Critical: { color: '#ff4a4a', bg: 'rgba(255,74,74,0.15)',  border: 'rgba(255,74,74,0.4)',  dot: '#ff4a4a' },
  High:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   dot: '#ef4444' },
  Medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  Low:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  dot: '#10b981' },
};

/* ── Category labels ── */
const CATEGORY_LABELS = {
  ui:            { label: 'UI',            icon: '🎨' },
  ux:            { label: 'UX',            icon: '✨' },
  accessibility: { label: 'Accessibility', icon: '♿' },
  grammar:       { label: 'Grammar',       icon: '✍️' },
  seo:           { label: 'SEO',           icon: '🔍' },
  performance:   { label: 'Performance',   icon: '⚡' },
  layout:        { label: 'Layout',        icon: '📐' },
  buttons:       { label: 'Buttons',       icon: '🖱️' },
  forms:         { label: 'Forms',         icon: '📝' },
  branding:      { label: 'Branding',      icon: '🏷️' },
};

/* ── Status display ── */
const STATUS_CONFIG = {
  open:        { label: 'Open',        color: '#a4aac7', bg: 'rgba(164,170,199,0.15)' },
  in_progress: { label: 'Verifying…',  color: '#00F0FF', bg: 'rgba(0,240,255,0.15)'  },
  done:        { label: '✓ Done / Testing Complete', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  pending:     { label: '⚠ Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  dismissed:   { label: 'Dismissed',   color: '#6f748f', bg: 'rgba(111,116,143,0.1)' },
  cancelled:   { label: 'Cancelled',   color: '#6f748f', bg: 'rgba(111,116,143,0.1)' },
};

/* ── Single issue card ── */
function IssueCard({ issue, onAction, onVerify, verifyingId }) {
  const [expanded, setExpanded] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);

  const prio   = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.Medium;
  const catKey = (issue.category || 'ui').toLowerCase();
  const cat    = CATEGORY_LABELS[catKey] || { label: issue.category || 'UI', icon: '⚠️' };
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  
  const isVerifying = verifyingId === issue.id;
  const isDone      = issue.status === 'done';
  const isDismissed = issue.status === 'dismissed' || issue.status === 'cancelled';

  // Attempt to extract extra metadata from raw JSON if database columns aren't ready/fallback
  let rawJson = null;
  try {
    rawJson = typeof issue.ai_raw_response === 'string' 
      ? JSON.parse(issue.ai_raw_response) 
      : issue.ai_raw_response;
  } catch (e) {}

  const affectedElement = issue.affected_element || rawJson?.affectedElement || rawJson?.affected_element || 'N/A';
  const confidenceScore = issue.confidence_score || rawJson?.confidenceScore || rawJson?.confidence_score || '90%';
  const locationInfo    = rawJson?.screenshotLocation || rawJson?.screenshot_location || 'See main description';

  const handleVerify = async () => {
    setVerifyResult(null);
    const result = await onVerify(issue.id);
    if (result) setVerifyResult(result);
  };

  return (
    <div className={`ai-issue-card ${isDone ? 'ai-issue-card--done' : ''} ${isDismissed ? 'ai-issue-card--dismissed' : ''}`}
         style={{ borderColor: isDismissed ? 'rgba(255,255,255,0.06)' : prio.border }}>
      
      {/* Card header */}
      <div className="ai-issue-card__header">
        <div className="ai-issue-card__meta">
          {/* Priority/Severity badge */}
          <span className="ai-issue-card__priority" style={{ color: prio.color, background: prio.bg, borderColor: prio.border }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: prio.dot, display: 'inline-block', marginRight: 6 }} />
            {issue.priority || 'Medium'}
          </span>
          {/* Category tag */}
          <span className="ai-issue-card__category">{cat.icon} {cat.label}</span>
          {/* Status pill */}
          <span className="ai-issue-card__status" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </span>
        </div>

        <button className="ai-issue-card__expand" onClick={() => setExpanded(e => !e)} title={expanded ? 'Collapse' : 'Expand'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <h4 className={`ai-issue-card__title ${isDismissed ? 'ai-issue-card__title--muted' : ''}`}>
        {issue.title}
      </h4>

      {/* Body content */}
      {expanded && (
        <div className="ai-issue-card__body">
          {/* Main Description */}
          <p className="ai-issue-card__desc" style={{ whiteSpace: 'pre-wrap' }}>{issue.description}</p>

          {/* Audit Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '8px',
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Affected Element</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{affectedElement}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>AI Confidence Score</span>
              <span style={{ fontSize: '0.8rem', color: '#00F0FF', fontWeight: 700 }}>{confidenceScore}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Location</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{locationInfo}</span>
            </div>
          </div>

          {/* Recommended Fix */}
          {issue.recommended_fix && (
            <div className="ai-issue-card__fix">
              <span className="ai-issue-card__fix-label">💡 Recommended Fix</span>
              <p className="ai-issue-card__fix-text" style={{ whiteSpace: 'pre-wrap' }}>{issue.recommended_fix}</p>
            </div>
          )}
        </div>
      )}

      {/* Verification result message */}
      {verifyResult && (
        <div className={`ai-issue-verify-result ${verifyResult.resolved ? 'ai-issue-verify-result--ok' : 'ai-issue-verify-result--fail'}`}>
          {verifyResult.message}
        </div>
      )}

      {/* Action buttons */}
      {!isDismissed && !isDone && (
        <div className="ai-issue-card__actions">
          <button
            className="ai-action-btn ai-action-btn--fix"
            onClick={() => onAction(issue.id, 'in_progress')}
            disabled={isVerifying}
          >
            🔧 Fix Task
          </button>
          <button
            className="ai-action-btn ai-action-btn--complete"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <><span className="ai-action-spinner" /> Verifying…</>
            ) : '✅ Complete'}
          </button>
          <button
            className="ai-action-btn ai-action-btn--dismiss"
            onClick={() => onAction(issue.id, 'dismissed')}
            disabled={isVerifying}
          >
            🚫 Dismiss
          </button>
          <button
            className="ai-action-btn ai-action-btn--cancel"
            onClick={() => onAction(issue.id, 'cancelled')}
            disabled={isVerifying}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Reopen button for done/dismissed */}
      {(isDone || isDismissed) && (
        <div className="ai-issue-card__actions">
          <button className="ai-action-btn ai-action-btn--reopen" onClick={() => onAction(issue.id, 'open')}>
            ↩ Reopen
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Panel ── */
export default function AiIssuesPanel({ report }) {
  const { authHeaders } = useAuth();

  const [issues, setIssues]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError]           = useState(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [filter, setFilter]         = useState('all');

  const testId = report?.testId;
  const pages  = report?.pages || [];

  // Build page URL options
  const pageOptions = pages.map(p => ({ url: p.url, title: p.title || p.url }));
  const currentPageUrl = selectedPage || (pageOptions[0]?.url || report?.frontendUrl || '');

  // Load existing issues on mount
  const loadIssues = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/ai-issues/${testId}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setIssues(data.issues || []);
      else setError(data.error || 'Failed to load issues.');
    } catch (e) {
      setError('Network error loading issues.');
    } finally {
      setLoading(false);
    }
  }, [testId, authHeaders]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  // Update issue status
  const handleAction = async (issueId, newStatus) => {
    try {
      const res  = await fetch(`${API_URL}/ai-issues/${issueId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(i => i.id === issueId ? data.issue : i));
      }
    } catch (e) {
      console.error('Failed to update issue status:', e);
    }
  };

  // Verify issue (complete check)
  const handleVerify = async (issueId) => {
    setVerifyingId(issueId);
    try {
      const res  = await fetch(`${API_URL}/ai-verify/${issueId}`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => prev.map(i => i.id === issueId ? data.issue : i));
        return { resolved: data.resolved, message: data.message };
      } else {
        return { resolved: false, message: data.error || 'Verification failed.' };
      }
    } catch (e) {
      return { resolved: false, message: 'Network error during verification.' };
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter(i => {
    // Filter by selected page url if dropdown is used
    if (currentPageUrl && i.page_url !== currentPageUrl) return false;
    
    if (filter === 'all')  return true;
    if (filter === 'open') return i.status === 'open' || i.status === 'in_progress' || i.status === 'pending';
    if (filter === 'done') return i.status === 'done';
    if (filter === 'dismissed') return i.status === 'dismissed' || i.status === 'cancelled';
    return true;
  });

  // Count by status for summary bar
  const counts = {
    total: issues.length,
    open:  issues.filter(i => i.status === 'open' || i.status === 'pending' || i.status === 'in_progress').length,
    done:  issues.filter(i => i.status === 'done').length,
    dismissed: issues.filter(i => i.status === 'dismissed' || i.status === 'cancelled').length,
  };

  return (
    <div className="rd-content-wrap">
      {/* Header */}
      <div className="rd-content-header">
        <h2 className="rd-content-title">🤖 AI Issues</h2>
        <p className="rd-content-desc">
          AI-powered webpage audit. Issues are automatically generated when a test is executed.
        </p>
      </div>

      {/* Filter and control bar */}
      <div className="ai-audit-controls">
        {/* Page selector */}
        {pageOptions.length > 1 && (
          <div className="ai-audit-controls__page">
            <label className="ai-audit-controls__label">Select Page:</label>
            <select
              className="ai-audit-controls__select"
              value={selectedPage || currentPageUrl}
              onChange={e => setSelectedPage(e.target.value)}
            >
              {pageOptions.map(p => (
                <option key={p.url} value={p.url}>{p.title || p.url}</option>
              ))}
            </select>
          </div>
        )}

        {pageOptions.length <= 1 && (
          <div className="ai-audit-controls__url-info">
            <span className="rd-code">{currentPageUrl || report?.frontendUrl}</span>
          </div>
        )}

        <button className="ai-audit-btn ai-audit-btn--refresh" onClick={loadIssues} disabled={loading}>
          {loading ? <span className="ai-action-spinner" /> : '↻'} Refresh Issues
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="ai-error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="ai-loading-state">
          <div className="ai-loading-state__spinner" />
          <p>Loading AI audit issues...</p>
        </div>
      )}

      {/* Summary bar */}
      {!loading && issues.length > 0 && (
        <>
          <div className="ai-summary-bar">
            <div className="ai-summary-bar__stat">
              <span className="ai-summary-bar__num">{counts.total}</span>
              <span className="ai-summary-bar__label">Total Issues</span>
            </div>
            <div className="ai-summary-bar__stat">
              <span className="ai-summary-bar__num" style={{ color: '#ff4a4a' }}>{counts.open}</span>
              <span className="ai-summary-bar__label">Open</span>
            </div>
            <div className="ai-summary-bar__stat">
              <span className="ai-summary-bar__num" style={{ color: '#10b981' }}>{counts.done}</span>
              <span className="ai-summary-bar__label">Done</span>
            </div>
            <div className="ai-summary-bar__stat">
              <span className="ai-summary-bar__num" style={{ color: '#6f748f' }}>{counts.dismissed}</span>
              <span className="ai-summary-bar__label">Dismissed</span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="ai-filter-tabs">
            {[
              { key: 'all',       label: 'All' },
              { key: 'open',      label: 'Open / Pending' },
              { key: 'done',      label: 'Done' },
              { key: 'dismissed', label: 'Dismissed' },
            ].map(f => (
              <button
                key={f.key}
                className={`ai-filter-tab ${filter === f.key ? 'ai-filter-tab--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Issues list */}
      {!loading && filteredIssues.length > 0 && (
        <div className="ai-issues-list">
          {filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onAction={handleAction}
              onVerify={handleVerify}
              verifyingId={verifyingId}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && issues.length === 0 && (
        <div className="ai-empty-state">
          <div className="ai-empty-state__icon">🤖</div>
          <h3 className="ai-empty-state__title">No AI Issues Detected Yet</h3>
          <p className="ai-empty-state__desc">
            AI audits are automatically run for each page during the website scan test.<br />
            Start a new audit or scan to populate this tab with automatic UX, layout, alignment, and grammar checks.
          </p>
        </div>
      )}

      {!loading && issues.length > 0 && filteredIssues.length === 0 && (
        <div className="rd-empty rd-empty--success">
          ✓ No issues match the current filters.
        </div>
      )}
    </div>
  );
}
