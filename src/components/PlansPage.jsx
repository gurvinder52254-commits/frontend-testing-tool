import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const baseApiUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

const PLANS_DATA = {
  free: {
    name: 'Free Trial',
    features: {
      domains: '1 Domain (One-time)',
      tasks: '5 Tasks',
      scans: '5 Scans total',
      reports: 'Basic on-screen (No download)',
      ai: 'AI Features: None',
      team: '1 Seat (Solo)',
      support: 'Community Forum',
      history: '7 Days data'
    },
    pricing: { INR: '0', USD: '0', GBP: '0', CAD: '0' }
  },
  monthly: [
    {
      id: 'basic_monthly',
      name: 'Basic Monthly',
      tier: 'Basic',
      pricing: { INR: '499', USD: '7.99', GBP: '5.99', CAD: '9.99' },
      features: {
        domains: 'Up to 20 Domains',
        tasks: 'Up to 50 Tasks / mo',
        scans: '200 Scans / mo',
        reports: 'Full PDF report download',
        ai: 'AI: Basic AI Issue Detection',
        team: 'Solo only',
        support: 'Email (48hr response)',
        history: '30 Days logs history'
      }
    },
    {
      id: 'pro_monthly',
      name: 'Pro Monthly',
      tier: 'Pro',
      pricing: { INR: '1,499', USD: '24.99', GBP: '18.99', CAD: '29.99' },
      features: {
        domains: 'Up to 50 Domains',
        tasks: 'Up to 200 Tasks / mo',
        scans: '1,500 Scans / mo',
        reports: 'PDF + JSON + Shareable link',
        ai: 'AI: Advanced AI UI/UX Suggestions',
        team: 'Up to 3 members',
        support: 'Email + Priority Chat (24hr)',
        history: '90 Days logs history'
      }
    },
    {
      id: 'business_monthly',
      name: 'Business Monthly',
      tier: 'Business',
      pricing: { INR: '3,999', USD: '64.99', GBP: '49.99', CAD: '74.99' },
      features: {
        domains: 'Up to 100 Domains',
        tasks: 'Unlimited Tasks',
        scans: '10,000 Scans / mo',
        reports: 'White-label PDF + API Access',
        ai: 'AI: Full AI Suite & Predictions',
        team: 'Up to 10 members',
        support: 'Dedicated Manager (Call + WA)',
        history: '1 Year logs history'
      }
    }
  ],
  yearly: [
    {
      id: 'basic_yearly',
      name: 'Basic Yearly',
      tier: 'Basic',
      pricing: { INR: '3,999', USD: '63.99', GBP: '47.99', CAD: '79.99' },
      features: {
        domains: 'Up to 20 Domains',
        tasks: 'Up to 50 Tasks / mo',
        scans: '200 Scans / mo (2.4k/yr)',
        reports: 'Full PDF report + Extended history',
        ai: 'AI: Basic AI Detection',
        team: 'Solo only',
        support: 'Email (48hr response)',
        history: '1 Year logs history'
      }
    },
    {
      id: 'pro_yearly',
      name: 'Pro Yearly',
      tier: 'Pro',
      pricing: { INR: '11,999', USD: '199.99', GBP: '149.99', CAD: '239.99' },
      features: {
        domains: 'Up to 50 Domains',
        tasks: 'Up to 200 Tasks / mo',
        scans: '1,500 Scans / mo (18k/yr)',
        reports: 'PDF + JSON + Shareable link',
        ai: 'AI: Advanced AI UI/UX Suggestions',
        team: 'Up to 3 members',
        support: 'Priority Chat (24hr)',
        history: '2 Years logs history'
      }
    },
    {
      id: 'business_yearly',
      name: 'Business Yearly',
      tier: 'Business',
      pricing: { INR: '34,999', USD: '549.99', GBP: '419.99', CAD: '639.99' },
      features: {
        domains: 'Up to 100 Domains',
        tasks: 'Unlimited Tasks',
        scans: '10,000 Scans / mo (120k/yr)',
        reports: 'White-label PDF + API Access',
        ai: 'AI: Full AI Suite & Predictions',
        team: 'Up to 10 members',
        support: 'Dedicated Manager (Call + WA)',
        history: 'Lifetime logs history'
      }
    }
  ]
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  CAD: 'C$'
};

// Custom SVG Icons exactly like the user's design image
const IconDomain = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const IconTask = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IconScan = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconReport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconAI = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const IconTeam = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSupport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <polyline points="8 21 12 17 16 21" />
  </svg>
);

const IconHistory = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PlansPage = () => {
  const { authHeaders } = useAuth();
  const [currentTier, setCurrentTier] = useState('Free');
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [upgradingId, setUpgradingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const res = await fetch(`${API_URL}/profile/info`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCurrentTier(data.profile.subscriptionTier || 'Free');
          }
        }
      } catch (err) {
        console.error('Failed to get plan info:', err);
      }
    };
    fetchTier();
  }, [authHeaders]);

  const handleUpgradePlan = async (tierName, planId) => {
    try {
      setUpgradingId(planId);
      setMessage(null);

      const res = await fetch(`${API_URL}/profile/credits/mock-add`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ tier: tierName })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentTier(tierName);
          setMessage({
            type: 'success',
            text: `🎉 Upgrade Successful! You are now subscribed to the ${tierName} plan. New credits added to your account.`
          });
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to update plan' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpgradingId(null);
    }
  };

  const symbol = CURRENCY_SYMBOLS[currency];
  const activePlansList = isYearly ? PLANS_DATA.yearly : PLANS_DATA.monthly;

  return (
    <div className="plans-page" style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '50px 30px',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* HEADER SECTION */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: '#fff',
          margin: '0 0 16px 0',
          letterSpacing: '-1.5px'
        }}>
          Choose the Perfect Audit Plan
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '1.05rem',
          maxWidth: '650px',
          margin: '0 auto 40px',
          lineHeight: '1.6',
          opacity: 0.85
        }}>
          Track multiple domains, increase your scanning limits, and unlock automated AI audit diagnostics globally.
        </p>

        {/* Currency & Toggle Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '35px',
          flexWrap: 'wrap'
        }}>
          {/* Toggle Button Group */}
          <div style={{
            background: '#151c2c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '5px',
            borderRadius: '50px',
            display: 'flex',
            gap: '5px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => setIsYearly(false)}
              style={{
                background: !isYearly ? '#00f0ff' : 'transparent',
                color: !isYearly ? '#000' : '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              style={{
                background: isYearly ? '#00f0ff' : 'transparent',
                color: isYearly ? '#000' : '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Yearly
              <span style={{
                fontSize: '0.7rem',
                color: isYearly ? '#000' : '#10b981',
                background: isYearly ? 'rgba(0,0,0,0.15)' : 'rgba(16,185,129,0.12)',
                padding: '3px 8px',
                borderRadius: '20px',
                border: isYearly ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(16,185,129,0.2)',
                fontWeight: 800
              }}>
                Save 30%
              </span>
            </button>
          </div>

          {/* Currency Select Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>CURRENCY:</span>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{
                background: '#151c2c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              <option value="INR" style={{ background: '#0f172a' }}>INR (₹)</option>
              <option value="USD" style={{ background: '#0f172a' }}>USD ($)</option>
              <option value="GBP" style={{ background: '#0f172a' }}>GBP (£)</option>
              <option value="CAD" style={{ background: '#0f172a' }}>CAD (C$)</option>
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          maxWidth: '850px',
          margin: '0 auto 40px',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          {message.text}
        </div>
      )}

      {/* PLANS CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '60px',
        alignItems: 'stretch'
      }}>
        
        {/* CARD 1: FREE TRIAL */}
        <div style={{
          background: '#151c2c',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '40px 28px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px 0', color: '#fff' }}>
            {PLANS_DATA.free.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '32px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>
              {symbol}{PLANS_DATA.free.pricing[currency]}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '6px', fontWeight: 500 }}>
              /one-time
            </span>
          </div>

          {/* Features list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', fontSize: '0.9rem', color: '#cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconDomain /> <span>{PLANS_DATA.free.features.domains}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconTask /> <span>{PLANS_DATA.free.features.tasks}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconScan /> <span>{PLANS_DATA.free.features.scans}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconReport /> <span>{PLANS_DATA.free.features.reports}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconAI /> <span>{PLANS_DATA.free.features.ai}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconTeam /> <span>{PLANS_DATA.free.features.team}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconSupport /> <span>{PLANS_DATA.free.features.support}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconHistory /> <span>{PLANS_DATA.free.features.history}</span></div>
          </div>

          <button
            disabled
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#64748b',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'not-allowed',
              opacity: 0.6
            }}
          >
            {currentTier === 'Free' ? 'Active Plan' : 'Free Trial Used'}
          </button>
        </div>

        {/* SUBSCRIPTION DYNAMIC CARDS */}
        {activePlansList.map(plan => {
          const isActive = currentTier === plan.tier;
          const isUpgrading = upgradingId === plan.id;
          const price = plan.pricing[currency];
          const isPro = plan.tier === 'Pro';

          return (
            <div key={plan.id} style={{
              background: '#151c2c',
              border: isPro
                ? '2px solid #00f0ff'
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '40px 28px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: isPro ? '0 0 40px rgba(0, 240, 255, 0.15)' : '0 8px 30px rgba(0, 0, 0, 0.2)',
              transform: isPro ? 'scale(1.02)' : 'none',
              zIndex: isPro ? 2 : 1
            }}>
              
              {/* Center aligned Popular Choice badge */}
              {isPro && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #00f0ff 0%, #d946ef 100%)',
                  color: '#000',
                  padding: '5px 20px',
                  borderRadius: '50px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                  Popular Choice
                </div>
              )}

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px 0', color: '#fff' }}>
                {plan.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '32px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>
                  {symbol}{price}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '6px', fontWeight: 500 }}>
                  /{isYearly ? 'yr' : 'mo'}
                </span>
              </div>

              {/* Features list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconDomain /> <span><strong>{plan.features.domains}</strong></span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconTask /> <span>{plan.features.tasks}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconScan /> <span><strong>{plan.features.scans}</strong></span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconReport /> <span>{plan.features.reports}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconAI /> <span>{plan.features.ai}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconTeam /> <span>{plan.features.team}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconSupport /> <span>{plan.features.support}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><IconHistory /> <span>{plan.features.history}</span></div>
              </div>

              <button
                onClick={() => handleUpgradePlan(plan.tier, plan.id)}
                disabled={isActive || upgradingId !== null}
                style={{
                  width: '100%',
                  background: isActive
                    ? 'rgba(16, 185, 129, 0.12)'
                    : (isPro ? 'linear-gradient(90deg, #00f0ff 0%, #d946ef 100%)' : '#1e293b'),
                  color: isActive
                    ? '#34d399'
                    : (isPro ? '#000' : '#fff'),
                  border: isActive
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: isActive ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isPro && !isActive ? '0 4px 20px rgba(0, 240, 255, 0.3)' : 'none'
                }}
              >
                {isActive ? 'Current Plan ✓' : (isUpgrading ? 'Activating...' : 'Select Plan')}
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default PlansPage;
