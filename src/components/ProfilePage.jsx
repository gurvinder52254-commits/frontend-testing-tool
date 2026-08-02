import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

const ProfilePage = () => {
  const { user, logout, authHeaders } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  
  // Stubs for mock add credits form
  const [mockAmount, setMockAmount] = useState('10');
  const [mockAdding, setMockAdding] = useState(false);
  const [mockMessage, setMockMessage] = useState('');

  // Fetch info and transactions
  const fetchProfileAndHistory = async () => {
    try {
      setLoading(true);
      const profileRes = await fetch(`${API_URL}/profile/info`, { headers: authHeaders });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.success) {
          setProfileData(pData);
        }
      }
      
      const historyRes = await fetch(`${API_URL}/profile/credits-history?page=1&limit=5`, { headers: authHeaders });
      if (historyRes.ok) {
        const hData = await historyRes.json();
        if (hData.success) {
          setHistoryData(hData.transactions || []);
          setHasMoreHistory(hData.hasNextPage);
          setHistoryPage(1);
        }
      }
    } catch (e) {
      console.error('Failed to load profile details:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (loadingHistory || !hasMoreHistory) return;
    try {
      setLoadingHistory(true);
      const nextPage = historyPage + 1;
      const res = await fetch(`${API_URL}/profile/credits-history?page=${nextPage}&limit=5`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistoryData(prev => [...prev, ...(data.transactions || [])]);
          setHasMoreHistory(data.hasNextPage);
          setHistoryPage(nextPage);
        }
      }
    } catch (e) {
      console.error('Failed to load transaction logs:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMockAddCredits = async (e) => {
    e.preventDefault();
    if (mockAdding) return;
    try {
      setMockAdding(true);
      setMockMessage('');
      const res = await fetch(`${API_URL}/profile/credits/mock-add`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount: parseInt(mockAmount, 10) })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMockMessage({ type: 'success', text: data.message });
          fetchProfileAndHistory();
        } else {
          setMockMessage({ type: 'error', text: data.error });
        }
      }
    } catch (err) {
      setMockMessage({ type: 'error', text: err.message });
    } finally {
      setMockAdding(false);
    }
  };

  const handleUpgradeTier = async (tier) => {
    if (mockAdding) return;
    try {
      setMockAdding(true);
      setMockMessage('');
      const res = await fetch(`${API_URL}/profile/credits/mock-add`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ tier })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMockMessage({ type: 'success', text: `Upgraded successfully to ${tier} subscription!` });
          fetchProfileAndHistory();
        } else {
          setMockMessage({ type: 'error', text: data.error });
        }
      }
    } catch (err) {
      setMockMessage({ type: 'error', text: err.message });
    } finally {
      setMockAdding(false);
    }
  };

  // Calculate session token time left dynamically
  useEffect(() => {
    fetchProfileAndHistory();

    const calculateTime = () => {
      const token = localStorage.getItem('webtest_token');
      if (!token) return 'Expired';
      if (!token.startsWith('webtest_session_')) {
        return 'Standard Google Session';
      }
      try {
        const payloadPart = token.substring('webtest_session_'.length).split('.')[0];
        const payload = JSON.parse(atob(payloadPart));
        const diffMs = payload.expiry - Date.now();
        if (diffMs <= 0) return 'Expired';

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.join(' ');
      } catch (e) {
        return 'Invalid Session';
      }
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const profile = profileData?.profile || {};
  const stats = profileData?.stats || { totalScans: 0, completedScans: 0, avgScore: 0, healthyRatio: 100, totalUrlsTested: 0 };
  const credits = profile.credits !== undefined ? profile.credits : 1;
  const maxCreditsMap = { 'Free': 5, 'Basic': 50, 'Pro': 200, 'Business': 1000 };
  const tier = profile.subscriptionTier || 'Free';
  const maxCredits = maxCreditsMap[tier] || 5;
  const totalUrlsTested = stats.totalUrlsTested || 0;
  const creditsPercent = tier === 'Free'
    ? Math.min(100, Math.round((totalUrlsTested / 5) * 100))
    : Math.min(100, Math.round((credits / maxCredits) * 100));

  return (
    <div className="profile-page" style={{
      maxWidth: '1100px',
      margin: '40px auto',
      padding: '0 20px',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '30px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* LEFT COLUMN: IDENTITY & SESSION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.45) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '30px',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Avatar container */}
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            margin: '0 auto 20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#00F0FF',
              borderBottomColor: '#a855f7',
              animation: 'spin 4s linear infinite'
            }} />
            <img 
              src={user.picture} 
              alt={user.name} 
              style={{
                width: '106px',
                height: '106px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
              }}
            />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>{user.name}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0', wordBreak: 'break-all' }}>{user.email}</p>
          
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', background: tier === 'Free' ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #00F0FF 0%, #a855f7 100%)', border: '1px solid rgba(255, 255, 255, 0.1)', color: tier === 'Free' ? '#e2e8f0' : '#0b0e1a', marginBottom: '24px' }}>
            {tier} Plan
          </div>

          {/* Session Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>EXPIRES IN:</span>
              <span style={{ fontFamily: 'monospace', color: '#a855f7', fontWeight: 700 }}>{timeLeft}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>CLIENT ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.7rem', wordBreak: 'break-all' }}>{user.userId || user.sub}</span>
            </div>
          </div>

          <button 
            onClick={logout}
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ff6b6b',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '20px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            Sign Out
          </button>
        </div>

        {/* MOCK CREDIT MANAGEMENT PANEL (TESTING/STUB ONLY) */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 16px 0', color: '#00F0FF', letterSpacing: '0.02em', textTransform: 'uppercase' }}>🔧 Mock Credits Billing</h3>
          
          <form onSubmit={handleMockAddCredits} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ADD SIMULATED CREDITS</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" 
                min="1" 
                max="500"
                value={mockAmount}
                onChange={e => setMockAmount(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={mockAdding}
                style={{
                  background: 'var(--accent-gradient)',
                  color: '#0b0e1a',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {mockAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          {/* Quick Subscription Upgrades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>UPGRADE SUBSCRIPTION TIER</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {['Basic', 'Pro', 'Business'].map(t => (
                <button
                  key={t}
                  onClick={() => handleUpgradeTier(t)}
                  disabled={mockAdding}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 4px',
                    fontSize: '0.75rem',
                    color: t === 'Basic' ? '#3b82f6' : (t === 'Pro' ? '#a855f7' : '#ec4899'),
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {mockMessage && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: mockMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: mockMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: mockMessage.type === 'success' ? '#34d399' : '#f87171'
            }}>
              {mockMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: METRICS & CREDIT LEDGER DETAILS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* STATS TELEMETRY ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px'
        }}>
          {/* Stat 1 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(20px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Scans Compiled</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00F0FF', marginTop: '6px' }}>{stats.totalScans}</div>
          </div>

          {/* Stat 2 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(20px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Overall Quality</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '6px' }}>{stats.avgScore}%</div>
          </div>

          {/* Stat 3 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(20px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Healthy Scan Ratio</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>{stats.healthyRatio}%</div>
          </div>
        </div>

        {/* CREDIT METER PANEL */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.45) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '30px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '30px'
        }}>
          {/* Circular Credit Progress */}
          <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="3.5" />
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                fill="none" 
                stroke={credits === 0 ? '#ef4444' : 'url(#credits-glow)'} 
                strokeWidth="3.5" 
                strokeDasharray="100 100" 
                strokeDashoffset={100 - creditsPercent}
                strokeLinecap="round" 
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient id="credits-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: credits === 0 ? '#ef4444' : '#00F0FF' }}>{credits}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: '-2px' }}>Credits</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Scan Credits Status</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Each URL/domain scan audit runs a full browser instance and consumes <strong>1 credit</strong>. Upgrading subscription adds bulk monthly credits automatically.
            </p>
            {credits === 0 ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#f87171',
                fontWeight: 700
              }}>
                ⚠️ Credits Exhausted. Upgrade plan to resume scans.
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Currently utilizing <strong style={{ color: '#fff' }}>{creditsPercent}%</strong> of your {tier} allocation. (Capacity: {maxCredits} max)
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 20px 0', color: '#00F0FF', letterSpacing: '0.02em', textTransform: 'uppercase' }}>🛡️ Subscribed Plan Limits</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* FREE PLAN: Show Total URLs Scanned (X / 5) as primary tracker */}
            {tier === 'Free' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Total URLs Scanned</span>
                  <span style={{ fontWeight: 800, color: totalUrlsTested >= 5 ? '#ef4444' : '#00F0FF' }}>
                    {totalUrlsTested} / 5
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: totalUrlsTested >= 5
                      ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(90deg, #00F0FF 0%, #a855f7 100%)',
                    width: `${Math.min(100, Math.round((totalUrlsTested / 5) * 100))}%`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-in-out'
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {totalUrlsTested >= 5
                    ? '⛔ Limit reached — upgrade to scan more URLs'
                    : `${5 - totalUrlsTested} URL${5 - totalUrlsTested !== 1 ? 's' : ''} remaining on Free plan`}
                </div>
              </div>
            )}

            {/* Monthly scans limits — only for paid plans */}
            {tier !== 'Free' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Monthly Scans Executed</span>
                  <span style={{ fontWeight: 800, color: '#a855f7' }}>{stats.currentMonthScans || 0} / {
                    tier === 'Basic' ? 200 : (tier === 'Pro' ? 1500 : 10000)
                  }</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                    width: `${Math.min(100, Math.round(((stats.currentMonthScans || 0) / (tier === 'Basic' ? 200 : (tier === 'Pro' ? 1500 : 10000))) * 100))}%`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-in-out'
                  }} />
                </div>
              </div>
            )}

            {/* AI Capability & Reports downloads status info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '10px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>AI AUDIT LOGS:</span>
                <strong style={{ color: tier === 'Free' ? '#ef4444' : '#10b981' }}>
                  {tier === 'Free' ? '🔒 Locked' : (tier === 'Basic' ? '✓ Basic AI Audit' : (tier === 'Pro' ? '✓ Advanced AI Audit' : '✓ Full Suite AI'))}
                </strong>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>REPORTS EXPORT:</span>
                <strong style={{ color: tier === 'Free' ? '#ef4444' : '#10b981' }}>
                  {tier === 'Free' ? '🔒 Screen Only' : (tier === 'Basic' ? '✓ PDF Download' : '✓ PDF + JSON + Link')}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTION HISTORY LEDGER */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.02em', textTransform: 'uppercase' }}>📋 Credits Transaction Ledger</h3>
            <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)', fontWeight: 600 }}>AUDIT TRAIL</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading transaction ledger...</div>
            ) : historyData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No transaction history found.</div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 90px',
                  padding: '8px 12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <span>Date</span>
                  <span>Description</span>
                  <span style={{ textAlign: 'right' }}>Change</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                  {historyData.map((tx, idx) => (
                    <div key={tx.id || idx} style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr 90px',
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                      <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }} title={tx.description}>
                        {tx.description}
                      </span>
                      <span style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: tx.amount > 0 ? '#10b981' : (tx.amount < 0 ? '#ef4444' : 'var(--text-muted)')
                      }}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                  ))}
                </div>

                {hasMoreHistory && (
                  <button
                    onClick={loadMoreHistory}
                    disabled={loadingHistory}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '0.75rem',
                      color: '#00F0FF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    {loadingHistory ? 'Loading log details...' : 'Load Older Transactions'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
