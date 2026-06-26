import { useState, memo } from 'react';

/**
 * GroqTestPanel - Displays Groq AI analysis results
 * Shows: Element Analysis, Test Suggestions, Playwright Code, Execution Results
 */
const GroqTestPanel = memo(function GroqTestPanel({ groqAnalysis }) {
  const [activeTab, setActiveTab] = useState('elements');
  const [codeExpanded, setCodeExpanded] = useState(false);

  if (!groqAnalysis || groqAnalysis.status === 'error') {
    if (groqAnalysis?.error) {
      return (
        <div className="groq-panel groq-panel--error">
          <div className="groq-panel__header">
            <span className="groq-panel__icon">🧠</span>
            <span className="groq-panel__title">Groq AI Analysis</span>
            <span className="groq-panel__badge groq-panel__badge--error">Error</span>
          </div>
          <div className="groq-panel__error-msg">
            ⚠️ {groqAnalysis.error}
          </div>
        </div>
      );
    }
    return null;
  }

  const elements = groqAnalysis.elementAnalysis || {};
  const suggestions = groqAnalysis.testSuggestions || {};
  const code = groqAnalysis.playwrightCode || {};
  const execution = groqAnalysis.executionResults || {};

  const tabs = [
    { id: 'elements', label: '🔍 Elements', count: (elements.buttons?.length || 0) + (elements.inputFields?.length || 0) },
    { id: 'tests', label: '📋 Test Cases', count: suggestions.totalTests || 0 },
    { id: 'code', label: '💻 Code', count: code.totalTestCases || 0 },
    { id: 'results', label: '🧪 Results', count: execution.totalTests || 0 },
  ];

  const getStatusColor = (status) => {
    if (status === 'passed') return '#10b981';
    if (status === 'failed') return '#ef4444';
    return '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const map = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#6b7280' };
    return map[priority] || '#6b7280';
  };

  const getTypeIcon = (type) => {
    const map = {
      navigation: '🧭', form: '📝', button: '🔘', visual: '👁️',
      error: '❌', seo: '🔍', responsive: '📱', functional: '⚡',
      negative: '🚫', boundary: '📏', accessibility: '♿',
    };
    return map[type] || '🔧';
  };

  return (
    <div className="groq-panel">
      {/* Header */}
      <div className="groq-panel__header">
        <div className="groq-panel__header-left">
          <span className="groq-panel__icon">🧠</span>
          <span className="groq-panel__title">Groq AI Analysis</span>
        </div>
        {execution.totalTests > 0 && (
          <div className="groq-panel__score-badges">
            <span className="groq-panel__badge groq-panel__badge--pass">
              ✅ {execution.passed || 0}
            </span>
            <span className="groq-panel__badge groq-panel__badge--fail">
              ❌ {execution.failed || 0}
            </span>
            <span className="groq-panel__badge groq-panel__badge--total">
              📊 {execution.totalTests}
            </span>
          </div>
        )}
      </div>

      {/* Page Overview */}
      {elements.pageOverview && (
        <div className="groq-panel__overview">
          {elements.pageOverview}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="groq-panel__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`groq-panel__tab ${activeTab === tab.id ? 'groq-panel__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="groq-panel__tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="groq-panel__content">

        {/* ═══════════ ELEMENTS TAB ═══════════ */}
        {activeTab === 'elements' && (
          <div className="groq-panel__elements">
            {/* Buttons */}
            {elements.buttons?.length > 0 && (
              <div className="groq-panel__section">
                <div className="groq-panel__section-title">🔘 Buttons ({elements.buttons.length})</div>
                <div className="groq-panel__list">
                  {elements.buttons.map((btn, i) => (
                    <div key={i} className="groq-panel__list-item">
                      <span className="groq-panel__item-text">{btn.text}</span>
                      <div className="groq-panel__item-tags">
                        <span className="groq-panel__tag groq-panel__tag--type">{btn.type}</span>
                        <span className="groq-panel__tag groq-panel__tag--location">{btn.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Fields */}
            {elements.inputFields?.length > 0 && (
              <div className="groq-panel__section">
                <div className="groq-panel__section-title">📝 Input Fields ({elements.inputFields.length})</div>
                <div className="groq-panel__list">
                  {elements.inputFields.map((field, i) => (
                    <div key={i} className="groq-panel__list-item">
                      <span className="groq-panel__item-text">{field.label}</span>
                      <div className="groq-panel__item-tags">
                        <span className="groq-panel__tag groq-panel__tag--type">{field.type}</span>
                        {field.required && <span className="groq-panel__tag groq-panel__tag--required">Required</span>}
                        <span className="groq-panel__tag groq-panel__tag--location">{field.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forms */}
            {elements.forms?.length > 0 && (
              <div className="groq-panel__section">
                <div className="groq-panel__section-title">📋 Forms ({elements.forms.length})</div>
                <div className="groq-panel__list">
                  {elements.forms.map((form, i) => (
                    <div key={i} className="groq-panel__list-item">
                      <span className="groq-panel__item-text">{form.name}</span>
                      <div className="groq-panel__item-tags">
                        <span className="groq-panel__tag groq-panel__tag--type">{form.fields} fields</span>
                        {form.hasSubmitButton && (
                          <span className="groq-panel__tag groq-panel__tag--pass">✓ {form.submitButtonText}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {elements.errors?.length > 0 && (
              <div className="groq-panel__section">
                <div className="groq-panel__section-title" style={{ color: '#ef4444' }}>⚠️ Detected Issues ({elements.errors.length})</div>
                <div className="groq-panel__list">
                  {elements.errors.map((err, i) => (
                    <div key={i} className="groq-panel__list-item groq-panel__list-item--error">
                      <span className="groq-panel__item-text">{err.description}</span>
                      <div className="groq-panel__item-tags">
                        <span className={`groq-panel__tag groq-panel__tag--severity-${err.severity}`}>
                          {err.severity}
                        </span>
                        <span className="groq-panel__tag groq-panel__tag--type">{err.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Issues */}
            {elements.visualIssues?.length > 0 && (
              <div className="groq-panel__section">
                <div className="groq-panel__section-title" style={{ color: '#f59e0b' }}>👁️ Visual Issues</div>
                <div className="groq-panel__list">
                  {elements.visualIssues.map((issue, i) => (
                    <div key={i} className="groq-panel__list-item groq-panel__list-item--warning">
                      <span className="groq-panel__item-text">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Info */}
            {elements.navigation && (
              <div className="groq-panel__section">
                <div className="groq-panel__section-title">🧭 Navigation Structure</div>
                <div className="groq-panel__nav-info">
                  <span className={`groq-panel__nav-badge ${elements.navigation.hasHeader ? 'groq-panel__nav-badge--yes' : 'groq-panel__nav-badge--no'}`}>
                    {elements.navigation.hasHeader ? '✓' : '✗'} Header
                  </span>
                  <span className={`groq-panel__nav-badge ${elements.navigation.hasFooter ? 'groq-panel__nav-badge--yes' : 'groq-panel__nav-badge--no'}`}>
                    {elements.navigation.hasFooter ? '✓' : '✗'} Footer
                  </span>
                  <span className={`groq-panel__nav-badge ${elements.navigation.hasSidebar ? 'groq-panel__nav-badge--yes' : 'groq-panel__nav-badge--no'}`}>
                    {elements.navigation.hasSidebar ? '✓' : '✗'} Sidebar
                  </span>
                </div>
                {elements.navigation.menuItems?.length > 0 && (
                  <div className="groq-panel__menu-items">
                    {elements.navigation.menuItems.map((item, i) => (
                      <span key={i} className="groq-panel__menu-item">{item}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TEST SUGGESTIONS TAB ═══════════ */}
        {activeTab === 'tests' && (
          <div className="groq-panel__tests">
            {suggestions.summary && (
              <div className="groq-panel__test-summary">{suggestions.summary}</div>
            )}
            {suggestions.testCategories?.map((cat, cIdx) => (
              <div key={cIdx} className="groq-panel__test-category">
                <div className="groq-panel__category-title">
                  {cat.category} ({cat.tests?.length || 0})
                </div>
                <div className="groq-panel__test-list">
                  {cat.tests?.map((test, tIdx) => (
                    <div key={tIdx} className="groq-panel__test-item">
                      <div className="groq-panel__test-header">
                        <span className="groq-panel__test-id">{test.id}</span>
                        <span className="groq-panel__test-name">{test.name}</span>
                        <div className="groq-panel__test-meta">
                          <span
                            className="groq-panel__priority"
                            style={{ background: getPriorityColor(test.priority), color: '#fff' }}
                          >
                            {test.priority}
                          </span>
                          <span className="groq-panel__tag groq-panel__tag--type">
                            {getTypeIcon(test.type)} {test.type}
                          </span>
                        </div>
                      </div>
                      {test.description && (
                        <div className="groq-panel__test-desc">{test.description}</div>
                      )}
                      {test.steps?.length > 0 && (
                        <div className="groq-panel__test-steps">
                          {test.steps.map((step, sIdx) => (
                            <div key={sIdx} className="groq-panel__step">
                              <span className="groq-panel__step-num">{sIdx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {test.expectedResult && (
                        <div className="groq-panel__expected">
                          ✓ Expected: {test.expectedResult}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════ CODE TAB ═══════════ */}
        {activeTab === 'code' && (
          <div className="groq-panel__code">
            {code.testFileName && (
              <div className="groq-panel__code-filename">
                📄 {code.testFileName}
                <span className="groq-panel__code-count">{code.totalTestCases || 0} tests</span>
              </div>
            )}

            {code.testList?.length > 0 && (
              <div className="groq-panel__code-tests">
                <div className="groq-panel__section-title">Test Cases in Code</div>
                {code.testList.map((t, i) => (
                  <div key={i} className="groq-panel__list-item">
                    <span className="groq-panel__item-text">
                      {getTypeIcon(t.type)} {t.name}
                    </span>
                    <span className="groq-panel__tag groq-panel__tag--type">{t.type}</span>
                  </div>
                ))}
              </div>
            )}

            {code.testCode && (
              <div className="groq-panel__code-block">
                <button
                  className="groq-panel__code-toggle"
                  onClick={() => setCodeExpanded(!codeExpanded)}
                >
                  {codeExpanded ? '▲ Hide Code' : '▼ Show Playwright Code'}
                </button>
                {codeExpanded && (
                  <pre className="groq-panel__code-pre">
                    <code>{code.testCode}</code>
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ RESULTS TAB ═══════════ */}
        {activeTab === 'results' && (
          <div className="groq-panel__results">
            {execution.totalTests > 0 ? (
              <>
                {/* Results Summary Bar */}
                <div className="groq-panel__results-summary">
                  <div className="groq-panel__results-stat groq-panel__results-stat--pass">
                    <div className="groq-panel__results-stat-value">{execution.passed || 0}</div>
                    <div className="groq-panel__results-stat-label">Passed</div>
                  </div>
                  <div className="groq-panel__results-stat groq-panel__results-stat--fail">
                    <div className="groq-panel__results-stat-value">{execution.failed || 0}</div>
                    <div className="groq-panel__results-stat-label">Failed</div>
                  </div>
                  <div className="groq-panel__results-stat groq-panel__results-stat--total">
                    <div className="groq-panel__results-stat-value">{execution.totalTests}</div>
                    <div className="groq-panel__results-stat-label">Total</div>
                  </div>
                  {/* Pass rate bar */}
                  <div className="groq-panel__pass-rate">
                    <div className="groq-panel__pass-rate-bar">
                      <div
                        className="groq-panel__pass-rate-fill"
                        style={{
                          width: `${execution.totalTests > 0 ? Math.round((execution.passed / execution.totalTests) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="groq-panel__pass-rate-text">
                      {execution.totalTests > 0 ? Math.round((execution.passed / execution.totalTests) * 100) : 0}% pass rate
                    </span>
                  </div>
                </div>

                {/* Individual Test Results */}
                <div className="groq-panel__test-results-list">
                  {execution.testResults?.map((result, i) => (
                    <div
                      key={i}
                      className={`groq-panel__result-item groq-panel__result-item--${result.status}`}
                    >
                      <div className="groq-panel__result-header">
                        <span
                          className="groq-panel__result-status"
                          style={{ color: getStatusColor(result.status) }}
                        >
                          {result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'}
                        </span>
                        <span className="groq-panel__result-name">{result.name}</span>
                        <span className="groq-panel__result-duration">{result.duration}ms</span>
                      </div>
                      {result.details && (
                        <div className="groq-panel__result-details">{result.details}</div>
                      )}
                      {result.error && (
                        <div className="groq-panel__result-error">❌ {result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="groq-panel__empty">
                <div className="groq-panel__empty-icon">🧪</div>
                <p>No test execution results available yet.</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Tests run when Groq AI generates Playwright code successfully.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default GroqTestPanel;
