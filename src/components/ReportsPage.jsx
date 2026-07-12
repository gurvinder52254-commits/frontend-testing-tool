import { useRef, useCallback, useEffect, useState, memo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

const PAGE_LIMIT = 20;

// ─── Pure helper functions ──────────────
function getScoreClass(s) {
  if (s >= 80) return 'excellent';
  if (s >= 60) return 'good';
  if (s >= 40) return 'fair';
  return 'poor';
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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

// Custom icons based on score to make it look premium
const ProjectIcon = ({ score }) => {
  if (score >= 80) {
    // Green/cyan code icon
    return (
      <div className="reports-list-icon reports-list-icon--excellent">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>
    );
  }
  if (score >= 60) {
    // Blue/purple terminal icon
    return (
      <div className="reports-list-icon reports-list-icon--good">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      </div>
    );
  }
  // Red/orange warning/bolt icon
  return (
    <div className="reports-list-icon reports-list-icon--poor">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    </div>
  );
};

// ─── Redesigned Project Row Component ─────
const ReportRowCard = memo(function ReportRowCard({ report, onSelect, onDeleteClick }) {
  const domain = extractDomain(report.frontendUrl);
  return (
    <div className="reports-list-row" onClick={() => onSelect(report.testId)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
        {/* Left score-based visual icon */}
        <ProjectIcon score={report.overallScore} />

        {/* Project Name & Domain Link */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="reports-list-row__domain">{domain}</div>
          <div className="reports-list-row__url" title={report.frontendUrl}>{report.frontendUrl}</div>
        </div>
      </div>

      {/* Pages checked Column */}
      <div className="reports-list-row__col">
        <span className="reports-list-row__label">PAGES</span>
        <span className="reports-list-row__value">{report.totalPages} page{report.totalPages !== 1 ? 's' : ''}</span>
      </div>

      {/* Last run Date Column */}
      <div className="reports-list-row__col">
        <span className="reports-list-row__label">LAST RUN</span>
        <span className="reports-list-row__value">{formatDate(report.testDate)}</span>
      </div>

      {/* Instance ID Code Column */}
      <div className="reports-list-row__col">
        <span className="reports-list-row__label">INSTANCE ID</span>
        <span className="reports-list-row__badge">{report.testId}</span>
      </div>

      {/* Action triggers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
        <span className="reports-list-row__action">
          View Dashboard
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>

        <button 
          className="reports-list-row__delete-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(report.testId);
          }}
          title="Delete project report"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ─── Main Redesigned ReportsPage Component ───────────────────────────────────────
function ReportsPage({ onSelectProject }) {
  const { authHeaders } = useAuth();
  const parentRef = useRef(null);
  const loadMoreRef = useRef(null);

  const [healthyRatio, setHealthyRatio] = useState(98);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch real healthyRatio for the Success Rate stat card
  useEffect(() => {
    fetch(`${API_URL}/profile/info`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setHealthyRatio(data.stats.healthyRatio !== undefined ? data.stats.healthyRatio : 98);
        }
      })
      .catch(() => {});
  }, [authHeaders]);

  // ── TanStack Query: infinite paginated fetch ──
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['reports', authHeaders.Authorization],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`${API_URL}/reports?page=${pageParam}&limit=${PAGE_LIMIT}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load reports');
      const sorted = (data.reports || [])
        .filter((r) => r.hasReport)
        .sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
      return { ...data, reports: sorted };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allReports = data?.pages.flatMap((p) => p.reports) ?? [];

  // Count pending/running tasks
  const pendingCount = allReports.filter(r => r.status === 'running' || r.status === 'pending').length;

  // ── Virtualizer for the list rows ──
  const virtualizer = useVirtualizer({
    count: allReports.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92, // estimated row height in px
    overscan: 6,
  });

  // ── Intersection Observer: auto-load next page when sentinel is visible ──
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = useCallback((testId) => {
    onSelectProject(testId);
  }, [onSelectProject]);

  const handleDeleteClick = useCallback((testId) => {
    setDeletingId(testId);
  }, []);

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`${API_URL}/reports/${deletingId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        refetch();
      }
    } catch (e) {
      console.error('Delete failed:', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const navigateToNewScan = () => {
    window.location.hash = '#/';
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="reports-page">
        <div className="reports-page__header">
          <div>
            <h1 className="reports-page__title">📊 Project Reports</h1>
            <p className="reports-page__subtitle">Loading your audit portfolio...</p>
          </div>
        </div>
        <div className="reports-page__loading">
          <div className="reports-page__spinner"></div>
          <span>Fetching reports...</span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="reports-page">
        <div className="reports-page__header">
          <div>
            <h1 className="reports-page__title">📊 Project Reports</h1>
          </div>
        </div>
        <div className="reports-page__error">
          <span className="reports-page__error-icon">⚠️</span>
          <p>{error?.message || 'Failed to load reports'}</p>
          <button className="reports-page__retry-btn" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalCount = data?.pages[0]?.totalReports ?? 0;

  return (
    <div className="reports-page">
      {/* ── Redesigned Header Row ── */}
      <div className="reports-page__header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="reports-page__title" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.2rem' }}>🗃️</span> Project Reports
          </h1>
          <p className="reports-page__subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            {totalCount} project{totalCount !== 1 ? 's' : ''} tested — click to view dashboard
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="reports-page__refresh-btn"
            onClick={() => refetch()}
            title="Refresh reports list"
            style={{ width: '42px', height: '42px', padding: 0 }}
          >
            🔄
          </button>
          <button
            onClick={navigateToNewScan}
            style={{
              background: 'var(--accent-gradient)',
              color: '#0b0e1a',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 22px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'transform 0.25s',
              boxShadow: '0 4px 15px rgba(0,240,255,0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* ── Redesigned Stats Dashboard Cards ── */}
      <div className="reports-stats-grid">
        {/* Stat Box 1 */}
        <div className="reports-stat-card">
          <div>
            <span className="reports-stat-card__label">TOTAL REPORTS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span className="reports-stat-card__value">{totalCount.toLocaleString()}</span>
              <span className="reports-stat-card__trend">+12%</span>
            </div>
          </div>
          <div className="reports-stat-card__icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,240,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
            </svg>
          </div>
        </div>

        {/* Stat Box 2 */}
        <div className="reports-stat-card">
          <div>
            <span className="reports-stat-card__label">SUCCESS RATE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span className="reports-stat-card__value">{healthyRatio}%</span>
              <span className="reports-stat-card__trend" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>Stable</span>
            </div>
          </div>
          <div className="reports-stat-card__icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>

        {/* Stat Box 3 */}
        <div className="reports-stat-card">
          <div>
            <span className="reports-stat-card__label">PENDING</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span className="reports-stat-card__value">{String(pendingCount).padStart(2, '0')}</span>
              <span className="reports-stat-card__trend" style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>Queueing</span>
            </div>
          </div>
          <div className="reports-stat-card__icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Subtitle Recent Activity Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>RECENT ACTIVITY</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00F0FF', cursor: 'pointer' }} onClick={() => refetch()}>See All</span>
      </div>

      {allReports.length === 0 ? (
        <div className="reports-page__empty">
          <div className="reports-page__empty-icon">📭</div>
          <h3>No Reports Found</h3>
          <p>Run your first website audit to populate your portfolio log.</p>
        </div>
      ) : (
        <>
          {/* Virtualized scrollable list */}
          <div
            ref={parentRef}
            style={{
              height: '55vh',
              overflowY: 'auto',
              contain: 'strict',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,240,255,0.2) rgba(255,255,255,0.02)',
              paddingRight: '6px'
            }}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transform: `translateY(${virtualizer.getVirtualItems()[0]?.start ?? 0}px)`,
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const report = allReports[virtualRow.index];
                  return (
                    <div
                      key={report.testId}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                    >
                      <ReportRowCard
                        report={report}
                        onSelect={handleSelect}
                        onDeleteClick={handleDeleteClick}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sentinel for infinite scroll */}
            <div ref={loadMoreRef} style={{ height: 1 }} />
          </div>

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="reports-page__loading" style={{ padding: '16px', marginTop: 0 }}>
              <div className="reports-page__spinner" style={{ width: 24, height: 24 }}></div>
              <span style={{ fontSize: '0.85rem' }}>Loading more reports...</span>
            </div>
          )}
        </>
      )}

      {/* ── Custom Glassmorphic Delete Confirmation Modal ── */}
      {deletingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🗑️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>Delete Project Report?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 30px 0' }}>
              Are you sure you want to permanently delete this report? This will delete all cached AI issue tasks, page audits, and screenshots. This action is irreversible.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="reports-confirm-btn-cancel"
                onClick={() => setDeletingId(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Cancel
              </button>
              <button
                className="reports-confirm-btn-delete"
                onClick={executeDelete}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
