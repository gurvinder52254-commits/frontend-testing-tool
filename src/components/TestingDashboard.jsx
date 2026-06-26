function TestingDashboard({
  status,
  progress,
  totalPages,
  pagesCompleted,
  statusLogs,
  liveScreenshot,
  liveUrl,
  logsEndRef,
}) {
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
        {/* Status Log Panel */}
        <div className="glass-card">
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

          <div className="status-log">
            {statusLogs.length === 0 ? (
              <div className="empty-state">
                <div className="spinner" />
                <p className="empty-state__text">Waiting for updates...</p>
              </div>
            ) : (
              statusLogs.map((log, i) => (
                <div
                  key={i}
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
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Live Browser View */}
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
              {liveScreenshot ? (
                <>
                  <img
                    className="live-browser__screenshot"
                    src={liveScreenshot}
                    alt="Live browser view"
                    style={{ width: '100%', height: '400px', objectFit: 'contain', transition: 'opacity 0.2s ease' }}
                  />
                  {status === 'testing' && (
                    <div className="live-browser__live-badge">
                      <span className="live-browser__live-dot" />
                      LIVE
                    </div>
                  )}
                </>
              ) : (
                <div className="live-browser__placeholder" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="live-browser__placeholder-icon">🖥️</div>
                  <p>Browser will appear here when testing starts</p>
                  {status === 'testing' && <div className="spinner spinner--sm" style={{ marginTop: 12 }} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestingDashboard;
