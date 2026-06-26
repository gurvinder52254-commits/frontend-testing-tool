import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import TestForm from './components/TestForm';
import TestingDashboard from './components/TestingDashboard';
import PageCard from './components/PageCard';
import FinalReport from './components/FinalReport';
import ReportsPage from './components/ReportsPage';
import Header from './components/Header';
import Test from './test';
import DynamicForm from './components/DynamicForm';

const WS_URL = `ws://${window.location.hostname}:3001/ws`;
const API_URL = `http://${window.location.hostname}:3001/api`;

// Memoized Dashboard to prevent unnecessary re-renders
const MemoizedDashboard = memo(TestingDashboard);

function App() {
  const [status, setStatus] = useState('idle'); // idle | connecting | testing | complete | error
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | reports | project-detail
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const isTestPage = window.location.pathname === '/test';

  const [testConfig, setTestConfig] = useState(null);
  const [showUserDetailsForm, setShowUserDetailsForm] = useState(false);

  const [wsConnected, setWsConnected] = useState(false);
  const [testId, setTestId] = useState(null);
  const [frontendUrl, setFrontendUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [statusLogs, setStatusLogs] = useState([]);
  const [liveScreenshot, setLiveScreenshot] = useState(null);
  const [liveUrl, setLiveUrl] = useState('');
  const [completedPages, setCompletedPages] = useState([]);
  const [finalReport, setFinalReport] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [statusLogs]);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      console.log('✅ WebSocket connected');
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('🔌 WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWSMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };
  }, []);

  const addLog = useCallback((message, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setStatusLogs((prev) => {
      const newLogs = [...prev, { message, type, time }];
      return newLogs.slice(-100);
    });
  }, []);

  const testIdRef = useRef(null);

  const handleWSMessage = useCallback((data) => {
    if (data.type === 'connected') {
      addLog('Connected to testing server', 'success');
      return;
    }

    if (data.testId && testIdRef.current && data.testId !== testIdRef.current) {
      return;
    }

    switch (data.type) {
      case 'status':
        addLog(data.message, 'info');
        break;

      case 'links-discovered':
        setTotalPages(data.totalPages);
        addLog(
          `Discovered ${data.totalPages} pages (${data.headerLinks} header, ${data.footerLinks} footer)`,
          'success'
        );
        break;

      case 'page-start':
        setProgress(data.progress || 0);
        setLiveUrl(data.url);
        addLog(`Testing page ${data.pageIndex + 1}/${data.totalPages}: ${data.text || data.url}`, 'info');
        break;

      case 'live-screenshot':
        setLiveScreenshot(`data:image/png;base64,${data.image}`);
        setLiveUrl(data.url);
        break;

      case 'screenshot-taken':
        addLog(`📸 Screenshot captured: ${data.url}`, 'success');
        break;

      case 'ai-analyzing':
        addLog(`🤖 AI analyzing page ${data.pageIndex + 1}...`, 'ai');
        break;

      case 'ai-complete':
        addLog(`✅ AI analysis complete for page ${data.pageIndex + 1}`, 'success');
        break;

      case 'page-complete':
        setPagesCompleted((prev) => prev + 1);
        setProgress(data.progress || 0);
        setCompletedPages((prev) => {
          const existing = prev.findIndex((p) => p.url === data.result.url || p.pageIndex === data.pageIndex);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updated[existing], ...data.result, pageIndex: data.pageIndex };
            return updated;
          }
          return [...prev, { ...data.result, pageIndex: data.pageIndex }];
        });
        break;

      case 'page-error':
        addLog(`❌ Error on page ${data.pageIndex + 1}: ${data.error}`, 'error');
        break;

      case 'test-complete':
        setStatus('complete');
        setProgress(100);
        setFinalReport(data.report);
        addLog('🎉 Testing complete!', 'success');
        break;

      case 'test-error':
        setStatus('error');
        addLog(`❌ Test failed: ${data.error}`, 'error');
        break;

      case 'groq-status':
        addLog(data.message, 'ai');
        break;

      case 'groq-element-analysis':
      case 'groq-test-suggestions':
      case 'groq-code-generated':
      case 'groq-test-execution-start':
      case 'groq-test-count':
      case 'groq-test-running':
      case 'groq-test-execution-complete':
      case 'groq-analysis-complete':
        if (data.message) {
          addLog(data.message, 'success');
        }
        break;

      case 'groq-test-result':
        if (data.status === 'failed') {
          addLog(data.message, 'error');
        } else {
          addLog(data.message, 'success');
        }
        break;

      case 'groq-analysis-error':
        addLog(data.message, 'error');
        break;

      default:
        break;
    }
  }, [addLog]);

  const handleStartTestClick = (fUrl, bUrl, scanType) => {
    setTestConfig({ fUrl, bUrl, scanType });
    setShowUserDetailsForm(true);
  };

  const handleStartTest = async (userDetails = null) => {
    setShowUserDetailsForm(false);
    if (!testConfig) return;

    const { fUrl, bUrl, scanType } = testConfig;

    setStatus('testing');
    setFrontendUrl(fUrl);
    setProgress(0);
    setTotalPages(0);
    setPagesCompleted(0);
    setStatusLogs([]);
    setLiveScreenshot(null);
    setLiveUrl('');
    setCompletedPages([]);
    setFinalReport(null);
    testIdRef.current = null;

    addLog(`Starting test for: ${fUrl}`, 'info');

    try {
      const res = await fetch(`${API_URL}/start-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontendUrl: fUrl, backendUrl: bUrl || undefined, scanType, userDetails }),
      });
      const data = await res.json();

      if (data.success) {
        setTestId(data.testId);
        testIdRef.current = data.testId;
      } else {
        setStatus('error');
        addLog(`Failed to start test: ${data.error}`, 'error');
      }
    } catch (err) {
      setStatus('error');
      addLog(`Connection error: ${err.message}`, 'error');
    }
  };

  const handleNewTest = useCallback(() => {
    setStatus('idle');
    setActiveView('dashboard');
    setSelectedReport(null);
    setTestId(null);
    setProgress(0);
    setTotalPages(0);
    setPagesCompleted(0);
    setStatusLogs([]);
    setLiveScreenshot(null);
    setLiveUrl('');
    setCompletedPages([]);
    setFinalReport(null);
  }, []);

  const handleScreenshotClick = useCallback((url) => {
    setModalImage(url);
  }, []);

  // Navigation handler
  const handleNavigate = useCallback((view) => {
    if (view === 'dashboard') {
      setActiveView('dashboard');
      setSelectedReport(null);
    } else if (view === 'reports') {
      setActiveView('reports');
      setSelectedReport(null);
    }
  }, []);

  // Select a project from reports to view its dashboard
  const handleSelectProject = useCallback(async (testId) => {
    try {
      setLoadingReport(true);
      const res = await fetch(`${API_URL}/reports/${testId}`);
      const data = await res.json();
      if (data.success && data.report) {
        setSelectedReport(data.report);
        setActiveView('project-detail');
      } else {
        console.error('Failed to load report:', data.error);
      }
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  // Memoize results grid
  const resultsGrid = useMemo(() => {
    if (completedPages.length === 0) return null;
    return (
      <section className="results">
        <h2 className="results__title">
          📄 Tested Pages ({completedPages.length}/{totalPages || '?'})
        </h2>
        <div className="results__grid">
          {completedPages.map((page, idx) => (
            <PageCard
              key={page.url || idx}
              page={page}
              onScreenshotClick={handleScreenshotClick}
            />
          ))}
        </div>
      </section>
    );
  }, [completedPages, totalPages, handleScreenshotClick]);

  if (isTestPage) {
    return <Test />;
  }

  return (
    <div className="app">
      {/* Animated Background Orbs */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="bg-orb bg-orb--1"></div>
        <div className="bg-orb bg-orb--2"></div>
        <div className="bg-orb bg-orb--3"></div>
      </div>

      <Header status={status} wsConnected={wsConnected} activeView={activeView} onNavigate={handleNavigate} />

      {/* === REPORTS VIEW === */}
      {activeView === 'reports' && (
        <ReportsPage onSelectProject={handleSelectProject} />
      )}

      {/* === PROJECT DETAIL VIEW (from reports) === */}
      {activeView === 'project-detail' && loadingReport && (
        <div className="reports-page__loading" style={{ marginTop: '80px' }}>
          <div className="reports-page__spinner"></div>
          <span>Loading project report...</span>
        </div>
      )}

      {activeView === 'project-detail' && !loadingReport && selectedReport && (
        <div>
          <button className="reports-back-btn" onClick={() => handleNavigate('reports')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Reports
          </button>

          {selectedReport.pages && selectedReport.pages.length > 0 && (
            <section className="results">
              <h2 className="results__title">
                📄 Tested Pages [{selectedReport.pages.length}]
              </h2>
              <div className="results__grid">
                {selectedReport.pages.map((page, idx) => (
                  <PageCard
                    key={page.url || idx}
                    page={page}
                    onScreenshotClick={handleScreenshotClick}
                  />
                ))}
              </div>
            </section>
          )}

          <FinalReport report={selectedReport} onNewTest={() => handleNavigate('reports')} />
        </div>
      )}

      {/* === DASHBOARD VIEW (default) === */}
      {activeView === 'dashboard' && status === 'idle' && (
        <div className="hero-section">
          {/* Hero Content */}
          <section className="hero">
            <div className="hero__badge">
              <span className="hero__badge-dot"></span>
              <span className="hero__badge-text">System Status: Active</span>
            </div>

            <h1 className="hero__title">
              AI-Powered Testing<br />
              <span className="hero__title-gradient">for Your Websites.</span>
            </h1>
            <p className="hero__desc">
              Automatically crawl, screenshot, and analyze every page of your website with AI-powered quality scoring, SEO audits, and detailed performance reports.
            </p>

            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-value">50+</span>
                <span className="hero__stat-label">Test Checks</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-value">AI</span>
                <span className="hero__stat-label">Analysis</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-value">∞</span>
                <span className="hero__stat-label">Pages</span>
              </div>
            </div>
          </section>

          {/* Test Form */}
          <TestForm onSubmit={handleStartTestClick} disabled={!wsConnected} />

          {/* Core Node Hierarchy */}
          <section className="nodes-section">
            <div className="nodes-section__header">
              <h2 className="nodes-section__title">How It Works</h2>
              <p className="nodes-section__desc">Three powerful steps to comprehensive website testing.</p>
            </div>
            <div className="features">
              <div className="feature-card feature-card--primary">
                <div className="feature-card__orb">
                  <div className="feature-card__orb-glow feature-card__orb-glow--primary"></div>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="feature-card__orb-icon feature-card__orb-icon--primary">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <div className="feature-card__orbit feature-card__orbit--primary">
                    <div className="feature-card__particle feature-card__particle--primary"></div>
                  </div>
                </div>
                <h3 className="feature-card__title">Deep Page Scan</h3>
                <p className="feature-card__desc">Crawls every link in your header & footer, tests each page individually with full screenshot capture.</p>
                <div className="feature-card__bar">
                  <div className="feature-card__bar-fill feature-card__bar-fill--primary" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="feature-card feature-card--secondary">
                <div className="feature-card__orb">
                  <div className="feature-card__orb-glow feature-card__orb-glow--secondary"></div>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="feature-card__orb-icon feature-card__orb-icon--secondary">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <div className="feature-card__orbit feature-card__orbit--secondary">
                    <div className="feature-card__particle feature-card__particle--secondary"></div>
                  </div>
                </div>
                <h3 className="feature-card__title">AI Quality Score</h3>
                <p className="feature-card__desc">Gemini AI analyzes your UI design, layout, content quality, and accessibility to generate a quality score.</p>
                <div className="feature-card__bar">
                  <div className="feature-card__bar-fill feature-card__bar-fill--secondary" style={{ width: '62%' }}></div>
                </div>
              </div>

              <div className="feature-card feature-card--tertiary">
                <div className="feature-card__orb">
                  <div className="feature-card__orb-glow feature-card__orb-glow--tertiary"></div>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="feature-card__orb-icon feature-card__orb-icon--tertiary">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <div className="feature-card__orbit feature-card__orbit--tertiary">
                    <div className="feature-card__particle feature-card__particle--tertiary"></div>
                  </div>
                </div>
                <h3 className="feature-card__title">Detailed Reports</h3>
                <p className="feature-card__desc">Get comprehensive reports with SEO audits, broken links, network performance, and actionable recommendations.</p>
                <div className="feature-card__bar">
                  <div className="feature-card__bar-fill feature-card__bar-fill--tertiary" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-section__glow cta-section__glow--1"></div>
            <div className="cta-section__glow cta-section__glow--2"></div>
            <div className="cta-section__content">
              <h2 className="cta-section__title">Ready to test your website?</h2>
              <p className="cta-section__desc">Start a comprehensive AI-powered analysis of your website in seconds. No configuration required.</p>
              <div className="cta-section__buttons">
                <button className="cta-section__btn cta-section__btn--primary" onClick={() => document.getElementById('frontend-url-input')?.focus()}>
                  START TESTING
                </button>
                <button className="cta-section__btn cta-section__btn--secondary" onClick={() => handleNavigate('reports')}>
                  VIEW REPORTS
                </button>
              </div>
            </div>
          </section>

          {/* Live Telemetry Stream + Analysis */}
          <section className="telemetry-section">
            <div className="telemetry-stream">
              <div className="telemetry-stream__header">
                <div className="telemetry-stream__header-left">
                  <span className="telemetry-stream__ping"></span>
                  <span className="telemetry-stream__label">LIVE TESTING STREAM</span>
                </div>
                <span className="telemetry-stream__buffer">BUFFER: 1024KB/S</span>
              </div>
              <div className="telemetry-stream__body">
                <div className="telemetry-stream__scan-line"></div>
                <div className="telemetry-stream__log telemetry-stream__log--dim">
                  <span className="telemetry-stream__time">[21:40:02]</span>
                  <span className="telemetry-stream__msg">SYS_LINK_ESTABLISHED: SERVER_01</span>
                  <span className="telemetry-stream__status telemetry-stream__status--ok">OK</span>
                </div>
                <div className="telemetry-stream__log">
                  <span className="telemetry-stream__time">[21:40:05]</span>
                  <span className="telemetry-stream__msg">CRAWLING_PAGE_HEADER: {'{HASH_0X7A2}'}</span>
                  <span className="telemetry-stream__status telemetry-stream__status--scan">SCANNING...</span>
                </div>
                <div className="telemetry-stream__log telemetry-stream__log--warn">
                  <span className="telemetry-stream__time">[21:40:12]</span>
                  <span className="telemetry-stream__msg telemetry-stream__msg--error">WARNING: BROKEN_LINK_DETECTED</span>
                  <span className="telemetry-stream__status telemetry-stream__status--error">FLAGGED</span>
                </div>
                <div className="telemetry-stream__log">
                  <span className="telemetry-stream__time">[21:40:18]</span>
                  <span className="telemetry-stream__msg">AI_ANALYSIS_QUEUED: 14% COMPLETE</span>
                  <span className="telemetry-stream__status telemetry-stream__status--pending">PENDING</span>
                </div>
                <div className="telemetry-stream__log telemetry-stream__log--dim">
                  <span className="telemetry-stream__time">[21:40:22]</span>
                  <span className="telemetry-stream__msg">LATENCY_CHECK: 12ms</span>
                  <span className="telemetry-stream__status telemetry-stream__status--scan">DONE</span>
                </div>
                <div className="telemetry-stream__log telemetry-stream__log--faded">
                  <span className="telemetry-stream__time">[21:40:30]</span>
                  <span className="telemetry-stream__msg">SCREENSHOT_CAPTURED...</span>
                  <span className="telemetry-stream__status">SAVED</span>
                </div>
                <div className="telemetry-stream__log">
                  <span className="telemetry-stream__time">[21:40:35]</span>
                  <span className="telemetry-stream__msg">SEO_AUDIT_COMPLETE: PAGE_04</span>
                  <span className="telemetry-stream__status telemetry-stream__status--ok">OK</span>
                </div>
                <div className="telemetry-stream__log telemetry-stream__log--dim">
                  <span className="telemetry-stream__time">[21:40:42]</span>
                  <span className="telemetry-stream__msg">GENERATING_REPORT...</span>
                  <span className="telemetry-stream__status telemetry-stream__status--scan">SYNC</span>
                </div>
              </div>
            </div>

            <div className="telemetry-charts">
              <div className="telemetry-chart-card telemetry-chart-card--secondary">
                <div className="telemetry-chart-card__header">
                  <h3 className="telemetry-chart-card__title">Test Coverage</h3>
                  <p className="telemetry-chart-card__sub">CROSS-PAGE ANALYSIS</p>
                </div>
                <div className="telemetry-chart-card__bars">
                  <div className="tbar" style={{ height: '40%', background: 'rgba(0,240,255,0.2)', borderTop: '2px solid var(--accent-primary)' }}></div>
                  <div className="tbar" style={{ height: '70%', background: 'rgba(0,240,255,0.2)', borderTop: '2px solid var(--accent-primary)' }}></div>
                  <div className="tbar" style={{ height: '55%', background: 'rgba(221,183,255,0.2)', borderTop: '2px solid var(--accent-secondary)' }}></div>
                  <div className="tbar" style={{ height: '90%', background: 'rgba(0,240,255,0.2)', borderTop: '2px solid var(--accent-primary)' }}></div>
                  <div className="tbar" style={{ height: '30%', background: 'rgba(255,176,205,0.2)', borderTop: '2px solid var(--accent-pink)' }}></div>
                </div>
              </div>
              <div className="telemetry-chart-card telemetry-chart-card--tertiary">
                <div className="telemetry-chart-card__header">
                  <h3 className="telemetry-chart-card__title">Quality Index</h3>
                  <p className="telemetry-chart-card__sub">AI SCORE AGGREGATE</p>
                </div>
                <div className="telemetry-chart-card__donut">
                  <svg className="donut-svg" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="var(--accent-pink)" strokeWidth="4" strokeDasharray="251" strokeDashoffset="62" strokeLinecap="round" className="donut-fill" />
                  </svg>
                  <span className="donut-label">75%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Defense & Performance Cards */}
          <section className="info-cards-section">
            <div className="info-card info-card--error">
              <div className="info-card__header">
                <div className="info-card__icon info-card__icon--error">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div>
                  <h3 className="info-card__title">Security Audit</h3>
                  <p className="info-card__desc">Active vulnerability scanning and SSL verification.</p>
                </div>
              </div>
              <div className="info-card__tags">
                <span className="info-card__tag info-card__tag--error">XSS_CHECK</span>
                <span className="info-card__tag info-card__tag--primary">SSL_VERIFIED</span>
                <span className="info-card__tag info-card__tag--secondary">HEADERS_OK</span>
              </div>
            </div>
            <div className="info-card info-card--primary">
              <div className="info-card__header">
                <div className="info-card__icon info-card__icon--primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <div>
                  <h3 className="info-card__title">Performance Stats</h3>
                  <p className="info-card__desc">Page load speed and core web vitals analysis.</p>
                </div>
              </div>
              <div className="info-card__perf">
                <div className="info-card__perf-bar">
                  <div className="info-card__perf-fill" style={{ width: '92%' }}></div>
                </div>
                <div className="info-card__perf-labels">
                  <span>LCP STABILITY</span>
                  <span className="info-card__perf-value">ULTRA FAST</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-footer__inner">
          <span className="site-footer__copy">© 2025 WEBTEST AI. ALL SYSTEMS OPERATIONAL.</span>
          <div className="site-footer__links">
            <a href="#" className="site-footer__link">PRIVACY</a>
            <a href="#" className="site-footer__link">API DOCS</a>
            <a href="#" className="site-footer__link site-footer__link--accent">STATUS</a>
            <a href="#" className="site-footer__link">SUPPORT</a>
          </div>
        </div>
      </footer>

      {/* User Details Form Modal */}
      {showUserDetailsForm && (
        <div className="modal-overlay" onClick={() => setShowUserDetailsForm(false)}>
          <div className="modal-content" style={{ padding: 0, background: 'transparent', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <DynamicForm
              onSubmit={handleStartTest}
              onSkip={() => handleStartTest(null)}
            />
          </div>
        </div>
      )}

      {activeView === 'dashboard' && (status === 'testing' || status === 'error') && (
        <MemoizedDashboard
          status={status}
          progress={progress}
          totalPages={totalPages}
          pagesCompleted={pagesCompleted}
          statusLogs={statusLogs}
          liveScreenshot={liveScreenshot}
          liveUrl={liveUrl}
          logsEndRef={logsEndRef}
        />
      )}

      {activeView === 'dashboard' && resultsGrid}

      {activeView === 'dashboard' && status === 'complete' && finalReport && (
        <FinalReport report={finalReport} onNewTest={handleNewTest} />
      )}

      {activeView === 'dashboard' && status === 'error' && (
        <button className="new-test-btn" onClick={handleNewTest}>
          ← Back to Home
        </button>
      )}

      {modalImage && (
        <div className="modal-overlay" onClick={() => setModalImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalImage(null)}>✕</button>
            <img src={modalImage} alt="Full screenshot" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
