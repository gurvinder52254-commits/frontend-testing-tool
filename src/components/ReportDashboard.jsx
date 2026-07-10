import { useState } from 'react';
import VirtualPageGrid from './VirtualPageGrid';
import AiIssuesPanel from './AiIssuesPanel';
import {
  ReportHeader,
  SuggestedFixes,
} from './FinalReport';


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
    icon: '📄',
    group: null,
  },
  {
    key: 'report',
    label: 'Website Testing Report',
    icon: '📊',
    group: null,
  },
  {
    key: 'errors',
    label: 'Error Summary',
    icon: '🛑',
    group: 'Analysis',
  },
  {
    key: 'seo',
    label: 'SEO & Meta Audits',
    icon: '🔍',
    group: 'Analysis',
  },
  {
    key: 'links',
    label: 'Empty Links',
    icon: '🔗',
    group: 'Analysis',
  },
  {
    key: 'ai',
    label: 'AI Issues',
    icon: '🤖',
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
            🔄 New Audit
          </button>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main className="report-dashboard__content">

        {/* Pages */}
        {section === 'pages' && (
          pages.length > 0 ? (
            <VirtualPageGrid
              pages={pages}
              onScreenshotClick={onScreenshotClick}
              title={pagesTitle || `Tested Pages (${pages.length})`}
              fillHeight
            />
          ) : (
            <div className="report-dashboard__empty">No pages were tested.</div>
          )
        )}

        {/* Website Testing Report (overview) */}
        {section === 'report' && (
          <div className="final-report">
            <ReportHeader report={report} />
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
          <AiIssuesPanel report={report} />
        )}
      </main>

    </div>
  );
}
