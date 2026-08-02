import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

/* ── Priority / Severity config ── */
const PRIORITY_CONFIG = {
  Critical: { color: '#ff6b6b', bg: 'rgba(255,74,74,0.15)', border: 'rgba(255,74,74,0.4)', dot: '#ff4a4a' },
  High:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', dot: '#ef4444' },
  Medium:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b' },
  Low:      { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', dot: '#10b981' },
};

/* ── Category labels ── */
const CATEGORY_LABELS = {
  ui:            { label: 'UI',            icon: '🎨' },
  ux:            { label: 'UX',            icon: '✨' },
  'ui/ux':       { label: 'UI/UX',         icon: '🎨' },
  'ui ux':       { label: 'UI/UX',         icon: '🎨' },
  accessibility: { label: 'Accessibility', icon: '♿' },
  grammar:       { label: 'Grammar',       icon: '✍️' },
  seo:           { label: 'SEO',           icon: '🔍' },
  performance:   { label: 'Performance',   icon: '⚡' },
  layout:        { label: 'Layout',        icon: '📐' },
  rendering:     { label: 'Rendering',     icon: '🖥️' },
  design:        { label: 'Design',        icon: '🎯' },
  buttons:       { label: 'Buttons',       icon: '🖱️' },
  header_footer: { label: 'Header/Footer', icon: '📑' },
  forms:         { label: 'Forms',         icon: '📝' },
  branding:      { label: 'Branding',      icon: '🏷️' },
};

/* ── Status display ── */
const STATUS_CONFIG = {
  open:        { label: 'Open',        color: '#a4aac7', bg: 'rgba(164,170,199,0.15)' },
  in_progress: { label: 'In Progress', color: '#00F0FF', bg: 'rgba(0,240,255,0.15)' },
  done:        { label: 'Done',        color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  pending:     { label: 'Pending',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  dismissed:   { label: 'Dismissed',   color: '#6f748f', bg: 'rgba(111,116,143,0.1)' },
  cancelled:   { label: 'Cancelled',   color: '#6f748f', bg: 'rgba(111,116,143,0.1)' },
};

/* ── Kanban columns (Jira-style workflow) ── */
const COLUMNS = [
  { key: 'open',        title: 'Open / Pending', accent: '#f59e0b', setStatus: 'open',        match: (s) => s === 'open' || s === 'pending' },
  { key: 'in_progress', title: 'In Progress',    accent: '#00F0FF', setStatus: 'in_progress', match: (s) => s === 'in_progress' },
  { key: 'done',        title: 'Done',           accent: '#10b981', setStatus: 'done',        match: (s) => s === 'done' },
  { key: 'dismissed',   title: 'Dismissed',      accent: '#6f748f', setStatus: 'dismissed',   match: (s) => s === 'dismissed' || s === 'cancelled' },
];

const catFor = (c) => CATEGORY_LABELS[String(c || 'ui').toLowerCase()] || { label: c || 'UI', icon: '⚠️' };

/* Derive structured fields (DB column → raw JSON fallback) */
function deriveFields(issue) {
  let raw = null;
  try { raw = typeof issue.ai_raw_response === 'string' ? JSON.parse(issue.ai_raw_response) : issue.ai_raw_response; } catch (e) {}
  return {
    affectedElement: issue.affected_element || raw?.affectedElement || raw?.affected_element || 'N/A',
    confidenceScore: issue.confidence_score || raw?.confidenceScore || raw?.confidence_score || '90%',
    expectedBehavior: issue.expected_behavior || raw?.expectedBehavior || raw?.expected_behavior || '',
    actualBehavior: issue.actual_behavior || raw?.actualBehavior || raw?.actual_behavior || '',
    reproSteps: issue.reproduction_steps
      || (Array.isArray(raw?.reproductionSteps) ? raw.reproductionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') : (raw?.reproductionSteps || '')),
    verifiedInBothPasses: raw?.verifiedInBothPasses,
  };
}

/* ══ Compact Kanban card ══ */
function BoardCard({ issue, onOpen, onDragStart, onDragEnd, dragging, verifying }) {
  const prio = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.Medium;
  const cat = catFor(issue.category);
  const { confidenceScore, verifiedInBothPasses } = deriveFields(issue);

  return (
    <div
      className={`ai-kanban-card ${dragging ? 'ai-kanban-card--dragging' : ''} ${verifying ? 'ai-kanban-card--verifying' : ''}`}
      draggable={!verifying}
      onDragStart={(e) => onDragStart(e, issue)}
      onDragEnd={onDragEnd}
      onClick={() => { if (!verifying) onOpen(issue); }}
      style={{ borderLeft: `3px solid ${prio.dot}` }}
      title={verifying ? 'Re-verifying with AI…' : 'Drag to move · Click for details'}
    >
      {verifying && (
        <div className="ai-kanban-card__verify-overlay">
          <span className="ai-kanban-card__verify-spinner" />
          <span className="ai-kanban-card__verify-text">Re-verifying with AI…</span>
        </div>
      )}
      <div className="ai-kanban-card__top">
        <span className="ai-kanban-card__prio" style={{ color: prio.color, background: prio.bg }}>
          <span className="ai-kanban-card__prio-dot" style={{ background: prio.dot }} />
          {issue.priority || 'Medium'}
        </span>
        <span className="ai-kanban-card__cat">{cat.icon} {cat.label}</span>
      </div>

      <div className="ai-kanban-card__title">{issue.title}</div>
      {issue.description && <div className="ai-kanban-card__snippet">{issue.description}</div>}

      <div className="ai-kanban-card__foot">
        <span className="ai-kanban-card__conf">
          {verifiedInBothPasses ? '✔✔ ' : '🎯 '}{confidenceScore}
        </span>
        <span className="ai-kanban-card__details">Details →</span>
      </div>
    </div>
  );
}

/* ══ Right-side detail drawer ══ */
function IssueDrawer({ issue, onClose, onAction, onVerify, verifyingId }) {
  const [verifyResult, setVerifyResult] = useState(null);
  useEffect(() => { setVerifyResult(null); }, [issue?.id]);

  if (!issue) return null;

  const prio = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.Medium;
  const cat = catFor(issue.category);
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const f = deriveFields(issue);
  const isVerifying = verifyingId === issue.id;
  const isDone = issue.status === 'done';
  const isDismissed = issue.status === 'dismissed' || issue.status === 'cancelled';

  const doVerify = async () => {
    setVerifyResult(null);
    const res = await onVerify(issue.id);
    if (res) setVerifyResult(res);
  };

  const Meta = ({ label, value, mono, color }) => (
    <div className="ai-drawer__meta-item">
      <span className="ai-drawer__meta-label">{label}</span>
      <span className="ai-drawer__meta-value" style={{ fontFamily: mono ? 'var(--font-mono)' : undefined, color }}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="ai-drawer-overlay" onClick={onClose} />
      <aside className="ai-drawer" role="dialog" aria-label="Issue details">
        <div className="ai-drawer__header">
          <div className="ai-drawer__badges">
            <span className="ai-drawer__prio" style={{ color: prio.color, background: prio.bg, borderColor: prio.border }}>
              <span className="ai-kanban-card__prio-dot" style={{ background: prio.dot }} />{issue.priority || 'Medium'}
            </span>
            <span className="ai-drawer__cat">{cat.icon} {cat.label}</span>
            <span className="ai-drawer__status" style={{ color: status.color, background: status.bg }}>{status.label}</span>
          </div>
          <button className="ai-drawer__close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="ai-drawer__body">
          <h3 className="ai-drawer__title">{issue.title}</h3>

          {issue.description && (
            <div className="ai-drawer__section">
              <span className="ai-drawer__section-label">Description</span>
              <p className="ai-drawer__text">{issue.description}</p>
            </div>
          )}

          {(f.expectedBehavior || f.actualBehavior) && (
            <div className="ai-drawer__ea">
              {f.expectedBehavior && (
                <div className="ai-drawer__ea-box ai-drawer__ea-box--ok">
                  <span className="ai-drawer__ea-label">✓ Expected Behavior</span>
                  <p className="ai-drawer__text">{f.expectedBehavior}</p>
                </div>
              )}
              {f.actualBehavior && (
                <div className="ai-drawer__ea-box ai-drawer__ea-box--bad">
                  <span className="ai-drawer__ea-label">✗ Actual Behavior</span>
                  <p className="ai-drawer__text">{f.actualBehavior}</p>
                </div>
              )}
            </div>
          )}

          {f.reproSteps && (
            <div className="ai-drawer__section">
              <span className="ai-drawer__section-label">🔁 Reproduction Steps</span>
              <div className="ai-drawer__steps">{f.reproSteps}</div>
            </div>
          )}

          {issue.recommended_fix && (
            <div className="ai-drawer__fix">
              <span className="ai-drawer__section-label">💡 Recommended Fix</span>
              <p className="ai-drawer__text">{issue.recommended_fix}</p>
            </div>
          )}

          <div className="ai-drawer__meta-grid">
            <Meta label="Affected Element" value={f.affectedElement} mono />
            <Meta label="AI Confidence" value={f.confidenceScore} color="#00F0FF" />
            <Meta label="Cross-verified" value={f.verifiedInBothPasses ? 'Yes (2/2 passes)' : 'Single pass'} color={f.verifiedInBothPasses ? '#10b981' : 'var(--text-secondary)'} />
            {issue.page_url && <Meta label="Page" value={issue.page_url} mono />}
          </div>

          {verifyResult && (
            <div className={`ai-drawer__verify ${verifyResult.resolved ? 'ai-drawer__verify--ok' : 'ai-drawer__verify--fail'}`}>
              {verifyResult.message}
            </div>
          )}
        </div>

        <div className="ai-drawer__actions">
          {!isDone && !isDismissed && (
            <>
              <button className="ai-action-btn ai-action-btn--fix" disabled={isVerifying} onClick={() => onAction(issue.id, 'in_progress')}>🔧 Fix Task</button>
              <button className="ai-action-btn ai-action-btn--complete" disabled={isVerifying} onClick={doVerify}>
                {isVerifying ? (<><span className="ai-action-spinner" /> Verifying…</>) : '✅ Verify & Complete'}
              </button>
              <button className="ai-action-btn ai-action-btn--dismiss" disabled={isVerifying} onClick={() => onAction(issue.id, 'dismissed')}>🚫 Dismiss</button>
            </>
          )}
          {(isDone || isDismissed) && (
            <button className="ai-action-btn ai-action-btn--reopen" onClick={() => onAction(issue.id, 'open')}>↩ Reopen</button>
          )}
        </div>
      </aside>
    </>
  );
}

/* ══ Main Panel ══ */
export default function AiIssuesPanel({ report, tier }) {
  const { authHeaders } = useAuth();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const testId = report?.testId;
  const pages = report?.pages || [];
  const pageOptions = pages.map(p => ({ url: p.url, title: p.title || p.url }));
  const currentPageUrl = selectedPage || (pageOptions[0]?.url || report?.frontendUrl || '');

  const loadIssues = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ai-issues/${testId}`, { headers: authHeaders });
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

  // Update status (optimistic — snappy drag & drop)
  const handleAction = async (issueId, newStatus) => {
    const prev = issues;
    setIssues(cur => cur.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
    try {
      const res = await fetch(`${API_URL}/ai-issues/${issueId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) setIssues(cur => cur.map(i => i.id === issueId ? data.issue : i));
      else setIssues(prev);
    } catch (e) {
      setIssues(prev);
    }
  };

  const handleVerify = async (issueId, opts = {}) => {
    const { optimisticStatus, originalStatus } = opts;
    setVerifyingId(issueId);
    // Optionally place the card in its target column while the AI check runs.
    if (optimisticStatus) {
      setIssues(cur => cur.map(i => i.id === issueId ? { ...i, status: optimisticStatus } : i));
    }
    try {
      const res = await fetch(`${API_URL}/ai-verify/${issueId}`, { method: 'POST', headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        // Server returns the real resulting status (done if resolved, else pending)
        setIssues(prev => prev.map(i => i.id === issueId ? data.issue : i));
        return { resolved: data.resolved, message: data.message };
      }
      if (originalStatus) setIssues(cur => cur.map(i => i.id === issueId ? { ...i, status: originalStatus } : i));
      return { resolved: false, message: data.error || 'Verification failed.' };
    } catch (e) {
      if (originalStatus) setIssues(cur => cur.map(i => i.id === issueId ? { ...i, status: originalStatus } : i));
      return { resolved: false, message: 'Network error during verification.' };
    } finally {
      setVerifyingId(null);
    }
  };

  // Drag & drop
  const onDragStart = (e, issue) => {
    setDraggingId(issue.id);
    try { e.dataTransfer.setData('text/plain', String(issue.id)); e.dataTransfer.effectAllowed = 'move'; } catch (_) {}
  };
  const onDragEnd = () => { setDraggingId(null); setDragOverCol(null); };
  const onDropCol = (e, col) => {
    e.preventDefault();
    const raw = (() => { try { return e.dataTransfer.getData('text/plain'); } catch { return ''; } })();
    const id = Number(raw) || draggingId;
    setDragOverCol(null);
    setDraggingId(null);
    const issue = issues.find(i => i.id === id);
    if (!issue || col.match(issue.status)) return; // already in this column → no-op
    if (col.key === 'done') {
      // Dropping into "Done" runs an AI re-verification (re-screenshots the page
      // and confirms the fix) instead of a plain status change. Only fires when the
      // task is NOT already done and is NOT being reopened.
      handleVerify(id, { optimisticStatus: 'done', originalStatus: issue.status });
    } else {
      handleAction(id, col.setStatus);
    }
  };

  // Only issues for the current page
  const pageIssues = issues.filter(i => !currentPageUrl || i.page_url === currentPageUrl);

  const counts = {
    total: pageIssues.length,
    open: pageIssues.filter(i => i.status === 'open' || i.status === 'pending' || i.status === 'in_progress').length,
    done: pageIssues.filter(i => i.status === 'done').length,
    dismissed: pageIssues.filter(i => i.status === 'dismissed' || i.status === 'cancelled').length,
  };

  const selectedIssue = pageIssues.find(i => i.id === selectedIssueId) || null;

  return (
    <div className="rd-content-wrap">
      {/* Header */}
      <div className="rd-content-header">
        <h2 className="rd-content-title">🤖 AI Issues</h2>
        <p className="rd-content-desc">
          AI-powered webpage audit — drag a card between columns to change its status, click for full details.
        </p>
      </div>

      {/* Controls */}
      <div className="ai-audit-controls">
        {pageOptions.length > 1 ? (
          <div className="ai-audit-controls__page">
            <label className="ai-audit-controls__label">Select Page:</label>
            <select className="ai-audit-controls__select" value={selectedPage || currentPageUrl} onChange={e => setSelectedPage(e.target.value)}>
              {pageOptions.map(p => <option key={p.url} value={p.url}>{p.title || p.url}</option>)}
            </select>
          </div>
        ) : (
          <div className="ai-audit-controls__url-info"><span className="rd-code">{currentPageUrl || report?.frontendUrl}</span></div>
        )}
        <button className="ai-audit-btn ai-audit-btn--refresh" onClick={loadIssues} disabled={loading}>
          {loading ? <span className="ai-action-spinner" /> : '↻'} Refresh Issues
        </button>
      </div>

      {/* Plan-based Task limit banner */}
      {tier === 'Free' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 800, color: '#a855f7', fontSize: '0.9rem' }}>Free Trial AI Issues Limit</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                You have used {issues.length} / 5 task limits. Upgrade to a premium plan to unlock unlimited tasks.
              </div>
            </div>
          </div>
          <a href="#/plans" style={{
            background: 'linear-gradient(135deg, #00F0FF 0%, #a855f7 100%)',
            color: '#0b0e1a',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'transform 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Upgrade Plan
          </a>
        </div>
      )}

      {error && (
        <div className="ai-error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {loading && (
        <div className="ai-loading-state">
          <div className="ai-loading-state__spinner" />
          <p>Loading AI audit issues...</p>
        </div>
      )}

      {/* Summary tiles */}
      {!loading && pageIssues.length > 0 && (
        <div className="ai-summary-bar">
          <div className="ai-summary-bar__stat"><span className="ai-summary-bar__num">{counts.total}</span><span className="ai-summary-bar__label">Total Issues</span></div>
          <div className="ai-summary-bar__stat"><span className="ai-summary-bar__num" style={{ color: '#f59e0b' }}>{counts.open}</span><span className="ai-summary-bar__label">Open</span></div>
          <div className="ai-summary-bar__stat"><span className="ai-summary-bar__num" style={{ color: '#10b981' }}>{counts.done}</span><span className="ai-summary-bar__label">Done</span></div>
          <div className="ai-summary-bar__stat"><span className="ai-summary-bar__num" style={{ color: '#6f748f' }}>{counts.dismissed}</span><span className="ai-summary-bar__label">Dismissed</span></div>
        </div>
      )}

      {/* Kanban board */}
      {!loading && pageIssues.length > 0 && (
        <div className="ai-kanban">
          {COLUMNS.map(col => {
            const colIssues = pageIssues.filter(i => col.match(i.status));
            return (
              <div
                key={col.key}
                className={`ai-kanban-col ${dragOverCol === col.key ? 'ai-kanban-col--over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); if (dragOverCol !== col.key) setDragOverCol(col.key); }}
                onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOverCol(null); }}
                onDrop={(e) => onDropCol(e, col)}
              >
                <div className="ai-kanban-col__header" style={{ borderTopColor: col.accent }}>
                  <span className="ai-kanban-col__title">{col.title}</span>
                  <span className="ai-kanban-col__count" style={{ color: col.accent }}>{colIssues.length}</span>
                </div>
                <div className="ai-kanban-col__body">
                  {colIssues.map(issue => (
                    <BoardCard
                      key={issue.id}
                      issue={issue}
                      dragging={draggingId === issue.id}
                      verifying={verifyingId === issue.id}
                      onOpen={(i) => setSelectedIssueId(i.id)}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  {colIssues.length === 0 && (
                    <div className="ai-kanban-col__empty">Drop issues here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty states */}
      {!loading && issues.length === 0 && (
        <div className="ai-empty-state">
          <div className="ai-empty-state__icon">🤖</div>
          <h3 className="ai-empty-state__title">No AI Issues Detected Yet</h3>
          <p className="ai-empty-state__desc">
            AI audits are automatically run for each page during the website scan test.<br />
            Start a new audit or scan to populate this board with automatic UX, layout, alignment, and grammar checks.
          </p>
        </div>
      )}

      {!loading && issues.length > 0 && pageIssues.length === 0 && (
        <div className="rd-empty rd-empty--success">✓ No AI issues for this page.</div>
      )}

      {/* Detail drawer */}
      {selectedIssue && (
        <IssueDrawer
          issue={selectedIssue}
          onClose={() => setSelectedIssueId(null)}
          onAction={handleAction}
          onVerify={handleVerify}
          verifyingId={verifyingId}
        />
      )}
    </div>
  );
}
