import { useState, memo } from 'react';
import GroqTestPanel from './GroqTestPanel';

const BACKEND_BASE = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`).replace(/\/api$/, '');


function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getScoreFillColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#06b6d4';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getRelativeTime(isoString) {
  if (!isoString) return '2 MINS AGO';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins === 1) return '1 MIN AGO';
    if (diffMins < 60) return `${diffMins} MINS AGO`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 HOUR AGO';
    if (diffHours < 24) return `${diffHours} HOURS AGO`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 DAY AGO';
    return `${diffDays} DAYS AGO`;
  } catch (_) {
    return '2 MINS AGO';
  }
}

const PageCard = memo(function PageCard({ page, onScreenshotClick, testDate }) {
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const score = page.analysis?.overallScore || page.score || 0;
  const analysis = page.analysis || null;
  const stats = page.elementsInfo?.structureStats || null;

  // Broken links = checked links whose status is unreachable (0) or an error (>= 400)
  const brokenLinksCount = Array.isArray(page.brokenLinksCheck)
    ? page.brokenLinksCheck.filter((l) => l && (l.status === 0 || l.status >= 400)).length
    : 0;

  // Desktop + Mobile screenshot sources (mobile is optional)
  const desktopUrl = page.desktopScreenshotUrl || page.screenshotUrl;
  const mobileUrl = page.mobileScreenshotUrl;
  const desktopSrc = desktopUrl ? `${BACKEND_BASE}${desktopUrl}` : null;
  const mobileSrc = mobileUrl ? `${BACKEND_BASE}${mobileUrl}` : null;

  const thumbLabelStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  // Fixed-height box that shows the FULL screenshot with its own vertical scroll.
  const thumbScrollStyle = {
    height: 440,
    overflowY: 'auto',
    overflowX: 'hidden',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'var(--bg-secondary)',
  };

  const loadStatus = page.loadStatus || 'SUCCESS';

  // Indexability: from backend indexStatus, with a fallback derived from robots meta
  const indexStatus = page.indexStatus
    || (page.elementsInfo?.seo?.indexable === false ? 'noindex'
      : page.elementsInfo?.seo?.indexable === true ? 'indexed' : 'unknown');
  const robotsTip = page.robots
    ? `robots: ${page.robots.metaRobots || '—'}${page.robots.xRobotsTag ? ` · X-Robots-Tag: ${page.robots.xRobotsTag}` : ''}`
    : (indexStatus === 'indexed' ? 'Search engines can index this page' : 'Marked noindex (robots meta / X-Robots-Tag)');

  return (
    <div className="page-card-accordion-item" style={{ marginBottom: '8px', width: '100%' }}>
      {/* Accordion Header */}
      <div
        className={`page-card-accordion-header ${isCardExpanded ? 'expanded' : ''}`}
        onClick={() => setIsCardExpanded(!isCardExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'rgba(30, 41, 59, 0.45)', // sleek slate/dark glass background
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: isCardExpanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          {/* Source Tag */}
          {page.source && (
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-secondary)',
              padding: '7px 11px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {page.source}
            </span>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {page.title || page.text || 'Untitled Page'}
            </div>
            <div style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: '2px'
            }}>
              {page.url}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Index status badge (indexed / no-index) */}
          {indexStatus !== 'unknown' && (
            <span title={robotsTip} style={{
              fontSize: '13px',
              fontWeight: 700,
              background: indexStatus === 'indexed' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.14)',
              color: indexStatus === 'indexed' ? '#22d3ee' : '#f59e0b',
              padding: '4px 10px',
              borderRadius: '6px',
              border: indexStatus === 'indexed' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
              whiteSpace: 'nowrap',
            }}>
              {indexStatus === 'indexed' ? '🔍 Indexed' : '🚫 No-Index'}
            </span>
          )}

          {/* Load Status Badge */}
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            background: loadStatus === 'SUCCESS' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: loadStatus === 'SUCCESS' ? '#10b981' : '#ef4444',
            padding: '4px 10px',
            borderRadius: '6px',
            border: loadStatus === 'SUCCESS' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            {loadStatus === 'SUCCESS' ? '✓ OK' : '✗ Failed'}
          </span>

          {/* AI Score Badge */}
          {score > 0 && (
            <span style={{
              fontSize: '14px',
              fontWeight: 800,
              background: `${getScoreFillColor(score)}15`,
              color: getScoreFillColor(score),
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${getScoreFillColor(score)}30`
            }}>
              {score} / 100
            </span>
          )}

          {/* Toggle Caret */}
          <div style={{
            color: 'var(--text-muted)',
            transform: isCardExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Accordion Body details rendering conditionally */}
      {isCardExpanded && (
        <div
          className="page-card-accordion-body"
          style={{
            background: 'rgba(15, 23, 42, 0.45)', // matching dark glass body
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '24px',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease',
          }}
        >
          <div className="page-card" style={{ height: 'auto', border: 'none', background: 'transparent', backdropFilter: 'none', animation: 'none', padding: 0 }}>
            {/* Desktop + Mobile — FULL screenshots, each with its own scroll box */}
            {(desktopSrc || mobileSrc) ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap' }}>
                {/* Desktop (left, wider) */}
                <div style={{ flex: '2 1 500px', minWidth: 0 }}>
                  {/* Mockup Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: 'none',
                    borderRadius: '12px 12px 0 0',
                    padding: '12px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      Desktop View
                    </div>
                    {/* Window Controls */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></span>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{
                      ...thumbScrollStyle,
                      borderRadius: '0 0 12px 12px',
                      borderTop: 'none',
                    }}>
                      {desktopSrc ? (
                        <img
                          src={desktopSrc}
                          alt={`Desktop view — ${page.title || page.url}`}
                          onClick={() => onScreenshotClick?.(desktopSrc)}
                          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="live-browser__placeholder" style={{ height: '100%' }}>
                          <div className="spinner" />
                        </div>
                      )}
                    </div>

                    {/* Score Badge + Source Tag pinned to the box (don't scroll with the image) */}
                    {score > 0 && (
                      <div className={`page-card__score-badge page-card__score-badge--${getScoreClass(score)}`} style={{ top: '16px', right: '16px' }}>
                        {score}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile (right, narrower) */}
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                  {/* Mockup Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: 'none',
                    borderRadius: '12px 12px 0 0',
                    padding: '12px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                      Mobile View
                    </div>
                    {/* Ellipsis Menu */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', cursor: 'pointer' }}>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94a3b8' }}></span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94a3b8' }}></span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#94a3b8' }}></span>
                    </div>
                  </div>

                  <div style={{
                    ...thumbScrollStyle,
                    borderRadius: '0 0 12px 12px',
                    borderTop: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '24px 0',
                    background: 'rgba(15, 23, 42, 0.6)',
                  }}>
                    {mobileSrc ? (
                      /* Smartphone Mockup Frame */
                      <div style={{
                        width: '200px',
                        height: '380px',
                        border: '12px solid #1e293b',
                        borderRadius: '32px',
                        background: '#0f172a',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        {/* Notch / Speaker bar */}
                        <div style={{
                          width: '60px',
                          height: '14px',
                          background: '#1e293b',
                          borderRadius: '0 0 12px 12px',
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10,
                        }} />

                        {/* Scrollable screenshot inner view */}
                        <div style={{
                          flex: 1,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          scrollbarWidth: 'none',
                        }}>
                          <img
                            src={mobileSrc}
                            alt={`Mobile view — ${page.title || page.url}`}
                            onClick={() => onScreenshotClick?.(mobileSrc)}
                            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="live-browser__placeholder"
                        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: 8 }}
                      >
                        Mobile screenshot not available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="page-card__screenshot-container">
                <div className="live-browser__placeholder" style={{ height: '100%' }}>
                  <div className="spinner" />
                </div>
              </div>
            )}

            <div className="page-card__body">
              <div className="page-card__title">{page.title || page.text || 'Untitled Page'}</div>
              <div className="page-card__url">{page.url}</div>

              {/* Redesigned Metadata & Structure Analysis dashboard */}
              <div style={{ marginTop: '24px' }}>
                {/* Row 1: Metadata grid */}
                <div className="metadata-grid" style={{ gap: '20px', marginBottom: '20px', alignItems: 'stretch' }}>
                  {/* Metadata Analysis Card */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px'
                  }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Metadata Analysis
                      </div>
                      <button style={{
                        background: 'transparent',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                          e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Edit SEO Tags
                      </button>
                    </div>

                    {/* Meta Description Block */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: '10px',
                        borderLeft: '2px solid var(--accent-primary)',
                        paddingLeft: '8px'
                      }}>
                        Meta Description
                      </div>
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.5'
                      }}>
                        {page.elementsInfo?.seo?.description || 'No description found'}
                      </div>
                    </div>

                    {/* Target Keywords Block */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: '10px',
                        borderLeft: '2px solid var(--accent-primary)',
                        paddingLeft: '8px'
                      }}>
                        Target Keywords
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {page.elementsInfo?.seo?.keywords ? (
                          page.elementsInfo.seo.keywords.split(',').map((kw, idx) => (
                            <span key={idx} style={{
                              background: 'rgba(0, 240, 255, 0.04)',
                              border: '1px solid rgba(0, 240, 255, 0.15)',
                              color: 'var(--accent-primary)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              {kw.trim()}
                            </span>
                          ))
                        ) : (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontStyle: 'italic'
                          }}>
                            None
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indexing Status Card */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '260px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: '16px' }}>
                      Indexing Status
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      {/* Green Badge Icon */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 11 11 13 15 9" />
                        </svg>
                      </div>

                      <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
                        {loadStatus === 'SUCCESS' ? 'OK' : 'FAILED'}
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {loadStatus === 'SUCCESS' ? 'System Crawl Complete' : 'Network/DNS Resolve Failed'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '16px', marginTop: '16px', fontSize: '10px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LAST UPDATE</span>
                      <span style={{ fontWeight: 800, color: '#10b981', letterSpacing: '0.05em' }}>{getRelativeTime(testDate)}</span>
                    </div>
                  </div>

                  {/* AI Relevancy Card */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '260px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: '16px' }}>
                      AI Relevancy
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      {/* Red Warning Icon */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff716c',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>

                      <div style={{ fontSize: '24px', fontWeight: 900, color: score > 0 ? 'var(--accent-primary)' : '#ff716c', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>
                        {score > 0 ? `${score}%` : 'N/A'}
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {score > 0 ? 'Audit Scan Evaluated' : 'Pending Training'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '16px', marginTop: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        Request Audit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structure Analysis Full Width Panel */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginTop: '20px'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(0, 240, 255, 0.08)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="9" />
                          <rect x="14" y="3" width="7" height="5" />
                          <rect x="14" y="12" width="7" height="9" />
                          <rect x="3" y="16" width="7" height="5" />
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                          Structure Analysis
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                          Hierarchical breakdown of site assets
                        </p>
                      </div>
                    </div>

                    {/* Healthy / Issues status indicators */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        Healthy
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff716c' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff716c', display: 'inline-block' }} />
                        Issues
                      </span>
                    </div>
                  </div>

                  {/* Cards Row Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                    {/* Images Found */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={{
                          background: 'rgba(0, 240, 255, 0.05)',
                          border: '1px solid rgba(0, 240, 255, 0.15)',
                          color: 'var(--accent-primary)',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {(page.elementsInfo?.counts?.images || 0) > 30 ? 'HIGH' : ((page.elementsInfo?.counts?.images || 0) > 10 ? 'MODERATE' : 'LOW')}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {page.elementsInfo?.counts?.images || 0}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Images Found
                        </div>
                      </div>
                    </div>

                    {/* Total Links */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        <span style={{
                          background: 'rgba(0, 240, 255, 0.05)',
                          border: '1px solid rgba(0, 240, 255, 0.15)',
                          color: 'var(--accent-primary)',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {(page.elementsInfo?.counts?.links || 0) > 100 ? 'DENSE' : ((page.elementsInfo?.counts?.links || 0) > 30 ? 'MEDIUM' : 'SPARSE')}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {page.elementsInfo?.counts?.links || 0}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Total Links
                        </div>
                      </div>
                    </div>

                    {/* JS Scripts */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                        <span style={{
                          background: (page.elementsInfo?.counts?.scripts || 0) === 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: (page.elementsInfo?.counts?.scripts || 0) === 0 ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid var(--border-subtle)',
                          color: (page.elementsInfo?.counts?.scripts || 0) === 0 ? '#10b981' : 'var(--text-muted)',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {(page.elementsInfo?.counts?.scripts || 0) === 0 ? 'CLEAN' : 'ACTIVE'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {page.elementsInfo?.counts?.scripts || 0}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          JS Scripts
                        </div>
                      </div>
                    </div>

                    {/* Style Bundle */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34737 18.5135 6.00843 18.2105 6.75 18.2105H8.375C9.47957 18.2105 10.375 19.1059 10.375 20.2105V21.642C10.9029 21.875 11.4559 22 12 22Z" />
                        </svg>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          LIGHT
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {page.elementsInfo?.counts?.styles || 1}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Style Bundle
                        </div>
                      </div>
                    </div>

                    {/* Buttons Found */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                          <path d="M12 2v9" />
                          <path d="M8 5h8" />
                        </svg>
                        <span style={{
                          background: (page.elementsInfo?.counts?.buttons || 0) > 0 ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: (page.elementsInfo?.counts?.buttons || 0) > 0 ? '1px solid rgba(0, 240, 255, 0.15)' : '1px solid var(--border-subtle)',
                          color: (page.elementsInfo?.counts?.buttons || 0) > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {(page.elementsInfo?.counts?.buttons || 0) > 10 ? 'ACTIVE' : 'NONE'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {page.elementsInfo?.counts?.buttons || 0}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Buttons Found
                        </div>
                      </div>
                    </div>

                    {/* Forms Found */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span style={{
                          background: (page.elementsInfo?.counts?.forms || 0) > 0 ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: (page.elementsInfo?.counts?.forms || 0) > 0 ? '1px solid rgba(0, 240, 255, 0.15)' : '1px solid var(--border-subtle)',
                          color: (page.elementsInfo?.counts?.forms || 0) > 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {(page.elementsInfo?.counts?.forms || 0) > 0 ? 'ACTIVE' : 'NONE'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {page.elementsInfo?.counts?.forms || 0}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Forms Found
                        </div>
                      </div>
                    </div>

                    {/* Broken Links — highlighted count */}
                    <div style={{
                      background: brokenLinksCount > 0 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                      border: brokenLinksCount > 0 ? '1.5px solid rgba(239, 68, 68, 0.55)' : '1px solid rgba(16, 185, 129, 0.35)',
                      boxShadow: brokenLinksCount > 0 ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'none',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '130px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={brokenLinksCount > 0 ? '#ef4444' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                          <line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                        <span style={{
                          background: brokenLinksCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                          border: brokenLinksCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.2)',
                          color: brokenLinksCount > 0 ? '#ef4444' : '#10b981',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '20px',
                          textTransform: 'uppercase'
                        }}>
                          {brokenLinksCount > 0 ? 'ISSUES' : 'HEALTHY'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: brokenLinksCount > 0 ? '#ef4444' : 'var(--text-primary)', marginBottom: '4px' }}>
                          {brokenLinksCount}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Broken Links
                        </div>
                      </div>
                    </div>

                    {/* Critical Checks */}
                    {!stats && (
                      <div style={{
                        border: '1.5px dashed rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.02)',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 800, color: '#ff716c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Critical Checks
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Missing Src</span>
                            <strong style={{ color: '#ff716c' }}>{page.elementsInfo?.counts?.missingSrc || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Missing Alt</span>
                            <strong style={{ color: '#ff716c' }}>{page.elementsInfo?.counts?.missingAlt || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Img Duplicates</span>
                            <strong style={{ color: '#ff716c' }}>{page.elementsInfo?.counts?.duplicateImages || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Link Conflicts</span>
                            <strong style={{ color: '#ff716c' }}>{page.elementsInfo?.counts?.duplicateLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Links Checked</span>
                            <strong style={{ color: '#ff716c' }}>{page.brokenLinksCheck?.length || 0}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Redesigned Structure Analysis Detailed Dashboard */}
                  {stats && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                      gap: '20px', 
                      marginTop: '24px' 
                    }}>
                      {/* 1. Content & Meta Card */}
                      <div className="page-card__network-table" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          Content & Meta Analysis
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Words Count</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.words || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Sentences</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.sentences || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Paragraphs</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.paragraphs || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Characters</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.characters || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Characters (No Spaces)</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.charactersNoSpaces || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Estimated Pages (500 w/p)</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.estimatedPages || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Reading Time</span>
                            <strong style={{ color: '#06b6d4' }}>{stats.readingTime || "0.0"} min</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Speaking Time</span>
                            <strong style={{ color: '#06b6d4' }}>{stats.speakingTime || "0.0"} min</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Avg. Words Per Sentence</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.avgWordsPerSentence || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Title Length</span>
                            <strong style={{ color: stats.titleLength > 60 || stats.titleLength < 30 ? '#fbbf24' : '#10b981' }}>{stats.titleLength || 0} chars</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Meta Description Length</span>
                            <strong style={{ color: stats.metaDescriptionLength > 160 || stats.metaDescriptionLength < 120 ? '#fbbf24' : '#10b981' }}>{stats.metaDescriptionLength || 0} chars</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Canonical Tag</span>
                            <strong style={{ color: stats.canonical === 'Yes' ? '#10b981' : '#f87171' }}>{stats.canonical || 'No'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Robots Meta</span>
                            <strong style={{ color: stats.robotsMeta === 'Missing' ? '#f87171' : '#10b981' }}>{stats.robotsMeta || 'Missing'}</strong>
                          </div>
                        </div>
                      </div>

                      {/* 2. Headings & DOM Elements */}
                      <div className="page-card__network-table" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="9" x2="20" y2="9" />
                            <line x1="4" y1="15" x2="20" y2="15" />
                            <line x1="10" y1="3" x2="8" y2="21" />
                            <line x1="16" y1="3" x2="14" y2="21" />
                          </svg>
                          Headings & DOM Hierarchy
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>H1 Headings</span>
                            <strong style={{ color: stats.h1 === 0 || stats.h1 > 1 ? '#fbbf24' : '#10b981' }}>{stats.h1 || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>H2 Headings</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.h2 || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>H3 Headings</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.h3 || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>H4 Headings</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.h4 || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>H5 Headings</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.h5 || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>H6 Headings</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.h6 || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total DOM Elements</span>
                            <strong style={{ color: stats.domElements > 1500 ? '#f87171' : (stats.domElements > 800 ? '#fbbf24' : '#10b981') }}>{stats.domElements || 0}</strong>
                          </div>
                        </div>
                      </div>

                      {/* 3. Image & Link Audits */}
                      <div className="page-card__network-table" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Asset & Link Audits
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Images Found</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.images || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Missing Alt attributes</span>
                            <strong style={{ color: stats.missingAlt > 0 ? '#f87171' : 'var(--text-primary)' }}>{stats.missingAlt || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Missing Src attributes</span>
                            <strong style={{ color: stats.missingSrc > 0 ? '#f87171' : 'var(--text-primary)' }}>{stats.missingSrc || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Duplicate Images</span>
                            <strong style={{ color: stats.duplicateImages > 0 ? '#fbbf24' : 'var(--text-primary)' }}>{stats.duplicateImages || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Lazy Loaded Images</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.lazyLoadedImages || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Images Without Size</span>
                            <strong style={{ color: stats.imagesWithoutSize > 0 ? '#fbbf24' : 'var(--text-primary)' }}>{stats.imagesWithoutSize || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px', marginTop: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Links</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.totalLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Internal Links</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.internalLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>External Links</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.externalLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Empty Links (# / blank)</span>
                            <strong style={{ color: stats.emptyLinks > 0 ? '#f87171' : 'var(--text-primary)' }}>{stats.emptyLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Duplicate Links</span>
                            <strong style={{ color: stats.duplicateLinks > 0 ? '#fbbf24' : 'var(--text-primary)' }}>{stats.duplicateLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Javascript Links</span>
                            <strong style={{ color: stats.javascriptLinks > 0 ? '#fbbf24' : 'var(--text-primary)' }}>{stats.javascriptLinks || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Mailto / Tel Links</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.mailtoLinks || 0} / {stats.telLinks || 0}</strong>
                          </div>
                        </div>
                      </div>

                      {/* 4. Page Elements & Assets */}
                      <div className="page-card__network-table" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="9" />
                            <rect x="14" y="3" width="7" height="5" />
                            <rect x="14" y="12" width="7" height="9" />
                            <rect x="3" y="16" width="7" height="5" />
                          </svg>
                          Page Elements & Assets
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Buttons / Forms</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.buttons || 0} / {stats.forms || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Inputs / Textareas / Selects</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.inputs || 0} / {stats.textareas || 0} / {stats.selects || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Tables / Lists / List Items</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.tables || 0} / {stats.lists || 0} / {stats.listItems || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Videos / Audio / Iframes</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.videos || 0} / {stats.audio || 0} / {stats.iframes || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Code Blocks / Blockquotes</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.codeBlocks || 0} / {stats.blockquotes || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Canvas / SVG Elements</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.canvas || 0} / {stats.svg || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px', marginTop: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>JS Scripts</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.jsScripts || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>CSS Files / Inline Styles</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.cssFiles || 0} / {stats.styleTags || 0}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Style Bundles</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.styleBundles || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Buttons Section */}
              {page.elementsInfo?.buttons?.filter(b => b.isImageButton).length > 0 && (
                <div className="page-card__section" style={{ marginTop: 22 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>🖼️ Image Content Buttons</div>
                  <div className="page-card__scroll-list" style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {page.elementsInfo.buttons.filter(b => b.isImageButton).map((btn, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                          {btn.text}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '50%' }}>
                          <span style={{ color: btn.working?.includes('Yes') ? 'var(--success)' : (btn.working?.includes('No') ? 'var(--error)' : 'var(--warning)'), fontWeight: 700 }}>
                            {btn.working}
                          </span>
                          {btn.reason && <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>{btn.reason}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Buttons Section */}
              {page.elementsInfo?.buttons?.filter(b => !b.isImageButton).length > 0 && (
                <div className="page-card__section" style={{ marginTop: 22 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>🔘 Interactive Buttons</div>
                  <div className="page-card__scroll-list" style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {page.elementsInfo.buttons.filter(b => !b.isImageButton).map((btn, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                          {btn.text}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '50%' }}>
                          <span style={{ color: btn.working?.includes('Yes') ? 'var(--success)' : (btn.working?.includes('No') ? 'var(--error)' : 'var(--warning)'), fontWeight: 700 }}>
                            {btn.working}
                          </span>
                          {btn.reason && <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>{btn.reason}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Page Links */}
              {page.brokenLinksCheck?.length > 0 && (
                <div className="page-card__links-container">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#10b981', marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    All Page Links
                    <span style={{ 
                      fontSize: '10px', 
                      background: 'rgba(16, 185, 129, 0.15)', 
                      color: '#6ee7b7', 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      marginLeft: 'auto',
                      fontWeight: '700',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      {page.brokenLinksCheck.length} links
                    </span>
                  </div>
                  <div className="page-card__scroll-list" style={{ maxHeight: '320px' }}>
                    {page.brokenLinksCheck.map((link, idx) => {
                      const isDup = link.isDuplicate || link.reason === 'Duplicate Link';
                      const statusColor = link.status === 200 ? (isDup ? '#8b5cf6' : '#10b981')
                        : link.status === 0 ? '#6b7280'
                          : link.status >= 500 ? '#ef4444'
                            : link.status === 404 ? '#ef4444'
                              : link.status >= 400 ? '#f59e0b'
                                : '#3b82f6';

                      return (
                        <div key={idx} title={link.href} className="page-card__link-item" style={{ borderLeft: `4px solid ${statusColor}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {link.text || 'No Text Found'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px', fontFamily: 'monospace', opacity: 0.65 }}>
                              {link.href}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 6px', borderRadius: '4px',
                              fontSize: '10px', fontWeight: 800, color: '#fff',
                              background: statusColor, minWidth: '34px', textAlign: 'center',
                              textTransform: 'uppercase'
                            }}>
                              {link.status === 200 ? (isDup ? 'DUP' : 'OK') : (link.status || 'ERR')}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right', opacity: 0.65 }}>
                              {link.reason || (isDup ? 'Duplicate Link' : 'Discovered')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Test Results */}
              {page.formTestResults?.length > 0 && (
                <div className="page-card__section" style={{ marginTop: 22 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#a855f7', marginBottom: 10, textTransform: 'uppercase' }}>
                    📝 Form Testing ({page.formTestResults.length} {page.formTestResults.length === 1 ? 'Section' : 'Sections'}{page.formTestResults.some(f => f.isDivForm) ? ` — ${page.formTestResults.filter(f => !f.isDivForm).length} Form, ${page.formTestResults.filter(f => f.isDivForm).length} Div` : ''})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {page.formTestResults.map((form, fIdx) => {
                      const getStatusBadge = (status) => {
                        const map = {
                          PASS: { bg: '#10b981', text: 'PASS' },
                          FAIL: { bg: '#ef4444', text: 'FAIL' },
                          WARN: { bg: '#f59e0b', text: 'WARN' },
                          ERROR: { bg: '#ef4444', text: 'ERR' },
                          SKIPPED: { bg: '#6b7280', text: 'SKIP' },
                          NO_VALIDATION: { bg: '#f59e0b', text: 'NO VAL' },
                          REDIRECT: { bg: '#3b82f6', text: 'REDIR' },
                          NO_FEEDBACK: { bg: '#6b7280', text: 'NO FB' },
                        };
                        const s = map[status] || { bg: '#6b7280', text: status };
                        return (
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                            fontSize: '12px', fontWeight: 700, color: '#fff',
                            background: s.bg, minWidth: '36px', textAlign: 'center'
                          }}>
                            {s.text}
                          </span>
                        );
                      };

                      return (
                        <div key={fIdx} style={{
                          background: 'rgba(168, 85, 247, 0.06)',
                          border: '1px solid rgba(168, 85, 247, 0.15)',
                          borderRadius: '8px', padding: '13px 15px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc' }}>
                                {form.isDivForm ? '📦' : '📝'} {form.isDivForm ? 'Div Section' : 'Form'}: {form.formId}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 8 }}>
                                {form.isDivForm ? 'DIV' : form.method} • {form.totalFields} fields
                              </span>
                              {form.isDivForm && (
                                <span style={{ fontSize: '11px', color: '#06b6d4', background: 'rgba(6,182,212,0.15)', padding: '1px 5px', borderRadius: '3px', marginLeft: 6, fontWeight: 600 }}>
                                  DIV-BASED
                                </span>
                              )}
                            </div>
                            {form.hasSubmitButton && (
                              <span style={{ fontSize: '12px', color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                🔘 {form.submitButtonText}
                              </span>
                            )}
                          </div>

                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '9px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: 6, fontSize: '13px'
                          }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>🚫 Empty Submit Test</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {getStatusBadge(form.invalidSubmitTest?.status)}
                            </div>
                          </div>

                          {form.invalidSubmitTest?.result && (
                            <div style={{ maxHeight: '80px', overflowY: 'auto', marginBottom: 8, paddingLeft: 8 }}>
                              <div style={{ fontSize: '12px', color: '#fbbf24', padding: '2px 0', display: 'flex', gap: 4 }}>
                                <span style={{ color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>⚠ Result:</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{form.invalidSubmitTest.result}</span>
                              </div>
                            </div>
                          )}

                          {form.fieldTests?.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                                Field Validation Tests
                              </div>
                              <div style={{
                                display: 'grid', gridTemplateColumns: '2fr 55px 50px 50px 50px',
                                gap: '6px', padding: '7px 11px', background: 'rgba(255,255,255,0.04)',
                                borderRadius: '4px 4px 0 0', fontSize: '11px', fontWeight: 700,
                                color: 'var(--text-muted)', textTransform: 'uppercase'
                              }}>
                                <span>Field</span>
                                <span style={{ textAlign: 'center' }}>Type</span>
                                <span style={{ textAlign: 'center' }}>Req?</span>
                                <span style={{ textAlign: 'center' }}>Invalid</span>
                                <span style={{ textAlign: 'center' }}>Valid</span>
                              </div>
                              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                {form.fieldTests.map((ft, ftIdx) => (
                                  <div key={ftIdx} title={`Invalid: ${ft.invalidTest?.error || 'N/A'}\nValid: ${ft.validTest?.error || 'OK'}`} style={{
                                    display: 'grid', gridTemplateColumns: '2fr 55px 50px 50px 50px',
                                    gap: '6px', padding: '8px 11px', fontSize: '13px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    background: ftIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                  }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                                      {ft.label || ft.name}
                                    </span>
                                    <span style={{ textAlign: 'center' }}>
                                      <span style={{
                                        display: 'inline-block', padding: '1px 4px', borderRadius: '3px',
                                        fontSize: '11px', fontWeight: 600, color: '#a78bfa',
                                        background: 'rgba(167,139,250,0.1)', textTransform: 'lowercase'
                                      }}>
                                        {ft.type}
                                      </span>
                                    </span>
                                    <span style={{ textAlign: 'center', fontSize: '12px', color: ft.required ? '#f59e0b' : '#6b7280' }}>
                                      {ft.required ? 'Yes' : 'No'}
                                    </span>
                                    <span style={{ textAlign: 'center' }}>{getStatusBadge(ft.invalidTest?.status)}</span>
                                    <span style={{ textAlign: 'center' }}>{getStatusBadge(ft.validTest?.status)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '9px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '13px'
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>✅ Valid Submit Test</span>
                              {form.validSubmitTest?.result && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {form.validSubmitTest.result}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              {form.validSubmitTest?.apiStatus && (
                                <span style={{ fontSize: '11px', color: form.validSubmitTest.apiStatus < 400 ? '#10b981' : '#ef4444' }}>
                                  API: {form.validSubmitTest.apiStatus}
                                </span>
                              )}
                              {getStatusBadge(form.validSubmitTest?.status)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quality Audit / Errors */}
              {((page.elementsInfo?.badImages?.length > 0) ||
                (page.elementsInfo?.broken?.links?.length > 0) ||
                (page.consoleErrors?.length > 0) ||
                (page.networkErrors?.length > 0)) && (
                  <div className="page-card__quality-container">
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '13px', 
                      fontWeight: 800, 
                      color: '#f87171', 
                      marginBottom: '12px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Quality Audit / Errors
                      <span style={{ 
                        fontSize: '10px', 
                        background: 'rgba(239, 68, 68, 0.15)', 
                        color: '#fca5a5', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        marginLeft: 'auto',
                        fontWeight: '700',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        {(page.consoleErrors?.length || 0) + (page.networkErrors?.length || 0)} issues
                      </span>
                    </div>
                    <div className="page-card__scroll-list">
                      {page.consoleErrors?.map((err, idx) => {
                        const errMsg = err.text || err.message || err;
                        return (
                          <div key={`err-${idx}`} className="page-card__error-item page-card__error-item--console">
                            <div className="page-card__error-icon">
                              <svg style={{ width: '14px', height: '14px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div className="page-card__error-content">
                              <div className="page-card__error-title">Console Error</div>
                              <div className="page-card__error-msg">{errMsg}</div>
                              {err.location && (
                                <div className="page-card__error-meta" style={{ opacity: 0.5, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  Location: {err.location}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {page.networkErrors?.map((err, idx) => {
                        const isHttp = err.type === 'HTTP_ERROR' || err.status;
                        const title = isHttp ? `HTTP ${err.status}: Request Failed` : 'Network Error';
                        const message = isHttp 
                          ? (err.statusText || 'Failed to load')
                          : (err.errorText || 'net::ERR_ABORTED');

                        return (
                          <div key={`net-${idx}`} className="page-card__error-item page-card__error-item--network">
                            <div className="page-card__error-icon">
                              <svg style={{ width: '14px', height: '14px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                            </div>
                            <div className="page-card__error-content">
                              <div className="page-card__error-title">{title}</div>
                              <div className="page-card__error-msg">{message}</div>
                              {err.url && (
                                <div className="page-card__error-meta" style={{ opacity: 0.5, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  URL: {err.url}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Network Activity */}
              {page.networkLog && page.networkLog.summary?.totalRequests > 0 && (() => {
                const net = page.networkLog;
                const summary = net.summary;
                const formatSize = (bytes) => {
                  if (!bytes || bytes === 0) return '0 B';
                  if (bytes < 1024) return bytes + ' B';
                  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                };
                const formatTime = (ms) => {
                  if (!ms || ms <= 0) return '—';
                  if (ms < 1000) return ms + ' ms';
                  return (ms / 1000).toFixed(2) + ' s';
                };
                const getStatusColor = (status) => {
                  if (status >= 200 && status < 300) return '#10b981';
                  if (status >= 300 && status < 400) return '#3b82f6';
                  if (status >= 400 && status < 500) return '#f59e0b';
                  if (status >= 500) return '#ef4444';
                  return '#6b7280';
                };
                const getTypeColor = (type) => {
                  const map = {
                    document: '#38bdf8', // sky blue
                    stylesheet: '#c084fc', // purple
                    script: '#fbbf24', // amber
                    image: '#34d399', // emerald
                    font: '#f472b6', // pink
                    xhr: '#2dd4bf', // teal
                    fetch: '#2dd4bf', // teal
                    ping: '#94a3b8', // slate
                    media: '#f97316', // orange
                  };
                  return map[String(type).toLowerCase()] || '#94a3b8';
                };

                return (
                  <div className="page-card__network-container">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.436 3.003a7.759 7.759 0 011.128 0c1.895.12 3.518 1.455 3.992 3.284H9.436V3.003zM7.8 6.287c.394-1.921 1.7-3.23 3.3-3.284v3.284H7.8zM4.032 6.287c.465-1.8 2.05-3.08 3.868-3.26v3.26H4.032zM3.07 7.787a7.734 7.734 0 000 4.426h2.784V7.787H3.07zm4.284 0v4.426H12V7.787H7.354zm6.076 0h2.784a7.734 7.734 0 000-4.426H13.43v4.426zm3.5 1.5a7.747 7.747 0 010 1.426h-3.5V9.287h3.5zm-5 0v1.426H7.8V9.287h4.2zm-5.7 0v1.426H3.07V9.287h3.43zm-.4 2.926c-.465 1.8-2.05 3.08-3.868 3.26v-3.26h3.868zm1.474 0h3.3v3.284c-1.6-.054-2.906-1.363-3.3-3.284zm4.826 0h4.292a7.759 7.759 0 01-1.128 0c-1.895-.12-3.518-1.455-3.992-3.284h.828zm5.7 0h2.784a7.734 7.734 0 010 4.426H13.43v-4.426z" clipRule="evenodd" />
                        </svg>
                        Network Activity
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2.5px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span className="live-stream-dot" style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }}></span>
                        Live Stream
                      </div>
                    </div>

                    <div className="page-card__network-stats">
                      <div className="page-card__network-stat-col">
                        <div className="page-card__network-stat-label">Requests</div>
                        <div className="page-card__network-stat-value" style={{ color: '#10b981' }}>{summary.totalRequests}</div>
                      </div>
                      <div className="page-card__network-stat-col">
                        <div className="page-card__network-stat-label">Transferred</div>
                        <div className="page-card__network-stat-value" style={{ color: '#a855f7' }}>{formatSize(summary.totalTransferred)}</div>
                      </div>
                      <div className="page-card__network-stat-col">
                        <div className="page-card__network-stat-label">DOMContent</div>
                        <div className="page-card__network-stat-value" style={{ color: '#38bdf8' }}>{formatTime(summary.domContentLoaded)}</div>
                      </div>
                      <div className="page-card__network-stat-col">
                        <div className="page-card__network-stat-label">Load</div>
                        <div className="page-card__network-stat-value" style={{ color: '#ef4444' }}>{formatTime(summary.loadTime)}</div>
                      </div>
                      <div className="page-card__network-stat-col">
                        <div className="page-card__network-stat-label">Finish</div>
                        <div className="page-card__network-stat-value" style={{ color: '#10b981' }}>{formatTime(summary.finishTime)}</div>
                      </div>
                    </div>

                    <div className="page-card__network-table">
                      <div className="page-card__network-header">
                        <span>Name</span>
                        <span style={{ textAlign: 'center' }}>Status</span>
                        <span style={{ textAlign: 'center' }}>Type</span>
                        <span style={{ textAlign: 'right' }}>Size</span>
                        <span style={{ textAlign: 'right' }}>Time</span>
                      </div>

                      <div className="page-card__network-list">
                        {net.requests.map((req, idx) => {
                          const status = req.status;
                          const isSuccess = status >= 200 && status < 300;
                          const isWarning = status >= 300 && status < 400;
                          const isError = status >= 400 || !status;
                          
                          let statusClass = '';
                          if (status) {
                            if (isSuccess) statusClass = 'success';
                            else if (isWarning) statusClass = 'warning';
                            else if (isError) statusClass = 'error';
                          }

                          const typeColor = getTypeColor(req.type);

                          return (
                            <div key={idx} className="page-card__network-row" title={req.url}>
                              <span className="page-card__network-url">
                                {req.name || '—'}
                              </span>
                              <span style={{ textAlign: 'center' }}>
                                <span className={`page-card__badge page-card__badge--status ${statusClass}`}>
                                  {status || '—'}
                                </span>
                              </span>
                              <span style={{ textAlign: 'center' }}>
                                <span className="page-card__badge page-card__badge--type" style={{
                                  color: typeColor,
                                  background: `${typeColor}12`,
                                  border: `1px solid ${typeColor}24`
                                }}>
                                  {req.type || '—'}
                                </span>
                              </span>
                              <span style={{ textAlign: 'right', color: 'rgba(255, 255, 255, 0.45)', fontFamily: 'monospace' }}>
                                {formatSize(req.size)}
                              </span>
                              <span style={{ 
                                textAlign: 'right', 
                                color: req.time > 1000 ? '#f59e0b' : 'rgba(255, 255, 255, 0.45)',
                                fontFamily: 'monospace'
                              }}>
                                {formatTime(req.time)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* AI Analysis Expandable */}
              {analysis && !analysis.error && (
                <div className="ai-analysis">
                  <button
                    className="ai-analysis__toggle"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? '▲ Hide' : '▼ Show'} AI Analysis Details
                  </button>

                  {expanded && (
                    <div className="ai-analysis__content">
                      {analysis.uiDesignFeedback && (
                        <div className="ai-analysis__section">
                          <div className="ai-analysis__section-title">
                            🎨 UI Design ({analysis.uiDesignFeedback.score}/100)
                          </div>
                          <div className="ai-analysis__score-bar">
                            <div
                              className="ai-analysis__score-fill"
                              style={{
                                width: `${analysis.uiDesignFeedback.score}%`,
                                background: getScoreFillColor(analysis.uiDesignFeedback.score),
                              }}
                            />
                          </div>
                          {analysis.uiDesignFeedback.strengths?.length > 0 && (
                            <ul className="ai-analysis__list ai-analysis__list--success">
                              {analysis.uiDesignFeedback.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          )}
                          {analysis.uiDesignFeedback.issues?.length > 0 && (
                            <ul className="ai-analysis__list ai-analysis__list--warning">
                              {analysis.uiDesignFeedback.issues.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {analysis.pageStructure && (
                        <div className="ai-analysis__section">
                          <div className="ai-analysis__section-title">
                            🏗️ Structure ({analysis.pageStructure.score}/100)
                          </div>
                          <div className="ai-analysis__score-bar">
                            <div
                              className="ai-analysis__score-fill"
                              style={{
                                width: `${analysis.pageStructure.score}%`,
                                background: getScoreFillColor(analysis.pageStructure.score),
                              }}
                            />
                          </div>
                          {analysis.pageStructure.observations?.length > 0 && (
                            <ul className="ai-analysis__list">
                              {analysis.pageStructure.observations.map((o, i) => (
                                <li key={i}>{o}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {analysis.contentAnalysis && (
                        <div className="ai-analysis__section">
                          <div className="ai-analysis__section-title">
                            📝 Content ({analysis.contentAnalysis.score}/100)
                          </div>
                          <div className="ai-analysis__score-bar">
                            <div
                              className="ai-analysis__score-fill"
                              style={{
                                width: `${analysis.contentAnalysis.score}%`,
                                background: getScoreFillColor(analysis.contentAnalysis.score),
                              }}
                            />
                          </div>
                          {analysis.contentAnalysis.keywordErrors?.length > 0 && (
                            <ul className="ai-analysis__list ai-analysis__list--error">
                              {analysis.contentAnalysis.keywordErrors.map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {analysis.layoutIssues && (
                        <div className="ai-analysis__section">
                          <div className="ai-analysis__section-title">
                            📐 Layout ({analysis.layoutIssues.score}/100)
                          </div>
                          <div className="ai-analysis__score-bar">
                            <div
                              className="ai-analysis__score-fill"
                              style={{
                                width: `${analysis.layoutIssues.score}%`,
                                background: getScoreFillColor(analysis.layoutIssues.score),
                              }}
                            />
                          </div>
                          {analysis.layoutIssues.issues?.length > 0 && (
                            <ul className="ai-analysis__list ai-analysis__list--warning">
                              {analysis.layoutIssues.issues.map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {analysis.summary && (
                        <div className="ai-analysis__summary">{analysis.summary}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Groq AI Analysis Panel */}
              {page.groqAnalysis && (
                <GroqTestPanel groqAnalysis={page.groqAnalysis} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PageCard;
