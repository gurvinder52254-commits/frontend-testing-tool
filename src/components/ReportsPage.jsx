import { useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

const PAGE_LIMIT = 20;

// ─── Pure helper functions (outside component — never recreated) ──────────────
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

// ─── Report Card (memoized so individual cards don't re-render on scroll) ─────
import { memo } from 'react';
const ReportCard = memo(function ReportCard({ report, style, onSelect }) {
  return (
    <div
      style={style}
      className="reports-card"
      onClick={() => onSelect(report.testId)}
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
  );
});

// ─── Main Component ────────────────────────────────────────────────────────────
function ReportsPage({ onSelectProject }) {
  const { authHeaders } = useAuth();
  const parentRef = useRef(null);
  const loadMoreRef = useRef(null);

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
      // Sort by date newest first and filter valid reports
      const sorted = (data.reports || [])
        .filter((r) => r.hasReport)
        .sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
      return { ...data, reports: sorted };
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  // Flatten all pages into a single array for the virtualizer
  const allReports = data?.pages.flatMap((p) => p.reports) ?? [];

  // ── Virtualizer for the report card list ──
  const virtualizer = useVirtualizer({
    count: allReports.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // estimated card height in px
    overscan: 4,
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

  // ── Loading state ──
  if (isLoading) {
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

  // ── Error state ──
  if (isError) {
    return (
      <div className="reports-page">
        <div className="reports-page__header">
          <h1 className="reports-page__title">
            📊 Project <span className="reports-page__title-gradient">Reports</span>
          </h1>
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
      <div className="reports-page__header">
        <div>
          <h1 className="reports-page__title">
            📊 Project <span className="reports-page__title-gradient">Reports</span>
          </h1>
          <p className="reports-page__subtitle">
            {totalCount} project{totalCount !== 1 ? 's' : ''} tested — click to view dashboard
          </p>
        </div>
        <button
          className="reports-page__refresh-btn"
          onClick={() => refetch()}
          title="Refresh reports"
        >
          🔄
        </button>
      </div>

      {allReports.length === 0 ? (
        <div className="reports-page__empty">
          <div className="reports-page__empty-icon">📭</div>
          <h3>No Reports Yet</h3>
          <p>Run your first website test to see reports here.</p>
        </div>
      ) : (
        <>
          {/* Virtualized scrollable list */}
          <div
            ref={parentRef}
            style={{
              height: '75vh',
              overflowY: 'auto',
              contain: 'strict',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,240,255,0.3) rgba(255,255,255,0.04)',
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
                className="reports-page__grid"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
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
                      <ReportCard
                        report={report}
                        onSelect={handleSelect}
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
    </div>
  );
}

export default ReportsPage;
