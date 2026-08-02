import { useState, useEffect } from 'react';
import VirtualPageGrid from './VirtualPageGrid';
import AiIssuesPanel from './AiIssuesPanel';
import {
  ReportHeader,
  SuggestedFixes,
} from './FinalReport';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;


/**
 * ReportDashboard — persistent sidebar layout
 *
 * Sidebar items:
 *  - Pages                → tested pages grid
 *  - Website Testing Report → score header + suggested fixes (overview)
 *  - Error Summary        → console errors, network issues, missing assets
 *  - SEO & Meta Audits    → full SEO issues list per page
 *  - Empty Links          → broken / empty links and missing resources
 */

const SIDEBAR_ITEMS = [
  {
    key: 'pages',
    label: 'Pages',
    icon: (
      <svg className="sidebar-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    group: null,
  },
  {
    key: 'report',
    label: 'Website Testing Report',
    icon: (
      <svg className="sidebar-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    group: null,
  },
  {
    key: 'errors',
    label: 'Error Summary',
    icon: (
      <svg className="sidebar-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    group: 'Analysis',
  },
  {
    key: 'seo',
    label: 'SEO & Meta Audits',
    icon: (
      <svg className="sidebar-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    group: 'Analysis',
  },
  {
    key: 'links',
    label: 'Empty Links',
    icon: (
      <svg className="sidebar-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    group: 'Analysis',
  },
  {
    key: 'ai',
    label: 'AI Issues',
    icon: (
      <svg className="sidebar-svg-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
        <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
      </svg>
    ),
    group: 'Analysis',
  },
];

/* ── badge helper ── */
function getBadgeCount(key, report) {
  const pages = report.pages || [];
  const global = report.globalSummary || {};
  switch (key) {
    case 'pages': return pages.length;
    case 'errors': {
      const console_ = pages.reduce((s, p) => s + (p.consoleErrors?.length || 0), 0);
      const net = pages.reduce((s, p) => s + (p.networkErrors?.length || 0), 0);
      return console_ + net;
    }
    case 'seo': return global.seoIssues?.length || 0;
    case 'links':
      return (global.brokenLinks?.length || 0) + (global.missingResources?.length || 0);
    default: return null;
  }
}

function badgeColor(key, count) {
  if (!count) return 'badge--zero';
  if (key === 'errors') return 'badge--error';
  if (key === 'seo') return 'badge--warn';
  if (key === 'links') return 'badge--error';
  return 'badge--neutral';
}

/* ── Detailed Error Summary Panel ── */
function ErrorPanel({ report }) {
  const pages = report.pages || [];
  const global = report.globalSummary || {};

  const consoleErrors = pages.flatMap(p =>
    (p.consoleErrors || []).map(e => ({ page: p.url, pageTitle: p.title, ...e }))
  );
  const networkErrors = pages.flatMap(p =>
    (p.networkErrors || []).map(e => ({ page: p.url, pageTitle: p.title, ...e }))
  );
  const missingSrc = pages.flatMap(p =>
    (p.elementsInfo?.missingImages || []).map(img => ({ page: p.url, ...img }))
  );

  const StatBox = ({ value, label, color }) => (
    <div className="rd-stat-box">
      <span className="rd-stat-value" style={{ color }}>{value}</span>
      <span className="rd-stat-label">{label}</span>
    </div>
  );

  return (
    <div className="rd-panel">
      {/* Quick stats */}
      <div className="rd-stats-row">
        <StatBox value={consoleErrors.length} label="Console Errors" color="#ef4444" />
        <StatBox value={networkErrors.length} label="Network Issues" color="#f59e0b" />
        <StatBox value={global.brokenLinks?.length || 0} label="Empty Links" color="#ec4899" />
        <StatBox value={global.elementStats?.totalMissingAlt || 0} label="Missing Alt" color="#06b6d4" />
        <StatBox value={global.elementStats?.totalMissingSrc || 0} label="Missing Src" color="#f59e0b" />
        <StatBox value={global.elementStats?.totalDuplicateImages || 0} label="Duplicate Img" color="#a855f7" />
      </div>

      {/* Console errors detail */}
      <div className="rd-section">
        <div className="rd-section__header">
          <span className="rd-section__dot rd-section__dot--red" />
          <h3 className="rd-section__title">Console Errors ({consoleErrors.length})</h3>
        </div>
        {consoleErrors.length === 0 ? (
          <div className="rd-empty rd-empty--success">✓ No console errors detected</div>
        ) : (
          <div className="rd-list">
            {consoleErrors.map((e, i) => (
              <div key={i} className="rd-list-item rd-list-item--error">
                <div className="rd-list-item__badge">ERR</div>
                <div className="rd-list-item__body">
                  <div className="rd-list-item__msg">{e.text || e.message || 'Unknown error'}</div>
                  <div className="rd-list-item__meta">
                    <span className="rd-list-item__page">{e.pageTitle || e.page}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network errors detail */}
      <div className="rd-section">
        <div className="rd-section__header">
          <span className="rd-section__dot rd-section__dot--yellow" />
          <h3 className="rd-section__title">Network Issues ({networkErrors.length})</h3>
        </div>
        {networkErrors.length === 0 ? (
          <div className="rd-empty rd-empty--success">✓ No network failures detected</div>
        ) : (
          <div className="rd-list">
            {networkErrors.map((e, i) => (
              <div key={i} className="rd-list-item rd-list-item--warn">
                <div className="rd-list-item__badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                  {e.status || 'FAIL'}
                </div>
                <div className="rd-list-item__body">
                  <div className="rd-list-item__msg">{e.url || e.text || 'Unknown resource'}</div>
                  <div className="rd-list-item__meta">
                    <span className="rd-list-item__page">{e.pageTitle || e.page}</span>
                    {e.method && <span className="rd-list-item__tag">{e.method}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing image src */}
      {missingSrc.length > 0 && (
        <div className="rd-section">
          <div className="rd-section__header">
            <span className="rd-section__dot rd-section__dot--purple" />
            <h3 className="rd-section__title">Images Missing Src ({missingSrc.length})</h3>
          </div>
          <div className="rd-list">
            {missingSrc.map((img, i) => (
              <div key={i} className="rd-list-item rd-list-item--purple">
                <div className="rd-list-item__badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', borderColor: 'rgba(168,85,247,0.3)' }}>IMG</div>
                <div className="rd-list-item__body">
                  <div className="rd-list-item__msg">{img.src || img.alt || 'Unidentified image'}</div>
                  <div className="rd-list-item__meta">
                    <span className="rd-list-item__page">{img.page}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Detailed SEO Panel ── */
function SeoPanel({ report }) {
  const global = report.globalSummary || {};
  const pages = report.pages || [];

  // Group issues by type
  const issuesByPage = {};
  (global.seoIssues || []).forEach(issue => {
    const key = issue.url || issue.page || 'Global';
    if (!issuesByPage[key]) issuesByPage[key] = [];
    issuesByPage[key].push(issue);
  });

  // Per-page SEO data
  const pagesSeo = pages.map(p => {
    const seo = p.seoAudit || p.metaTags || {};
    return {
      url: p.url,
      title: p.title,
      hasTitle: !!(p.title),
      hasDesc: !!(seo.description || seo.metaDescription),
      hasOg: !!(seo.ogTitle || seo.ogDescription),
      hasCanonical: !!(seo.canonical),
      hasViewport: !!(seo.viewport),
      issues: (p.seoIssues || []),
    };
  });

  const totalIssues = global.seoIssues?.length || 0;

  return (
    <div className="rd-panel">
      {/* Summary bar */}
      <div className="rd-stats-row">
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: totalIssues > 0 ? '#f59e0b' : '#10b981' }}>{totalIssues}</span>
          <span className="rd-stat-label">SEO Issues</span>
        </div>
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: '#06b6d4' }}>{pages.length}</span>
          <span className="rd-stat-label">Pages Audited</span>
        </div>
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: '#10b981' }}>
            {pagesSeo.filter(p => p.hasTitle).length}
          </span>
          <span className="rd-stat-label">Have Title</span>
        </div>
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: '#10b981' }}>
            {pagesSeo.filter(p => p.hasDesc).length}
          </span>
          <span className="rd-stat-label">Have Meta Desc</span>
        </div>
      </div>

      {/* Global Issues */}
      <div className="rd-section">
        <div className="rd-section__header">
          <span className="rd-section__dot rd-section__dot--yellow" />
          <h3 className="rd-section__title">SEO Issues Detected ({totalIssues})</h3>
        </div>
        {totalIssues === 0 ? (
          <div className="rd-empty rd-empty--success">✓ All major SEO tags are present across all pages!</div>
        ) : (
          <div className="rd-list">
            {global.seoIssues.map((issue, i) => (
              <div key={i} className="rd-list-item rd-list-item--warn">
                <div className="rd-list-item__badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>SEO</div>
                <div className="rd-list-item__body">
                  <div className="rd-list-item__msg">{issue.issue || issue.message || String(issue)}</div>
                  {(issue.url || issue.page) && (
                    <div className="rd-list-item__meta">
                      <span className="rd-list-item__page">{issue.url || issue.page}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-page meta coverage */}
      <div className="rd-section">
        <div className="rd-section__header">
          <span className="rd-section__dot rd-section__dot--cyan" />
          <h3 className="rd-section__title">Per-Page Meta Coverage</h3>
        </div>
        <div className="rd-meta-table">
          <div className="rd-meta-table__head">
            <span>Page</span>
            <span>Title</span>
            <span>Desc</span>
            <span>OG</span>
            <span>Canonical</span>
            <span>Viewport</span>
          </div>
          {pagesSeo.length === 0 ? (
            <div className="rd-empty">No page data available</div>
          ) : (
            pagesSeo.map((p, i) => (
              <div key={i} className="rd-meta-table__row">
                <span className="rd-meta-table__url" title={p.url}>{p.title || p.url}</span>
                <span className={p.hasTitle ? 'rd-check--ok' : 'rd-check--no'}>
                  {p.hasTitle ? '✓' : '✗'}
                </span>
                <span className={p.hasDesc ? 'rd-check--ok' : 'rd-check--no'}>
                  {p.hasDesc ? '✓' : '✗'}
                </span>
                <span className={p.hasOg ? 'rd-check--ok' : 'rd-check--no'}>
                  {p.hasOg ? '✓' : '✗'}
                </span>
                <span className={p.hasCanonical ? 'rd-check--ok' : 'rd-check--no'}>
                  {p.hasCanonical ? '✓' : '✗'}
                </span>
                <span className={p.hasViewport ? 'rd-check--ok' : 'rd-check--no'}>
                  {p.hasViewport ? '✓' : '✗'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detailed Empty Links Panel ── */
function LinksPanel({ report }) {
  const global = report.globalSummary || {};
  const pages = report.pages || [];

  const brokenLinks = global.brokenLinks || [];
  const missingResources = global.missingResources || [];
  const hasAny = brokenLinks.length > 0 || missingResources.length > 0;

  // Also gather per-page empty href links
  const emptyHrefs = pages.flatMap(p =>
    (p.elementsInfo?.emptyLinks || p.emptyLinks || []).map(l => ({ page: p.url, pageTitle: p.title, ...l }))
  );

  return (
    <div className="rd-panel">
      {/* Stats */}
      <div className="rd-stats-row">
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: brokenLinks.length > 0 ? '#ef4444' : '#10b981' }}>
            {brokenLinks.length}
          </span>
          <span className="rd-stat-label">Empty/Bad Links</span>
        </div>
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: missingResources.length > 0 ? '#ef4444' : '#10b981' }}>
            {missingResources.length}
          </span>
          <span className="rd-stat-label">Missing Resources</span>
        </div>
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: emptyHrefs.length > 0 ? '#f59e0b' : '#10b981' }}>
            {emptyHrefs.length}
          </span>
          <span className="rd-stat-label">Empty Hrefs</span>
        </div>
        <div className="rd-stat-box">
          <span className="rd-stat-value" style={{ color: '#06b6d4' }}>
            {global.elementStats?.totalLinks || 0}
          </span>
          <span className="rd-stat-label">Total Links</span>
        </div>
      </div>

      {!hasAny && emptyHrefs.length === 0 ? (
        <div className="rd-empty rd-empty--success" style={{ marginTop: 24 }}>
          ✓ No empty links or missing resources found across all pages!
        </div>
      ) : (
        <>
          {/* Broken / empty links */}
          <div className="rd-section">
            <div className="rd-section__header">
              <span className="rd-section__dot rd-section__dot--red" />
              <h3 className="rd-section__title">Empty / Bad Links ({brokenLinks.length})</h3>
            </div>
            {brokenLinks.length === 0 ? (
              <div className="rd-empty rd-empty--success">✓ No broken link anchors found</div>
            ) : (
              <div className="rd-list">
                {brokenLinks.map((link, i) => (
                  <div key={i} className="rd-list-item rd-list-item--error">
                    <div className="rd-list-item__badge">LINK</div>
                    <div className="rd-list-item__body">
                      <div className="rd-list-item__msg">
                        <strong>"{link.text || '(no text)'}"</strong>
                        {link.href && <> → <code className="rd-code">{link.href}</code></>}
                      </div>
                      <div className="rd-list-item__meta">
                        {link.reason && <span className="rd-list-item__tag">{link.reason}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing resources */}
          <div className="rd-section">
            <div className="rd-section__header">
              <span className="rd-section__dot rd-section__dot--red" />
              <h3 className="rd-section__title">Missing Resources ({missingResources.length})</h3>
            </div>
            {missingResources.length === 0 ? (
              <div className="rd-empty rd-empty--success">✓ No missing resources</div>
            ) : (
              <div className="rd-list">
                {missingResources.map((res, i) => (
                  <div key={i} className="rd-list-item rd-list-item--error">
                    <div className="rd-list-item__badge">
                      {res.type === 'IMAGE' ? 'IMG' : 'RES'}
                    </div>
                    <div className="rd-list-item__body">
                      <div className="rd-list-item__msg">
                        {res.type === 'IMAGE' ? 'Broken Image: ' : 'Failed Request: '}
                        <code className="rd-code">{res.url?.split('/').pop() || res.url}</code>
                      </div>
                      <div className="rd-list-item__meta">
                        {res.status && <span className="rd-list-item__tag">Status {res.status}</span>}
                        {res.url && <span className="rd-list-item__page" title={res.url}>{res.url}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Empty href anchors found per-page */}
          {emptyHrefs.length > 0 && (
            <div className="rd-section">
              <div className="rd-section__header">
                <span className="rd-section__dot rd-section__dot--yellow" />
                <h3 className="rd-section__title">Empty Href Anchors ({emptyHrefs.length})</h3>
              </div>
              <div className="rd-list">
                {emptyHrefs.map((l, i) => (
                  <div key={i} className="rd-list-item rd-list-item--warn">
                    <div className="rd-list-item__badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                      HREF
                    </div>
                    <div className="rd-list-item__body">
                      <div className="rd-list-item__msg">{l.text || l.innerText || '(no text)'}</div>
                      <div className="rd-list-item__meta">
                        <span className="rd-list-item__page">{l.pageTitle || l.page}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function ReportDashboard({ report, onScreenshotClick, pagesTitle, onBack, onNewTest }) {
  const [section, setSection] = useState('pages');
  const { authHeaders } = useAuth();
  const [tier, setTier] = useState('Free');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/profile/info`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTier(data.profile.subscriptionTier || 'Free');
        }
      })
      .catch(() => {});
  }, [authHeaders]);

  const handleExportClick = () => {
    if (tier === 'Free') {
      setNotification({
        icon: '🔒',
        title: 'PDF Export Locked',
        message: 'Free Trial users cannot export or print reports. Please upgrade to a premium plan (Basic, Pro, or Business) to download high-fidelity PDF reports.',
        actionUrl: '#/plans',
        actionText: 'View Plans'
      });
    } else {
      window.print();
    }
  };

  if (!report) return null;
  const pages = report.pages || [];

  // Group sidebar items
  const topItems = SIDEBAR_ITEMS.filter(i => !i.group);
  const analysisItems = SIDEBAR_ITEMS.filter(i => i.group === 'Analysis');

  return (
    <div className="report-dashboard">
      {/* ── Sidebar ── */}
      <aside className="report-dashboard__sidebar">
        {onBack && (
          <button className="report-dashboard__back" onClick={onBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}

        {/* Top items: Pages + Report */}
        <nav className="report-dashboard__nav">
          {topItems.map(item => {
            const count = getBadgeCount(item.key, report);
            const isActive = section === item.key;
            return (
              <button
                key={item.key}
                className={`report-dashboard__nav-item ${isActive ? 'report-dashboard__nav-item--active' : ''}`}
                onClick={() => setSection(item.key)}
              >
                <span className="report-dashboard__nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {count !== null && (
                  <span className={`report-dashboard__nav-badge ${badgeColor(item.key, count)}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Analysis group */}
        <div className="report-dashboard__group-label">Analysis</div>
        <nav className="report-dashboard__nav">
          {analysisItems.map(item => {
            const count = getBadgeCount(item.key, report);
            const isActive = section === item.key;
            return (
              <button
                key={item.key}
                className={`report-dashboard__nav-item ${isActive ? 'report-dashboard__nav-item--active' : ''}`}
                onClick={() => setSection(item.key)}
              >
                <span className="report-dashboard__nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {count !== null && (
                  <span className={`report-dashboard__nav-badge ${badgeColor(item.key, count)}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {onNewTest && (
          <button className="report-dashboard__new" onClick={onNewTest}>
            <svg className="btn-svg-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>New Audit</span>
          </button>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main className="report-dashboard__content">
        
        {tier === 'Free' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(168, 85, 247, 0.08) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.4rem' }}>🎁</span>
              <div>
                <div style={{ fontWeight: 800, color: '#00F0FF', fontSize: '0.9rem' }}>Aapka free trial scan complete hua!</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Aur domains scan karne, tasks limits badhane aur white-label PDF reports download karne ke liye premium plan select karein.
                </div>
              </div>
            </div>
            <a href="#/plans" style={{
              background: 'var(--accent-gradient)',
              color: '#0b0e1a',
              textDecoration: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.8rem',
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

        {/* Pages */}
        {section === 'pages' && (
          pages.length > 0 ? (
            <VirtualPageGrid
              pages={pages}
              onScreenshotClick={onScreenshotClick}
              title={pagesTitle || `Tested Pages (${pages.length})`}
              testDate={report.testDate || report.test_date || report.createdAt}
              fillHeight
            />
          ) : (
            <div className="report-dashboard__empty">No pages were tested.</div>
          )
        )}

        {/* Website Testing Report (overview) */}
        {section === 'report' && (
          <div className="final-report">
            <ReportHeader report={report} tier={tier} onExportClick={handleExportClick} />
            <SuggestedFixes report={report} />
          </div>
        )}

        {/* Error Summary */}
        {section === 'errors' && (
          <div className="rd-content-wrap">
            <div className="rd-content-header">
              <h2 className="rd-content-title">🛑 Error Summary</h2>
              <p className="rd-content-desc">
                Console errors, failed network requests, and missing image resources detected across all tested pages.
              </p>
            </div>
            <ErrorPanel report={report} />
          </div>
        )}

        {/* SEO & Meta Audits */}
        {section === 'seo' && (
          <div className="rd-content-wrap">
            <div className="rd-content-header">
              <h2 className="rd-content-title">🔍 SEO & Meta Audits</h2>
              <p className="rd-content-desc">
                Search engine optimisation issues and per-page meta tag coverage across all tested pages.
              </p>
            </div>
            <SeoPanel report={report} />
          </div>
        )}

        {/* Empty Links */}
        {section === 'links' && (
          <div className="rd-content-wrap">
            <div className="rd-content-header">
              <h2 className="rd-content-title">🔗 Empty Links</h2>
              <p className="rd-content-desc">
                Broken anchors, empty hrefs, and failed resource requests detected across all tested pages.
              </p>
            </div>
            <LinksPanel report={report} />
          </div>
        )}

        {/* AI Issues */}
        {section === 'ai' && (
          <AiIssuesPanel report={report} tier={tier} />
        )}
      </main>

      {/* ── Custom Premium Modal Alert ── */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{notification.icon || '🔒'}</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>{notification.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 30px 0' }}>{notification.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setNotification(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Close
              </button>
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  onClick={() => setNotification(null)}
                  style={{
                    background: 'var(--accent-gradient)',
                    color: '#0b0e1a',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {notification.actionText || 'Upgrade'}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
