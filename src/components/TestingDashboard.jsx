import { useRef, useEffect, memo } from 'react';

// Memoized individual log item - only re-renders if its own data changes
const LogItem = memo(function LogItem({ log }) {
  return (
    <div
      className={`status-log__item ${
        log.type === 'success'
          ? 'status-log__item--success'
          : log.type === 'error'
          ? 'status-log__item--error'
          : log.type === 'ai'
          ? 'status-log__item--ai'
          : ''
      }`}
    >
      <span className="status-log__time">{log.time}</span>
      <span>{log.message}</span>
    </div>
  );
});

// Memoized log list - only re-renders when statusLogs array reference changes
const LogList = memo(function LogList({ statusLogs, logsEndRef }) {
  if (statusLogs.length === 0) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <p className="empty-state__text">Waiting for updates...</p>
      </div>
    );
  }
  return (
    <>
      {statusLogs.map((log) => (
        // Use stable numeric id assigned at creation, never array index
        <LogItem key={log.id} log={log} />
      ))}
      <div ref={logsEndRef} />
    </>
  );
});

// LiveBrowserView reads from a ref + responds to screenshotTick
// This isolates screenshot updates from the log panel entirely
const LiveBrowserView = memo(function LiveBrowserView({ liveScreenshotRef, screenshotTick, liveUrl, status }) {
  const imgRef = useRef(null);

  // When tick changes, update the img src directly via DOM — zero React re-render
  useEffect(() => {
    if (imgRef.current && liveScreenshotRef.current) {
      imgRef.current.src = liveScreenshotRef.current;
      imgRef.current.style.opacity = '1';
    }
  }, [screenshotTick, liveScreenshotRef]);

  return (
    <div className="glass-card">
      <div className="glass-card__header">
        <span className="glass-card__title">🖥️ Live Browser</span>
        {status === 'testing' && (
          <span className="glass-card__badge glass-card__badge--running">● Live</span>
        )}
      </div>

      <div className="live-browser">
        <div className="live-browser__bar">
          <div className="live-browser__dots">
            <span className="live-browser__dot live-browser__dot--red" />
            <span className="live-browser__dot live-browser__dot--yellow" />
            <span className="live-browser__dot live-browser__dot--green" />
          </div>
          <div className="live-browser__url">
            {liveUrl || 'Waiting for navigation...'}
          </div>
        </div>

        <div className="live-browser__content" style={{ minHeight: '400px', background: '#000', overflow: 'hidden' }}>
          {/* Always render the img tag; hide with placeholder until first screenshot */}
          <img
            ref={imgRef}
            className="live-browser__screenshot"
            src=""
            alt="Live browser view"
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'contain',
              display: screenshotTick === 0 ? 'none' : 'block',
              transition: 'opacity 0.15s ease',
            }}
          />
          {screenshotTick === 0 && (
            <div className="live-browser__placeholder" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="live-browser__placeholder-icon">🖥️</div>
              <p>Browser will appear here when testing starts</p>
              {status === 'testing' && <div className="spinner spinner--sm" style={{ marginTop: 12 }} />}
            </div>
          )}
          {status === 'testing' && screenshotTick > 0 && (
            <div className="live-browser__live-badge">
              <span className="live-browser__live-dot" />
              LIVE
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function TestingDashboard({
  status,
  progress,
  totalPages,
  pagesCompleted,
  statusLogs,
  liveScreenshotRef,
  screenshotTick,
  liveUrl,
  logsEndRef,
}) {
  const leftCardRef = useRef(null);   // left log card — height synced to the right
  const rightColRef = useRef(null);   // right (Live Browser) column — the height source
  const logScrollRef = useRef(null);  // the scrollable log container
  const pinnedRef = useRef(true);     // is the user currently at the bottom of the log?

  // Keep the left log panel exactly as tall as the right (Live Browser) panel.
  useEffect(() => {
    const rightEl = rightColRef.current;
    const leftEl = leftCardRef.current;
    if (!rightEl || !leftEl) return;

    const sync = () => {
      // On the stacked (mobile) layout, let the panel size naturally.
      if (window.matchMedia('(max-width: 1024px)').matches) {
        leftEl.style.height = '';
        return;
      }
      leftEl.style.height = `${rightEl.offsetHeight}px`;
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(rightEl);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  // Track whether the log is scrolled to (near) the bottom.
  const handleLogScroll = () => {
    const el = logScrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  // On new log entries, only auto-scroll to the latest if the user was already
  // at the bottom of the log. If they scrolled up to read, leave them there.
  useEffect(() => {
    const el = logScrollRef.current;
    if (el && pinnedRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [statusLogs]);

  return (
    <div className="dashboard">
      {/* Progress Bar */}
      <div className="progress">
        <div className="progress__bar-container">
          <div
            className="progress__bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress__text">
          <span>
            {pagesCompleted} of {totalPages || '?'} pages tested
          </span>
          <span className="progress__percent">{progress}%</span>
        </div>
      </div>

      <div className="dashboard__grid">
        {/* Status Log Panel — height matched to the right panel, scrolls internally */}
        <div
          className="glass-card"
          ref={leftCardRef}
          style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}
        >
          <div className="glass-card__header">
            <span className="glass-card__title">📋 Live Testing Log</span>
            <span
              className={`glass-card__badge ${
                status === 'testing'
                  ? 'glass-card__badge--running'
                  : status === 'error'
                  ? 'glass-card__badge--error'
                  : 'glass-card__badge--complete'
              }`}
            >
              {status === 'testing' ? '● Running' : status === 'error' ? '● Error' : '● Done'}
            </span>
          </div>

          <div className="status-log" ref={logScrollRef} onScroll={handleLogScroll}>
            <LogList statusLogs={statusLogs} logsEndRef={logsEndRef} />
          </div>
        </div>

        {/* Live Browser View — isolated in its own memo component; drives the row height */}
        <div ref={rightColRef}>
          <LiveBrowserView
            liveScreenshotRef={liveScreenshotRef}
            screenshotTick={screenshotTick}
            liveUrl={liveUrl}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(TestingDashboard);
