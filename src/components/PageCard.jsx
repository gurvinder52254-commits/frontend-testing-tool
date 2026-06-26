import { useState, memo } from 'react';
import GroqTestPanel from './GroqTestPanel';

const BACKEND_BASE = `http://${window.location.hostname}:3001`;

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

const PageCard = memo(function PageCard({ page, onScreenshotClick }) {
  const [expanded, setExpanded] = useState(false);

  const score = page.analysis?.overallScore || page.score || 0;
  const analysis = page.analysis || null;
  const screenshotSrc = page.screenshotUrl
    ? `${BACKEND_BASE}${page.screenshotUrl}`
    : null;
  const loadStatus = page.loadStatus || 'SUCCESS';

  return (
    <div className="page-card">
      <div className="page-card__screenshot-container">
        {screenshotSrc ? (
          <img
            className="page-card__screenshot"
            src={screenshotSrc}
            alt={page.title || page.url}
            onClick={() => onScreenshotClick?.(screenshotSrc)}
            style={{ cursor: 'pointer' }}
            loading="lazy"
          />
        ) : (
          <div className="live-browser__placeholder" style={{ height: '100%' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Score Badge */}
        {score > 0 && (
          <div className={`page-card__score-badge page-card__score-badge--${getScoreClass(score)}`}>
            {score}
          </div>
        )}

        {/* Source Tag */}
        {page.source && (
          <div className="page-card__source-tag">{page.source}</div>
        )}
      </div>

      <div className="page-card__body">
        <div className="page-card__title">{page.title || page.text || 'Untitled Page'}</div>
        <div className="page-card__url">{page.url}</div>

        {/* Metadata section */}
        <div className="page-card__metadata" style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Description</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {page.elementsInfo?.seo?.description || 'No description found'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Keywords</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {page.elementsInfo?.seo?.keywords || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="page-card__stats" style={{ marginTop: 16 }}>
          <div className="page-card__stat">
            <div className="page-card__stat-label">Status</div>
            <div
              className={`page-card__stat-value ${loadStatus === 'SUCCESS'
                ? 'page-card__stat-value--success'
                : 'page-card__stat-value--error'
                }`}
            >
              {loadStatus === 'SUCCESS' ? '✓ OK' : '✗ Failed'}
            </div>
          </div>
          <div className="page-card__stat">
            <div className="page-card__stat-label">AI Score</div>
            <div
              className="page-card__stat-value"
              style={{ color: getScoreFillColor(score) }}
            >
              {score > 0 ? `${score}/100` : 'N/A'}
            </div>
          </div>
          <div className="page-card__stat" style={{ gridColumn: '1 / -1' }}>
            <div className="page-card__stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Elements</div>
            <div className="page-card__stat-value" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: '700', letterSpacing: '0.5px' }}>
                🖼️ {page.elementsInfo?.counts?.images || 0} &nbsp;/&nbsp; 🔗 {page.elementsInfo?.counts?.links || 0} &nbsp;/&nbsp; 🔘 {page.elementsInfo?.counts?.buttons || 0} &nbsp;/&nbsp; 📝 {page.elementsInfo?.counts?.forms || 0}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }} title="Missing Image SRC">❌ Src: <span style={{ color: '#fff', opacity: 0.9 }}>{page.elementsInfo?.counts?.missingSrc || 0}</span></span>
                <span style={{ color: '#06b6d4', fontWeight: 'bold' }} title="Missing Image ALT">🖼️ Alt: <span style={{ color: '#fff', opacity: 0.9 }}>{page.elementsInfo?.counts?.missingAlt || 0}</span></span>
                <span style={{ color: '#a855f7', fontWeight: 'bold' }} title="Duplicate Image URLs">♊ Img Dup: <span style={{ color: '#fff', opacity: 0.9 }}>{page.elementsInfo?.counts?.duplicateImages || 0}</span></span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }} title="Duplicate Link URLs">🔗 Link Dup: <span style={{ color: '#fff', opacity: 0.9 }}>{page.elementsInfo?.counts?.duplicateLinks || 0}</span></span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }} title="Total Links Listed">🔗 Total Links: <span style={{ color: '#fff', opacity: 0.9 }}>{page.brokenLinksCheck?.length || 0}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Image Buttons Section */}
        {page.elementsInfo?.buttons?.filter(b => b.isImageButton).length > 0 && (
          <div className="page-card__section" style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>🖼️ Image Content Buttons</div>
            <div className="page-card__scroll-list" style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {page.elementsInfo.buttons.filter(b => b.isImageButton).map((btn, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                    {btn.text}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '50%' }}>
                    <span style={{ color: btn.working?.includes('Yes') ? 'var(--success)' : (btn.working?.includes('No') ? 'var(--error)' : 'var(--warning)'), fontWeight: 700 }}>
                      {btn.working}
                    </span>
                    {btn.reason && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>{btn.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Buttons Section */}
        {page.elementsInfo?.buttons?.filter(b => !b.isImageButton).length > 0 && (
          <div className="page-card__section" style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase' }}>🔘 Interactive Buttons</div>
            <div className="page-card__scroll-list" style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {page.elementsInfo.buttons.filter(b => !b.isImageButton).map((btn, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                    {btn.text}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '50%' }}>
                    <span style={{ color: btn.working?.includes('Yes') ? 'var(--success)' : (btn.working?.includes('No') ? 'var(--error)' : 'var(--warning)'), fontWeight: 700 }}>
                      {btn.working}
                    </span>
                    {btn.reason && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>{btn.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Page Links (Replaced Broken Links checker) */}
        {page.brokenLinksCheck?.length > 0 && (
          <div className="page-card__section" style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>
              🔗 All Page Links ({page.brokenLinksCheck.length} listed)
            </div>
            <div className="page-card__scroll-list" style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {page.brokenLinksCheck.map((link, idx) => {
                const isDup = link.isDuplicate || link.reason === 'Duplicate Link';
                const statusColor = link.status === 200 ? (isDup ? '#8b5cf6' : '#10b981')
                  : link.status === 0 ? '#6b7280'
                    : link.status >= 500 ? '#ef4444'
                      : link.status === 404 ? '#ef4444'
                        : link.status >= 400 ? '#f59e0b'
                          : '#3b82f6';
                const displayUrl = link.href.length > 55 ? link.href.substring(0, 52) + '...' : link.href;

                return (
                  <div key={idx} title={link.href} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 8px', background: isDup ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.06)',
                    borderRadius: '4px', fontSize: '0.65rem', gap: '8px',
                    borderLeft: `3px solid ${statusColor}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.text || 'No Text Found'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {displayUrl}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                        fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                        background: statusColor, minWidth: '36px', textAlign: 'center'
                      }}>
                        {link.status === 200 ? (isDup ? 'DUP' : 'OK') : (link.status || 'ERR')}
                      </span>
                      <span style={{ fontSize: '0.55rem', color: isDup ? '#c084fc' : 'var(--text-muted)', marginTop: '2px', fontWeight: isDup ? 600 : 400 }}>
                        {link.reason}
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
          <div className="page-card__section" style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', marginBottom: 10, textTransform: 'uppercase' }}>
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
                      fontSize: '0.6rem', fontWeight: 700, color: '#fff',
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
                    borderRadius: '8px', padding: '10px 12px',
                  }}>
                    {/* Form Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>
                          {form.isDivForm ? '📦' : '📝'} {form.isDivForm ? 'Div Section' : 'Form'}: {form.formId}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                          {form.isDivForm ? 'DIV' : form.method} • {form.totalFields} fields
                        </span>
                        {form.isDivForm && (
                          <span style={{ fontSize: '0.55rem', color: '#06b6d4', background: 'rgba(6,182,212,0.15)', padding: '1px 5px', borderRadius: '3px', marginLeft: 6, fontWeight: 600 }}>
                            DIV-BASED
                          </span>
                        )}
                      </div>
                      {form.hasSubmitButton && (
                        <span style={{ fontSize: '0.6rem', color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                          🔘 {form.submitButtonText}
                        </span>
                      )}
                    </div>

                    {/* Empty Submit Test */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: 6, fontSize: '0.68rem'
                    }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>🚫 Empty Submit Test</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getStatusBadge(form.invalidSubmitTest?.status)}
                      </div>
                    </div>

                    {/* Empty Submit Result Detail */}
                    {form.invalidSubmitTest?.result && (
                      <div style={{ maxHeight: '80px', overflowY: 'auto', marginBottom: 8, paddingLeft: 8 }}>
                        <div style={{ fontSize: '0.6rem', color: '#fbbf24', padding: '2px 0', display: 'flex', gap: 4 }}>
                          <span style={{ color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>⚠ Result:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{form.invalidSubmitTest.result}</span>
                        </div>
                      </div>
                    )}

                    {/* Per-Field Tests */}
                    {form.fieldTests?.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                          Field Validation Tests
                        </div>
                        {/* Table Header */}
                        <div style={{
                          display: 'grid', gridTemplateColumns: '2fr 55px 50px 50px 50px',
                          gap: '4px', padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
                          borderRadius: '4px 4px 0 0', fontSize: '0.55rem', fontWeight: 700,
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
                              gap: '4px', padding: '5px 8px', fontSize: '0.63rem',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              background: ftIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                                {ft.label || ft.name}
                              </span>
                              <span style={{ textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block', padding: '1px 4px', borderRadius: '3px',
                                  fontSize: '0.55rem', fontWeight: 600, color: '#a78bfa',
                                  background: 'rgba(167,139,250,0.1)', textTransform: 'lowercase'
                                }}>
                                  {ft.type}
                                </span>
                              </span>
                              <span style={{ textAlign: 'center', fontSize: '0.6rem', color: ft.required ? '#f59e0b' : '#6b7280' }}>
                                {ft.required ? 'Yes' : 'No'}
                              </span>
                              <span style={{ textAlign: 'center' }}>{getStatusBadge(ft.invalidTest?.status)}</span>
                              <span style={{ textAlign: 'center' }}>{getStatusBadge(ft.validTest?.status)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valid Submit Test */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.68rem'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>✅ Valid Submit Test</span>
                        {form.validSubmitTest?.result && (
                          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {form.validSubmitTest.result}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {form.validSubmitTest?.apiStatus && (
                          <span style={{ fontSize: '0.55rem', color: form.validSubmitTest.apiStatus < 400 ? '#10b981' : '#ef4444' }}>
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

        {/* Broken Elements / Errors */}
        {((page.elementsInfo?.badImages?.length > 0) ||
          (page.elementsInfo?.broken?.links?.length > 0) ||
          (page.consoleErrors?.length > 0) ||
          (page.networkErrors?.length > 0)) && (
            <div className="page-card__section" style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase' }}>⚠️ Quality Audit / Errors</div>
              <div className="page-card__scroll-list" style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Console Errors */}
                {page.consoleErrors?.map((err, idx) => (
                  <div key={`err-${idx}`} style={{ fontSize: '0.65rem', color: '#ef4444', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                    🚫 Console Error: {err.text || err.message || err}
                  </div>
                ))}

                {/* Network Errors */}
                {page.networkErrors?.map((err, idx) => (
                  <div key={`net-${idx}`} style={{ fontSize: '0.65rem', color: '#f59e0b', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px' }}>
                    🌐 {err.type === 'HTTP_ERROR' ? `HTTP ${err.status}: ${err.statusText}` : `Network: ${err.errorText}`}
                  </div>
                ))}

                {/* Bad Images (Missing Alt, Missing Src, Broken) */}
                {/*   {page.elementsInfo?.badImages?.map((img, idx) => (
                  <div key={`bad-img-${idx}`} style={{ fontSize: '0.65rem', color: '#06b6d4', padding: '4px 8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {img.issue === 'Missing ALT' ? '🖼️ Missing ALT' : (img.issue === 'Missing SRC' ? '❌ Missing SRC' : '💔 Broken Image')}: 
                      <code style={{ fontSize: '0.6rem', marginLeft: 4 }}>{img.src?.split('/').pop() || 'index: ' + img.index}</code>
                    </span>
                    <span style={{ opacity: 0.7 }}>alt: {img.alt}</span>
                  </div>
                ))} */}

                {/* Broken Links */}
                {/* {page.elementsInfo?.broken?.links?.map((link, idx) => (
                <div key={`link-${idx}`} style={{ fontSize: '0.65rem', color: '#ef4444', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                  🔗 Broken Link: {link.text} ({link.href})
                </div>
              ))} */}
              </div>
            </div>
          )}

        {/* Network Activity Section */}
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
              document: '#3b82f6', stylesheet: '#a855f7', script: '#f59e0b',
              image: '#10b981', font: '#ec4899', xhr: '#06b6d4',
              fetch: '#06b6d4', media: '#f97316', other: '#6b7280',
            };
            return map[type] || '#6b7280';
          };

          return (
            <div className="page-card__section" style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#06b6d4', marginBottom: 10, textTransform: 'uppercase' }}>
                🌐 Network Activity
              </div>

              {/* Summary Stats Bar */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 12,
                padding: '10px 12px', background: 'rgba(6, 182, 212, 0.06)',
                borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)'
              }}>
                <div style={{ flex: '1 1 auto', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Requests</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#06b6d4' }}>{summary.totalRequests}</div>
                </div>
                <div style={{ flex: '1 1 auto', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Transferred</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#a855f7' }}>{formatSize(summary.totalTransferred)}</div>
                </div>
                <div style={{ flex: '1 1 auto', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>DOMContent</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6' }}>{formatTime(summary.domContentLoaded)}</div>
                </div>
                <div style={{ flex: '1 1 auto', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Load</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>{formatTime(summary.loadTime)}</div>
                </div>
                <div style={{ flex: '1 1 auto', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Finish</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>{formatTime(summary.finishTime)}</div>
                </div>
              </div>

              {/* Request Table Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 50px 65px 60px 55px',
                gap: '4px', padding: '6px 8px', background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px 6px 0 0', fontSize: '0.6rem', fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                <span>Name</span>
                <span style={{ textAlign: 'center' }}>Status</span>
                <span style={{ textAlign: 'center' }}>Type</span>
                <span style={{ textAlign: 'right' }}>Size</span>
                <span style={{ textAlign: 'right' }}>Time</span>
              </div>

              {/* Request Rows */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {net.requests.map((req, idx) => (
                  <div key={idx} title={req.url} style={{
                    display: 'grid', gridTemplateColumns: '2fr 50px 65px 60px 55px',
                    gap: '4px', padding: '5px 8px', fontSize: '0.65rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                      {req.name || '—'}
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: '3px', fontSize: '0.6rem', fontWeight: 700,
                        color: '#fff', background: getStatusColor(req.status), minWidth: '28px', textAlign: 'center'
                      }}>
                        {req.status || '—'}
                      </span>
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '1px 5px', borderRadius: '3px', fontSize: '0.55rem', fontWeight: 600,
                        color: getTypeColor(req.type), background: `${getTypeColor(req.type)}15`, textTransform: 'lowercase'
                      }}>
                        {req.type || '—'}
                      </span>
                    </span>
                    <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatSize(req.size)}
                    </span>
                    <span style={{ textAlign: 'right', color: req.time > 1000 ? '#f59e0b' : 'var(--text-muted)' }}>
                      {formatTime(req.time)}
                    </span>
                  </div>
                ))}
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
                {/* AI sections (UI Design, Structure, etc.) */}
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

                {/* Structure, Content, Layout, Summary... */}
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
  );
});

export default PageCard;
