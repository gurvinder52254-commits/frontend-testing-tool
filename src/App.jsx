import { useState, useEffect, useRef, useCallback, memo, useMemo, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import TestForm from './components/TestForm';
import TestingDashboard from './components/TestingDashboard';
import VirtualPageGrid from './components/VirtualPageGrid';
import FinalReport from './components/FinalReport';
import ReportsPage from './components/ReportsPage';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Test from './test';
import DynamicForm from './components/DynamicForm';
import { useAuth } from './context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;
const WS_URL = baseApiUrl.replace(/\/api$/, '').replace(/^http/, 'ws') + '/ws';


// ─── Reducer for batching WS-driven state updates ───────────────────────────
const testingReducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return {
        progress: 0, totalPages: 0, pagesCompleted: 0,
        statusLogs: [], liveUrl: '', completedPages: [], finalReport: null,
      };
    case 'RESTORE_TEST_STATE':
      return {
        ...state,
        progress: action.report.status === 'complete' ? 100 : Math.round(((action.report.pagesCompleted || 0) / (action.report.totalPages || 1)) * 100),
        totalPages: action.report.totalPages || 0,
        pagesCompleted: action.report.pagesCompleted || 0,
        completedPages: action.report.pages || [],
        finalReport: action.report.status === 'complete' ? action.report : null,
      };
    case 'ADD_LOG': {
      const newLogs = [...state.statusLogs, action.payload];
      return { ...state, statusLogs: newLogs.length > 150 ? newLogs.slice(-100) : newLogs };
    }
    case 'LINKS_DISCOVERED':
      return { ...state, totalPages: action.totalPages };
    case 'PAGE_START':
      return { ...state, progress: action.progress, liveUrl: action.url };
    case 'PAGE_COMPLETE': {
      const existing = state.completedPages.findIndex(
        (p) => p.url === action.result.url || p.pageIndex === action.pageIndex
      );
      let pages;
      if (existing >= 0) {
        pages = [...state.completedPages];
        pages[existing] = { ...pages[existing], ...action.result, pageIndex: action.pageIndex };
      } else {
        pages = [...state.completedPages, { ...action.result, pageIndex: action.pageIndex }];
      }
      return { ...state, progress: action.progress, pagesCompleted: state.pagesCompleted + 1, completedPages: pages };
    }
    case 'TEST_COMPLETE':
      return { ...state, progress: 100, finalReport: action.report };
    case 'SET_LIVE_URL':
      return { ...state, liveUrl: action.url };
    default:
      return state;
  }
};

const initialTestingState = {
  progress: 0, totalPages: 0, pagesCompleted: 0,
  statusLogs: [], liveUrl: '', completedPages: [], finalReport: null,
};

// Memoized Dashboard to prevent unnecessary re-renders
const MemoizedDashboard = memo(TestingDashboard);

function App() {
  const { isLoggedIn, authHeaders, user, logout } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | connecting | testing | complete | error
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | reports | project-detail
  const [loadingReport, setLoadingReport] = useState(false); // kept for legacy fallback only
  const isTestPage = window.location.pathname === '/test';

  const [testConfig, setTestConfig] = useState(null);
  const [showUserDetailsForm, setShowUserDetailsForm] = useState(false);

  const [wsConnected, setWsConnected] = useState(false);
  const [testId, setTestId] = useState(null);
  const [frontendUrl, setFrontendUrl] = useState('');
  const [modalImage, setModalImage] = useState(null);
  // ID of the report selected from the Reports page — drives the useQuery below
  const [selectedTestId, setSelectedTestId] = useState(null);

  // Batch all fast-updating testing state into a reducer to avoid cascading re-renders
  const [testingState, dispatch] = useReducer(testingReducer, initialTestingState);
  const { progress, totalPages, pagesCompleted, statusLogs, liveUrl, completedPages, finalReport } = testingState;

  // Store live screenshot in ref — update it directly without triggering React re-render tree
  // TestingDashboard reads it via its own polling interval
  const liveScreenshotRef = useRef(null);
  const [screenshotTick, setScreenshotTick] = useState(0); // lightweight tick to tell Dashboard a new screenshot arrived

  const wsRef = useRef(null);
  const logsEndRef = useRef(null);
  const logIdCounter = useRef(0); // stable IDs for log items — never use index as key

  // Auto-scroll logs using RAF to prevent layout thrash
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(raf);
  }, [statusLogs.length]);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle Hash Routing and state restoration on mount/refresh/hashchange
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      
      if (!isLoggedIn) return; // wait for login to fetch auth-protected state

      if (hash.startsWith('#/report/')) {
        const id = hash.substring('#/report/'.length);
        setSelectedTestId(id);
        setActiveView('project-detail');
      } else if (hash.startsWith('#/test/')) {
        const id = hash.substring('#/test/'.length);
        // Connect WS and fetch progress if test is active/recent
        testIdRef.current = id;
        setTestId(id);
        setActiveView('dashboard');
        
        try {
          const res = await fetch(`${API_URL}/test/${id}`, { headers: authHeaders });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.report) {
              setStatus(data.status === 'running' ? 'testing' : (data.status === 'complete' ? 'complete' : 'idle'));
              setFrontendUrl(data.report.frontendUrl || '');
              dispatch({ type: 'RESTORE_TEST_STATE', report: data.report });
            }
          }
        } catch (e) {
          console.error('Failed to restore running test:', e);
        }
      } else if (hash === '#/reports') {
        setSelectedTestId(null);
        setActiveView('reports');
      } else {
        setSelectedTestId(null);
        setActiveView('dashboard');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isLoggedIn, authHeaders]);

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
    const id = ++logIdCounter.current;
    dispatch({ type: 'ADD_LOG', payload: { id, message, type, time } });
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
        dispatch({ type: 'LINKS_DISCOVERED', totalPages: data.totalPages });
        addLog(
          `Discovered ${data.totalPages} pages (${data.headerLinks} header, ${data.footerLinks} footer)`,
          'success'
        );
        break;

      case 'page-start':
        dispatch({ type: 'PAGE_START', progress: data.progress || 0, url: data.url });
        addLog(`Testing page ${data.pageIndex + 1}/${data.totalPages}: ${data.text || data.url}`, 'info');
        break;

      case 'live-screenshot':
        // Store in ref to avoid cascading re-renders — only send a tick signal
        liveScreenshotRef.current = `data:image/png;base64,${data.image}`;
        dispatch({ type: 'SET_LIVE_URL', url: data.url });
        setScreenshotTick((t) => t + 1);
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
        dispatch({
          type: 'PAGE_COMPLETE',
          pageIndex: data.pageIndex,
          result: data.result,
          progress: data.progress || 0,
        });
        break;

      case 'page-error':
        addLog(`❌ Error on page ${data.pageIndex + 1}: ${data.error}`, 'error');
        break;

      case 'test-complete':
        setStatus('complete');
        dispatch({ type: 'TEST_COMPLETE', report: data.report });
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
    dispatch({ type: 'RESET' });
    liveScreenshotRef.current = null;
    setScreenshotTick(0);
    testIdRef.current = null;

    addLog(`Starting test for: ${fUrl}`, 'info');

    try {
      const res = await fetch(`${API_URL}/start-test`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ frontendUrl: fUrl, backendUrl: bUrl || undefined, scanType, userDetails }),
      });
      const data = await res.json();

      if (data.success) {
        setTestId(data.testId);
        testIdRef.current = data.testId;
        window.location.hash = `/test/${data.testId}`;
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
    setSelectedTestId(null);
    setTestId(null);
    testIdRef.current = null;
    liveScreenshotRef.current = null;
    setScreenshotTick(0);
    dispatch({ type: 'RESET' });
    window.location.hash = '';
  }, []);

  const handleScreenshotClick = useCallback((url) => {
    setModalImage(url);
  }, []);

  // Navigation handler
  const handleNavigate = useCallback((view) => {
    if (view === 'dashboard') {
      setActiveView('dashboard');
      setSelectedTestId(null);
      window.location.hash = '';
    } else if (view === 'reports') {
      setActiveView('reports');
      setSelectedTestId(null);
      window.location.hash = '/reports';
    }
  }, []);

  // ── TanStack Query: load report detail with automatic caching ──────────────
  // The same report is never fetched twice within the staleTime window.
  const {
    data: selectedReportData,
    isLoading: isLoadingReport,
    error: reportError,
  } = useQuery({
    queryKey: ['report', selectedTestId],
    queryFn: async () => {
      if (!selectedTestId) return null;
      const res = await fetch(`${API_URL}/reports/${selectedTestId}`, { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load report');
      return data.report;
    },
    enabled: !!selectedTestId,  // only fetch when a report is actually selected
    staleTime: 10 * 60 * 1000, // cache individual report for 10 min
  });

  // Derive selectedReport from query data (mirrors old selectedReport state)
  const selectedReport = selectedTestId ? selectedReportData ?? null : null;

  // Select a project from reports to view its dashboard
  const handleSelectProject = useCallback((testId) => {
    setSelectedTestId(testId);
    setActiveView('project-detail');
    window.location.hash = `/report/${testId}`;
  }, []);

  // Live test results grid — virtualized via VirtualPageGrid
  const resultsGrid = useMemo(() => {
    if (completedPages.length === 0) return null;
    return (
      <VirtualPageGrid
        pages={completedPages}
        onScreenshotClick={handleScreenshotClick}
        title={`Tested Pages (${completedPages.length}/${totalPages || '?'})`}
      />
    );
  }, [completedPages, totalPages, handleScreenshotClick]);

  // Show Login page if not authenticated
  if (!isLoggedIn) {
    return <LoginPage />;
  }

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
      {activeView === 'project-detail' && isLoadingReport && (
        <div className="reports-page__loading" style={{ marginTop: '80px' }}>
          <div className="reports-page__spinner"></div>
          <span>Loading project report...</span>
        </div>
      )}

      {activeView === 'project-detail' && !isLoadingReport && selectedReport && (
        <div>
          <button className="reports-back-btn" onClick={() => handleNavigate('reports')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Reports
          </button>

          {selectedReport.pages && selectedReport.pages.length > 0 && (
            <VirtualPageGrid
              pages={selectedReport.pages}
              onScreenshotClick={handleScreenshotClick}
              title={`Tested Pages [${selectedReport.pages.length}]`}
            />
          )}

          <FinalReport report={selectedReport} onNewTest={() => handleNavigate('reports')} />
        </div>
      )}

      {/* === DASHBOARD VIEW (default) === */}
      {activeView === 'dashboard' && status === 'idle' && (
        <div className="hero-section">
          {/* Hero Content */}
          <section className="hero">
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
              <div className="hero__stat">
                <span className="hero__stat-value">AI</span>
                <span className="hero__stat-label">Analysis</span>
              </div>
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
          liveScreenshotRef={liveScreenshotRef}
          screenshotTick={screenshotTick}
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
