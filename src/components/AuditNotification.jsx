import { useState } from 'react';

/**
 * Floating bottom-right drawer shown while an audit is running.
 * Non-intrusive: it never moves the page. The "View Report" button
 * scrolls the user back to the audit progress/report section.
 */
export default function AuditNotification({ progress = 0, pagesCompleted = 0, totalPages = 0, onView }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 1200,
        width: 300,
        maxWidth: 'calc(100vw - 40px)',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
        padding: '14px 16px',
        color: 'var(--text-primary, #e2e8f0)',
        animation: 'auditNotifIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#22d3ee',
            boxShadow: '0 0 0 rgba(34,211,238,0.6)',
            animation: 'auditPulse 1.4s ease-out infinite',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Audit is still running…</span>
        <button
          onClick={() => setHidden(true)}
          aria-label="Dismiss"
          title="Dismiss"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: 8 }}>
        {pagesCompleted} of {totalPages || '?'} pages tested · {progress}%
      </div>

      {/* mini progress bar */}
      <div style={{ height: 5, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: 'linear-gradient(90deg, #06b6d4, #6366f1)',
            borderRadius: 6,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <button
        onClick={onView}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#0b1120',
          background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
          border: 'none',
          borderRadius: 9,
          cursor: 'pointer',
        }}
      >
        View Report
      </button>

      {/* Local keyframes (scoped by unique names) */}
      <style>{`
        @keyframes auditNotifIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes auditPulse { 0% { box-shadow: 0 0 0 0 rgba(34,211,238,0.5); } 70% { box-shadow: 0 0 0 8px rgba(34,211,238,0); } 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); } }
      `}</style>
    </div>
  );
}
