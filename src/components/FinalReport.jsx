// FinalReport is split into reusable exported sections so both the classic
// full report AND the new ReportDashboard (sidebar + tabs) can compose them
// without duplicating markup.

export function getGrade(s) {
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B';
  if (s >= 60) return 'C';
  if (s >= 50) return 'D';
  return 'F';
}

export function getScoreClass(s) {
  if (s >= 80) return 'excellent';
  if (s >= 60) return 'good';
  if (s >= 40) return 'fair';
  return 'poor';
}

function countConsole(pages) {
  return pages.reduce((sum, p) => sum + (p.consoleErrors?.length || 0), 0);
}
function countNetwork(pages) {
  return pages.reduce((sum, p) => sum + (p.networkErrors?.length || 0), 0);
}

/* ============================================================
 * Header: big score, grade, url, date, meta stats (Image 2 top)
 * ============================================================ */
export function ReportHeader({ report }) {
  const score = report.overallScore || 0;
  const pages = report.pages || [];
  const global = report.globalSummary || {};
  const duration = report.testDurationMs ? (report.testDurationMs / 1000).toFixed(1) : '?';
  const totalErrors = countConsole(pages) + countNetwork(pages);

  return (
    <div className="final-report__header">
      <div className={`final-report__big-score final-report__big-score--${getScoreClass(score)}`}>
        {score}
        <span className="final-report__big-score-label">/ 100</span>
      </div>

      <h2 className="final-report__title">
        Website Testing Report — Grade: {getGrade(score)}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <p className="final-report__url" style={{ margin: 0 }}>{report.frontendUrl}</p>
        <div style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)',
          padding: '4px 12px',
          borderRadius: '12px',
          fontFamily: 'monospace'
        }}>
          🕒 {report.testDate ? new Date(report.testDate).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }) : 'Date Unknown'}
        </div>
      </div>

      <div className="final-report__meta">
        <div className="final-report__meta-item">
          <div className="final-report__meta-value">{report.totalPages}</div>
          <div className="final-report__meta-label">Pages Tested</div>
        </div>
        <div className="final-report__meta-item">
          <div className="final-report__meta-value">{duration}s</div>
          <div className="final-report__meta-label">Duration</div>
        </div>
        <div className="final-report__meta-item">
          <div className="final-report__meta-value">{totalErrors}</div>
          <div className="final-report__meta-label">Total Errors</div>
        </div>
        <div className="final-report__meta-item">
          <div className="final-report__meta-value">{global.elementStats?.totalLinks || 0}</div>
          <div className="final-report__meta-label">Total Links</div>
        </div>
        <div className="final-report__meta-item">
          <div className="final-report__meta-value">{global.elementStats?.totalImages || 0}</div>
          <div className="final-report__meta-label">Total Images</div>
        </div>
        <div className="final-report__meta-item">
          <div className="final-report__meta-value">{global.elementStats?.totalButtons || 0}</div>
          <div className="final-report__meta-label">Total Buttons</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Suggested Fixes & Recommendations (Image 2 bottom)
 * ============================================================ */
export function SuggestedFixes({ report }) {
  const global = report.globalSummary || {};
  if (!global.suggestedFixes?.length) return null;
  return (
    <section className="final-report__fixes-section">
      <div className="final-report__summary-card final-report__summary-card--critical">
        <div className="final-report__summary-card-title">
          💡 Suggested Fixes & Recommendations
        </div>
        <ul className="final-report__summary-list">
          {global.suggestedFixes.map((fix, idx) => (
            <li key={idx}>
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>•</span> {fix}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================
 * Error Summary card (tab 1)
 * ============================================================ */
export function ErrorSummaryCard({ report }) {
  const pages = report.pages || [];
  const global = report.globalSummary || {};
  const totalConsoleErrors = countConsole(pages);
  const totalNetworkErrors = countNetwork(pages);

  return (
    <div className="final-report__summary-card">
      <div className="final-report__summary-card-title">🛑 Error Summary</div>
      <div className="final-report__stats-subgrid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="final-report__stat-box">
          <span className="final-report__stat-value" style={{ color: '#ef4444' }}>{totalConsoleErrors}</span>
          <span className="final-report__stat-label">Console Errors</span>
        </div>
        <div className="final-report__stat-box">
          <span className="final-report__stat-value" style={{ color: '#f59e0b' }}>{totalNetworkErrors}</span>
          <span className="final-report__stat-label">Network Issues</span>
        </div>
        <div className="final-report__stat-box">
          <span className="final-report__stat-value" style={{ color: '#ec4899' }}>{global.brokenLinks?.length || 0}</span>
          <span className="final-report__stat-label">Empty Links</span>
        </div>
        <div className="final-report__stat-box">
          <span className="final-report__stat-value" style={{ color: '#06b6d4' }}>{global.elementStats?.totalMissingAlt || 0}</span>
          <span className="final-report__stat-label">Missing Alt</span>
        </div>
        <div className="final-report__stat-box">
          <span className="final-report__stat-value" style={{ color: '#f59e0b' }}>{global.elementStats?.totalMissingSrc || 0}</span>
          <span className="final-report__stat-label">Missing Src</span>
        </div>
        <div className="final-report__stat-box">
          <span className="final-report__stat-value" style={{ color: '#a855f7' }}>{global.elementStats?.totalDuplicateImages || 0}</span>
          <span className="final-report__stat-label">Duplicate Img</span>
        </div>
      </div>
      {totalConsoleErrors > 0 && (
        <div className="final-report__error-preview">
          <small>Last detected console error:</small>
          <code>{pages.find(p => p.consoleErrors?.length > 0)?.consoleErrors[0]?.text || 'See page details'}</code>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * SEO & Meta Audit card (tab 2)
 * ============================================================ */
export function SeoAuditCard({ report }) {
  const global = report.globalSummary || {};
  return (
    <div className="final-report__summary-card">
      <div className="final-report__summary-card-title">
        🔍 SEO & Meta Audit ({global.seoIssues?.length || 0})
      </div>
      {global.seoIssues?.length > 0 ? (
        <div className="final-report__scroll-area">
          <ul className="final-report__summary-list">
            {global.seoIssues.map((issue, i) => (
              <li key={i}>
                <span style={{ color: '#f59e0b' }}>⚠</span> {issue.issue}
                {issue.url ? <span style={{ color: 'var(--text-muted)' }}> — {issue.url}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ color: '#10b981', fontSize: '14px' }}>✓ All major SEO tags are present!</p>
      )}
    </div>
  );
}

/* ============================================================
 * Empty Links & Missing Resources card (tab 3)
 * ============================================================ */
export function EmptyLinksCard({ report }) {
  const global = report.globalSummary || {};
  const hasAny = (global.brokenLinks?.length > 0) || (global.missingResources?.length > 0);
  return (
    <div className="final-report__summary-card">
      <div className="final-report__summary-card-title">🔗 Empty Links & Missing Resources</div>
      {hasAny ? (
        <div className="final-report__scroll-area">
          <ul className="final-report__summary-list">
            {global.brokenLinks?.map((link, i) => (
              <li key={`link-${i}`}>
                <span style={{ color: '#ef4444' }}>✗</span> <strong>Empty/Bad Link:</strong> "{link.text}" at {link.href} ({link.reason})
              </li>
            ))}
            {global.missingResources?.map((res, i) => (
              <li key={`res-${i}`}>
                <span style={{ color: '#ef4444' }}>✗</span> <strong>{res.type === 'IMAGE' ? 'Broken Image' : 'Failed Request'}:</strong> {res.url.split('/').pop()} {res.status ? `- Status ${res.status}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ color: '#10b981', fontSize: '14px' }}>✓ No empty links or missing resources found!</p>
      )}
    </div>
  );
}

/* ============================================================
 * Page-by-Page Quality Check table
 * ============================================================ */
export function PagesTable({ report }) {
  const pages = report.pages || [];
  if (pages.length === 0) return null;
  return (
    <div className="final-report__summary-card" style={{ marginBottom: 32 }}>
      <div className="final-report__summary-card-title">📄 Page-by-Page Quality Check</div>
      <div className="final-report__table-container">
        <table className="final-report__table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Page</th>
              <th>Elements (IMG/LNK/BTN)</th>
              <th>Errors</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p, i) => (
              <tr key={i}>
                <td className={`status--${(p.loadStatus || 'unknown').toLowerCase()}`}>
                  {p.loadStatus === 'SUCCESS' ? '✓' : '✗'}
                </td>
                <td>
                  <div className="page-title">{p.title || 'No Title'}</div>
                  <div className="page-url">{p.url}</div>
                </td>
                <td>
                  {p.elementsInfo?.counts?.images || 0} / {p.elementsInfo?.counts?.links || 0} / {p.elementsInfo?.counts?.buttons || 0}
                </td>
                <td style={{ color: ((p.consoleErrors?.length || 0) + (p.networkErrors?.length || 0)) > 0 ? '#ef4444' : 'inherit' }}>
                  {(p.consoleErrors?.length || 0) + (p.networkErrors?.length || 0)}
                </td>
                <td className={`score--${getScoreClass(p.aiAnalysis?.overallScore || 0)}`}>
                  {p.aiAnalysis?.overallScore || 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
 * Default: classic full report (composes the sections)
 * ============================================================ */
export default function FinalReport({ report, onNewTest }) {
  if (!report) return null;
  const global = report.globalSummary || {};
  const showEmptyLinks = (global.brokenLinks?.length > 0) || (global.missingResources?.length > 0);

  return (
    <div className="final-report">
      <ReportHeader report={report} />
      <SuggestedFixes report={report} />

      <div className="final-report__summary-grid">
        <ErrorSummaryCard report={report} />
        <SeoAuditCard report={report} />
        {showEmptyLinks && (
          <div style={{ gridColumn: 'span 2' }}>
            <EmptyLinksCard report={report} />
          </div>
        )}
      </div>

      <PagesTable report={report} />

      {onNewTest && (
        <button className="new-test-btn" onClick={onNewTest}>
          🔄 Start New Audit
        </button>
      )}
    </div>
  );
}
