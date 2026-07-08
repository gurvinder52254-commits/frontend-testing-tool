import { useState } from 'react';
import VirtualPageGrid from './VirtualPageGrid';
import {
  ReportHeader,
  SuggestedFixes,
  ErrorSummaryCard,
  SeoAuditCard,
  EmptyLinksCard,
} from './FinalReport';

/**
 * Dashboard layout for a completed report:
 *  - persistent left sidebar with tab-based navigation
 *  - main content area shows ONLY the selected sidebar item
 *
 * Sidebar items:
 *  - "Pages"                 → the tested pages (reuses VirtualPageGrid / PageCard)
 *  - "Website Testing Report"→ score header + suggested fixes, with inner tabs:
 *                              Error Summary · SEO & Meta Audits · Empty Links
 *
 * All content is composed from existing components — nothing is duplicated.
 */

const SIDEBAR_ITEMS = [
  { key: 'pages', label: 'Pages', icon: '📄' },
  { key: 'report', label: 'Website Testing Report', icon: '📊' },
];

const REPORT_TABS = [
  { key: 'errors', label: 'Error Summary' },
  { key: 'seo', label: 'SEO & Meta Audits' },
  { key: 'links', label: 'Empty Links' },
];

export default function ReportDashboard({ report, onScreenshotClick, pagesTitle, onBack, onNewTest }) {
  const [section, setSection] = useState('pages');
  const [reportTab, setReportTab] = useState('errors');

  if (!report) return null;
  const pages = report.pages || [];

  return (
    <div className="report-dashboard">
      {/* ---------- Sidebar ---------- */}
      <aside className="report-dashboard__sidebar">
        {onBack && (
          <button className="report-dashboard__back" onClick={onBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}

        <nav className="report-dashboard__nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`report-dashboard__nav-item ${section === item.key ? 'report-dashboard__nav-item--active' : ''}`}
              onClick={() => setSection(item.key)}
            >
              <span className="report-dashboard__nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.key === 'pages' && pages.length > 0 && (
                <span className="report-dashboard__nav-badge">{pages.length}</span>
              )}
            </button>
          ))}
        </nav>

        {onNewTest && (
          <button className="report-dashboard__new" onClick={onNewTest}>
            🔄 New Audit
          </button>
        )}
      </aside>

      {/* ---------- Main content ---------- */}
      <main className="report-dashboard__content">
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

        {section === 'report' && (
          <div className="final-report">
            <ReportHeader report={report} />
            <SuggestedFixes report={report} />

            {/* Inner tabs */}
            <div className="report-dashboard__tabs" role="tablist">
              {REPORT_TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={reportTab === t.key}
                  className={`report-dashboard__tab ${reportTab === t.key ? 'report-dashboard__tab--active' : ''}`}
                  onClick={() => setReportTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="report-dashboard__tab-panel">
              {reportTab === 'errors' && <ErrorSummaryCard report={report} />}
              {reportTab === 'seo' && <SeoAuditCard report={report} />}
              {reportTab === 'links' && <EmptyLinksCard report={report} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
