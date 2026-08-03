import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { isAdminEmail } from '../lib/utils';
import { UPIPayment } from '../components/UPIPayment';
import { useGuest } from '../context/GuestContext';
import { VITE_API_BASE_URL } from '../lib/api';

// ─── Data ─────────────────────────────────────────────────────────────────────
// ... (PLANS, FEATURES, etc.)

const FEATURES = [
  { label: 'Trust Score', free: true, pro: true, proplus: true, business: true, admin: true },
  { label: 'Identity Linking', free: '2 accounts', pro: 'Unlimited', proplus: 'Unlimited', business: 'Unlimited', admin: 'Unlimited' },
  { label: 'Behavior Insights', free: false, pro: true, proplus: true, business: true, admin: true },
  { label: 'Fraud Detection', free: false, pro: false, proplus: true, business: true, admin: true },
  { label: 'Real-time Updates', free: false, pro: false, proplus: true, business: true, admin: true },
  { label: 'API Access', free: '500 calls', pro: '10K calls', proplus: '50K calls', business: 'Unlimited', admin: 'Unlimited' },
  { label: 'Analytics Dashboard', free: 'Basic', pro: 'Standard', proplus: 'Advanced', business: 'Custom', admin: 'Custom (Admin)' },
  { label: 'Bulk Verification', free: false, pro: false, proplus: false, business: true, admin: true },
  { label: 'Team Collaboration', free: false, pro: false, proplus: false, business: true, admin: true },
  { label: 'Support', free: 'Community', pro: 'Email', proplus: 'Priority', business: 'Dedicated', admin: 'Founder Support' },
];

const FAQS = [
  {
    q: 'Can I upgrade anytime?',
    a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated automatically.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support within 14 days for a full refund.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All data is encrypted at rest and in transit. We use bank-grade AES-256 encryption and comply with GDPR and India\'s DPDP Act.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Your plan continues until the end of your billing period. After that, you\'ll drop to the Free plan — your data is never deleted.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Check() {
  return <span style={{ color: '#00B300', fontWeight: 900, fontSize: '1.1rem' }}>✓</span>;
}
function Cross() {
  return <span style={{ color: '#ccc', fontWeight: 900, fontSize: '1rem' }}>✕</span>;
}

function FeatureCell({ val }: { val: boolean | string }) {
  if (val === true) return <Check />;
  if (val === false) return <Cross />;
  return <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{val}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface DBPlan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
}

export default function Pricing() {
  const [plans, setPlans] = useState<(DBPlan & { monthly: number; yearly: number; color: string; btnColor: string; btnText: string; highlight: boolean; cta: string; tag: string | null })[]>([]);
  const [yearly, setYearly] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [showUpi, setShowUpi] = useState<{ amount: number; planId: string; planName: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; callback?: () => void } | null>(null);
  const navigate = useNavigate();
  const { isGuest } = useGuest();

  useEffect(() => {
    async function checkAdmin() {
      // Never grant admin in guest mode
      if (isGuest) { setIsAdmin(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(isAdminEmail(user?.email));
    }
    checkAdmin();

    async function fetchPlans() {
      const { data } = await supabase.from('plans').select('*').order('monthly_price', { ascending: true });
      if (data) {
        // Map database fields to the UI expected format
        const uiPlans = data.map((dbPlan: DBPlan) => ({
          ...dbPlan,
          monthly: dbPlan.monthly_price,
          yearly: dbPlan.yearly_price,
          // Merge with UI-only visual properties from the original constant if needed
          color: dbPlan.id === 'admin' ? '#FF60B5' : (dbPlan.id === 'business' ? '#0A1B3F' : (dbPlan.id === 'proplus' ? '#FFE600' : '#fff')),
          btnColor: dbPlan.id === 'admin' ? '#000' : (dbPlan.id === 'pro' ? '#0057FF' : (dbPlan.id === 'business' ? '#FFE600' : '#000')),
          btnText: dbPlan.id === 'pro' || dbPlan.id === 'business' ? '#fff' : '#FFE600',
          highlight: dbPlan.id === 'proplus',
          cta: dbPlan.id === 'admin' ? 'Activate Admin Elite' : (dbPlan.id === 'free' ? 'Get Started' : (dbPlan.id === 'pro' ? 'Upgrade to Pro' : (dbPlan.id === 'proplus' ? 'Get Pro Plus' : 'Contact Sales'))),
          tag: dbPlan.id === 'admin' ? 'Designated Admin Only' : (dbPlan.id === 'proplus' ? 'Best Value' : (dbPlan.id === 'business' ? 'For Teams' : null)),
        }));
        setPlans(uiPlans);
      }
    }
    fetchPlans();

    // Set up Realtime Subscription for plans table
    const plansChannel = supabase
      .channel('public-plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => {
        console.log('Real-time plans change detected on Pricing page');
        fetchPlans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(plansChannel);
    };
  }, [isGuest]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlanSelect = async (planId: string) => {
    // Guest users: redirect to login/signup
    if (isGuest) {
      navigate('/login');
      return;
    }

    try {
      setLoading(planId);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // If it's free or admin plan (since designated admins get full access), apply directly
      if (planId === 'free' || (planId === 'admin' && isAdmin)) {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: planId })
          .eq('id', user.id);

        if (error) throw error;
        
        // Success - redirect to dashboard
        navigate('/dashboard');
        return;
      }

      // ── Razorpay Payment Checkout ──
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }

      const amountToPay = yearly ? selectedPlan.yearly * 12 : selectedPlan.monthly;

      // 1. Fetch Supabase session authorization token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Connect endpoint through VITE_API_BASE_URL (removing /secure if nested to target the base router path)
      const baseApiUrl = VITE_API_BASE_URL.replace('/api/v1/secure', '/api/v1');
      const orderRes = await fetch(`${baseApiUrl}/payment/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ amount: amountToPay, planId })
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create billing order on backend.');
      }

      const orderData = await orderRes.json();

      // 2. Load dynamic SDK Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setNotification({
          message: 'Razorpay SDK failed to load. Please verify your internet connection.',
          type: 'error'
        });
        return;
      }

      // 3. Configure Checkout Options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Crifolayer Trust passport',
        description: `Upgrade to ${selectedPlan.name} Subscription`,
        image: 'https://raw.githubusercontent.com/Sujoymoulick/TRUST-LAYER/main/frontend/public/logo.png',
        order_id: orderData.isMock ? undefined : orderData.orderId,
        handler: async function () {
          try {
            setLoading(planId);
            // 4. Update the user plan dynamically in Supabase on success
            const { error: updateErr } = await supabase
              .from('profiles')
              .update({ plan: planId })
              .eq('id', user.id);

            if (updateErr) throw updateErr;

            setNotification({
              message: `Successfully upgraded to ${selectedPlan.name}!`,
              type: 'success',
              callback: () => navigate('/dashboard')
            });
          } catch (updateErr: any) {
            console.error('Database plan sync failed:', updateErr);
            setNotification({
              message: 'Your payment was successful, but we failed to update your profile. Please contact Support.',
              type: 'error'
            });
          } finally {
            setLoading(null);
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#FFE600', // Crifolayer signature high-contrast bright brand yellow
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Plan selection error:', err);
      setNotification({
        message: 'Failed to select plan. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Public Sans', sans-serif", background: '#fff', minHeight: '100vh', color: '#000' }}>
      {showUpi && (
        <UPIPayment 
          amount={showUpi.amount}
          planName={showUpi.planName}
          onCancel={() => setShowUpi(null)}
          onSuccess={async () => {
            setLoading(showUpi.planId);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('profiles').update({ plan: showUpi.planId }).eq('id', user.id);
              setShowUpi(null);
              navigate('/dashboard');
            }
          }}
        />
      )}

      {/* ── 1. HEADER ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', borderBottom: '1px solid var(--border-color, #e5e7eb)', background: 'var(--card-bg, #fff)' }}>
        <div className="badge" style={{ 
          background: 'var(--accent, #6366f1)', color: '#fff', display: 'inline-block', marginBottom: 20, 
          fontSize: '0.85rem', fontFamily: "'Public Sans', sans-serif",
          fontWeight: 600, padding: '6px 16px', borderRadius: '9999px', letterSpacing: '0.02em'
        }}>
          🚀 Pricing
        </div>
        <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', lineHeight: 0.96, letterSpacing: '-0.03em', marginBottom: 20, color: 'var(--text-primary, #000)' }}>
          Choose Your<br />Trust Plan
        </h1>
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: '#444', maxWidth: 520, margin: '0 auto 40px' }}>
          Build credibility. Reduce risk. Unlock opportunities.
        </p>

        {/* Admin Toolbar */}
        {isAdmin && (
          <div style={{ 
            background: 'var(--bg-primary, #f9fafb)', padding: '10px 20px', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', gap: 15, marginBottom: 30,
            fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary, #000)'
          }}>
            <span>Admin Control</span>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ background: isEditing ? 'var(--accent, #6366f1)' : '#fff', color: isEditing ? '#fff' : 'var(--text-primary, #000)', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
            >
              {isEditing ? 'Exit Edit Mode' : 'Edit All Prices'}
            </button>
          </div>
        )}

        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 12, padding: '10px 20px', background: 'var(--bg-primary, #f9fafb)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', opacity: yearly ? 0.4 : 1, color: 'var(--text-primary, #000)' }}>Monthly</span>
          <button
            onClick={() => setYearly(y => !y)}
            style={{
              width: 48, height: 26, border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 9999, background: yearly ? 'var(--accent, #6366f1)' : '#e5e7eb',
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s', outline: 'none',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: yearly ? 25 : 3,
              width: 18, height: 18, background: '#fff', borderRadius: '50%',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', opacity: yearly ? 1 : 0.4, color: 'var(--text-primary, #000)' }}>
            Yearly <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: 9999, padding: '1px 8px', fontSize: '0.7rem', marginLeft: 4, fontWeight: 600 }}>Save 20%</span>
          </span>
        </div>
      </section>

      {/* ── 2. PRICING CARDS ── */}
      <section style={{ padding: '64px 24px', background: 'var(--bg-primary, #f9fafb)', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
          maxWidth: 1200,
          margin: '0 auto',
          alignItems: 'end',
        }}>
          {plans.filter(plan => isAdmin || plan.id !== 'admin').map(plan => {
            const price = yearly ? plan.yearly : plan.monthly;
            const isBlack = plan.color === '#0A1B3F';
            const textColor = isBlack ? '#fff' : '#000';
            return (
              <div
                key={plan.id}
                style={{
                  background: 'var(--card-bg, #fff)',
                  border: `1px solid var(--border-color, #e5e7eb)`,
                  borderRadius: 16,
                  boxShadow: plan.highlight ? '0 8px 30px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                  padding: plan.highlight ? '40px 28px 36px' : '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  position: 'relative',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.highlight ? '0 16px 40px rgba(0,0,0,0.16)' : '0 8px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.highlight ? '0 8px 30px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)';
                }}
              >
                {/* Tag */}
                {plan.tag && (
                  <div style={{
                    position: 'absolute', top: -14, left: 20,
                    background: 'var(--accent, #6366f1)',
                    color: '#fff', borderRadius: 9999,
                    padding: '3px 14px', fontFamily: "'Public Sans', sans-serif",
                    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.03em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    {plan.tag}
                  </div>
                )}
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111', marginBottom: 16 }}>
                  {plan.name}
                </div>

                <div style={{ marginBottom: 28 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280' }}>Monthly (₹)</div>
                      <input 
                        id={`m-${plan.id}`}
                        type="number"
                        defaultValue={plan.monthly}
                        style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 8, fontWeight: 600, background: '#fff', color: '#111' }}
                      />
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280' }}>Yearly (₹/mo)</div>
                      <input 
                        id={`y-${plan.id}`}
                        type="number"
                        defaultValue={plan.yearly}
                        style={{ width: '100%', padding: '6px', border: '3px solid #000', fontWeight: 900, background: '#fff', color: '#000' }}
                      />
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          const m = parseInt((document.getElementById(`m-${plan.id}`) as HTMLInputElement).value);
                          const y = parseInt((document.getElementById(`y-${plan.id}`) as HTMLInputElement).value);
                          setLoading(plan.id);
                          const { error } = await supabase.from('plans').update({ monthly_price: m, yearly_price: y }).eq('id', plan.id);
                          if (!error) {
                            setNotification({
                              message: `${plan.name} updated!`,
                              type: 'success',
                              callback: () => window.location.reload()
                            });
                          } else {
                            setNotification({
                              message: error.message,
                              type: 'error'
                            });
                          }
                          setLoading(null);
                        }}
                        style={{ 
                          marginTop: 10, background: 'var(--accent, #6366f1)', color: '#fff', border: 'none', borderRadius: 8,
                          padding: '8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}
                      >
                        {loading === plan.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '3.2rem', lineHeight: 1, color: textColor }}>
                        {price === 0 ? 'Free' : `₹${price}`}
                      </span>
                      {price > 0 && (
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isBlack ? 'rgba(255,255,255,0.6)' : '#555', marginLeft: 6 }}>
                          /mo
                        </span>
                      )}
                      {yearly && price > 0 && (
                        <div style={{ marginTop: 6, fontSize: '0.78rem', fontWeight: 700, color: '#00B300' }}>
                          Billed ₹{price * 12}/year
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-color, #e5e7eb)', marginBottom: 24 }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontWeight: 700, fontSize: '0.88rem', color: textColor }}>
                      <span style={{ color: plan.highlight ? '#000' : '#00B300', fontWeight: 900, marginTop: 1, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={!!loading}
                  style={{
                    width: '100%', padding: '12px', border: 'none', borderRadius: 10,
                    background: 'var(--accent, #6366f1)', color: '#fff',
                    fontFamily: "'Public Sans', sans-serif", fontSize: '0.9rem', fontWeight: 600,
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.1s, box-shadow 0.1s, opacity 0.1s',
                    opacity: loading && loading !== plan.id ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                  onMouseEnter={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; } }}
                  onMouseLeave={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; } }}
                >
                  {loading === plan.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {plan.cta} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. FEATURE COMPARISON ── */}
      <section style={{ padding: '72px 24px', borderBottom: '1px solid var(--border-color, #e5e7eb)', background: 'var(--card-bg, #fff)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center', color: 'var(--text-primary, #000)' }}>
            Compare Plans
          </h2>
          <p style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-secondary, #555)', marginBottom: 40 }}>Everything side by side</p>

          <div style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 20px', background: 'var(--bg-primary, #f9fafb)', color: 'var(--text-primary, #111)', fontFamily: "'Public Sans', sans-serif", fontSize: '0.85rem', fontWeight: 700, textAlign: 'left', borderRight: '1px solid var(--border-color, #e5e7eb)', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                    Feature
                  </th>
                  {['Free', 'Pro', 'Pro Plus', 'Business', ...(isAdmin ? ['Admin Elite'] : [])].map((h, i) => (
                    <th key={h} style={{
                      padding: '16px 20px', textAlign: 'center',
                      background: h === 'Admin Elite' ? 'rgba(var(--accent-rgb),0.1)' : (i === 2 ? 'rgba(var(--accent-rgb),0.08)' : 'var(--bg-primary, #f9fafb)'),
                      color: 'var(--text-primary, #111)',
                      fontFamily: "'Public Sans', sans-serif", fontSize: '0.85rem', fontWeight: 700,
                      borderRight: i < (isAdmin ? 4 : 3) ? '1px solid var(--border-color, #e5e7eb)' : 'none',
                      borderBottom: '1px solid var(--border-color, #e5e7eb)',
                    }}>
                      {h}
                      {i === 2 && <div style={{ fontWeight: 600, fontSize: '0.65rem', marginTop: 2, color: 'var(--text-secondary, #555)' }}>⭐ Best Value</div>}
                      {h === 'Admin Elite' && <div style={{ fontWeight: 600, fontSize: '0.65rem', marginTop: 2, color: 'var(--text-secondary, #555)' }}>👑 Dynamic Admin</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? 'var(--card-bg, #fff)' : 'var(--bg-primary, #f9fafb)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.88rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', borderRight: '1px solid var(--border-color, #e5e7eb)', color: 'var(--text-primary, #000)' }}>
                      {row.label}
                    </td>
                    {(isAdmin ? (['free', 'pro', 'proplus', 'business', 'admin'] as const) : (['free', 'pro', 'proplus', 'business'] as const)).map((key, j) => (
                      <td key={key} style={{
                        padding: '14px 20px', textAlign: 'center',
                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        borderRight: j < (isAdmin ? 4 : 3) ? '1px solid var(--border-color, #e5e7eb)' : 'none',
                        background: key === 'admin' ? 'rgba(var(--accent-rgb),0.04)' : (j === 2 ? 'rgba(var(--accent-rgb),0.04)' : 'transparent'),
                      }}>
                        <FeatureCell val={row[key as keyof typeof row] as any} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 4. TRUST SCORE VISUAL ── */}
      <section style={{ padding: '72px 24px', background: 'var(--bg-primary, #f0f4ff)', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: 'var(--text-primary, #111)', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Unlock Your True Score
          </h2>
          <p style={{ fontWeight: 500, color: 'var(--text-secondary, #555)', marginBottom: 52, fontSize: '1.05rem' }}>
            Better plan → Higher trust → More opportunities
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {[
              { plan: 'Free', score: 620, bar: '62%', bg: 'var(--card-bg, #fff)', textColor: 'var(--text-primary, #000)', scoreColor: 'var(--text-secondary, #555)' },
              { plan: 'Pro', score: 760, bar: '76%', bg: '#eff6ff', textColor: '#1d4ed8', scoreColor: '#2563eb' },
              { plan: 'Pro Plus', score: 890, bar: '89%', bg: '#f0fdf4', textColor: '#15803d', scoreColor: '#16a34a', star: true },
              { plan: 'Business', score: 970, bar: '97%', bg: '#fdf4ff', textColor: '#7e22ce', scoreColor: '#9333ea' },
            ].map(s => (
              <div
                key={s.plan}
                style={{ background: s.bg, border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 16, boxShadow: s.star ? '0 0 0 3px #6366f1, 0 8px 24px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.06)', padding: '28px 20px', position: 'relative' }}
              >
                {s.star && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent, #6366f1)', color: '#fff', borderRadius: 9999, padding: '3px 14px', fontFamily: "'Public Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    ★ Best Value
                  </div>
                )}
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '0.8rem', color: s.textColor, marginBottom: 16, letterSpacing: '0.04em' }}>{s.plan}</div>
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '3.5rem', color: s.scoreColor, lineHeight: 1, marginBottom: 16 }}>{s.score}</div>
                <div style={{ height: 8, background: 'var(--border-color, #e5e7eb)', borderRadius: 9999, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ width: s.bar, height: '100%', background: s.scoreColor, borderRadius: 9999 }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.scoreColor, opacity: 0.8 }}>Trust Score</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FAQ ── */}
      <section style={{ padding: '72px 24px 80px', background: 'var(--card-bg, #fff)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center', color: 'var(--text-primary, #000)' }}>
            Got Questions?
          </h2>
          <p style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-secondary, #555)', marginBottom: 48 }}>Frequently asked questions</p>

          <div style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border-color, #e5e7eb)' : 'none' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '20px 24px', background: openFaq === i ? 'var(--bg-primary, #f9fafb)' : 'transparent',
                    border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontFamily: "'Public Sans', sans-serif", fontSize: '1rem', fontWeight: 600,
                    textAlign: 'left', transition: 'background 0.15s', color: 'var(--text-primary, #000)',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0, marginLeft: 16, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', color: 'var(--text-secondary, #555)' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '4px 24px 24px', background: 'var(--bg-primary, #f9fafb)', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
                    <p style={{ fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary, #444)', marginTop: 16 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA STRIP ── */}
      <div style={{ background: 'var(--bg-primary, #f9fafb)', borderTop: '1px solid var(--border-color, #e5e7eb)', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, maxWidth: '100%' }}>
        <div>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary, #000)' }}>
            Ready to build trust at scale?
          </div>
          <div style={{ fontWeight: 500, color: 'var(--text-secondary, #555)', marginTop: 4 }}>Start free. Upgrade anytime. No hidden fees.</div>
        </div>
        <button
          onClick={() => handlePlanSelect('free')}
          disabled={!!loading}
          style={{
            background: 'var(--accent, #6366f1)', color: '#fff', border: 'none', borderRadius: 12,
            padding: '14px 36px', fontFamily: "'Public Sans', sans-serif",
            fontSize: '1rem', fontWeight: 600, boxShadow: '0 4px 16px rgba(var(--accent-rgb),0.3)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.1s, box-shadow 0.1s',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 10
          }}
          onMouseEnter={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(var(--accent-rgb),0.4)'; } }}
          onMouseLeave={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(var(--accent-rgb),0.3)'; } }}
        >
          {loading === 'free' ? <Loader2 className="animate-spin" size={20} /> : 'Get Started for Free →'}
        </button>
      </div>

      {/* ── CUSTOM NEO-BRUTALIST NOTIFICATION MODAL ── */}
      {notification && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 24, backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            maxWidth: 460,
            width: '100%',
            position: 'relative',
            fontFamily: "'Public Sans', sans-serif",
            animation: 'modalSlideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header / Accent Bar */}
            <div style={{
              background: notification.type === 'success' ? 'rgba(16,185,129,0.08)' : (notification.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(var(--accent-rgb),0.08)'),
              borderBottom: '1px solid var(--border-color, #e5e7eb)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: '1.4rem' }}>
                {notification.type === 'success' ? '✅' : (notification.type === 'error' ? '❌' : 'ℹ️')}
              </span>
              <span style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: '1rem',
                fontWeight: 700,
                color: notification.type === 'success' ? '#059669' : (notification.type === 'error' ? '#dc2626' : 'var(--accent, #6366f1)'),
              }}>
                {notification.type === 'success' ? 'Success' : (notification.type === 'error' ? 'Error' : 'Notice')}
              </span>
            </div>

            {/* Content */}
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <p style={{
                fontWeight: 600,
                color: 'var(--text-primary, #000)',
                fontSize: '1.05rem',
                lineHeight: 1.6,
                margin: '0 0 28px',
                wordBreak: 'break-word'
              }}>
                {notification.message}
              </p>

              {/* Action Button */}
              <button
                onClick={() => {
                  const cb = notification.callback;
                  setNotification(null);
                  if (cb) cb();
                }}
                style={{
                  background: 'var(--accent, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 40px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.3)',
                  cursor: 'pointer',
                  transition: 'opacity 0.1s',
                  outline: 'none'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
