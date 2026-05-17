import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { isAdminEmail } from '../lib/utils';
import { UPIPayment } from '../components/UPIPayment';
import { useGuest } from '../context/GuestContext';

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

      // If it's a paid plan (and NOT the admin plan for designated admins), show UPI modal
      if (planId !== 'free' && (planId !== 'admin' || !isAdmin)) {
        const selectedPlan = plans.find(p => p.id === planId);
        if (selectedPlan) {
          setShowUpi({
            amount: yearly ? selectedPlan.yearly * 12 : selectedPlan.monthly,
            planId: planId,
            planName: selectedPlan.name
          });
          setLoading(null);
          return;
        }
      }

      // If it's free or admin plan (since designated admins get full access), apply directly
      const { error } = await supabase
        .from('profiles')
        .update({ plan: planId })
        .eq('id', user.id);

      if (error) throw error;
      
      // Success - redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Plan selection error:', err);
      alert('Failed to select plan. Please try again.');
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
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', borderBottom: '3px solid #000', background: '#fff' }}>
        <div className="badge" style={{ 
          background: '#FF60B5', color: '#fff', display: 'inline-block', marginBottom: 20, 
          fontSize: '0.9rem', fontFamily: "'Archivo Black', sans-serif", textTransform: 'uppercase', 
          fontWeight: 900, padding: '6px 16px', border: '3px solid #000', 
          boxShadow: '4px 4px 0px #000', letterSpacing: '0.05em'
        }}>
          🚀 Pricing
        </div>
        <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', textTransform: 'uppercase', lineHeight: 0.92, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Choose Your<br />Trust Plan
        </h1>
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: '#444', maxWidth: 520, margin: '0 auto 40px' }}>
          Build credibility. Reduce risk. Unlock opportunities.
        </p>

        {/* Admin Toolbar */}
        {isAdmin && (
          <div style={{ 
            background: '#FFE600', padding: '10px 20px', border: '3px solid #000', 
            display: 'inline-flex', alignItems: 'center', gap: 15, marginBottom: 30,
            boxShadow: '4px 4px 0px #000', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem'
          }}>
            <span>Admin Control</span>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ background: isEditing ? '#000' : '#fff', color: isEditing ? '#fff' : '#000', border: '2px solid #000', padding: '4px 12px', cursor: 'pointer', fontWeight: 900 }}
            >
              {isEditing ? 'Exit Edit Mode' : 'Edit All Prices'}
            </button>
          </div>
        )}

        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, border: '3px solid #000', padding: '10px 20px', boxShadow: '4px 4px 0px #000', background: '#F5F5F5' }}>
          <span style={{ fontWeight: 900, fontSize: '0.9rem', opacity: yearly ? 0.4 : 1 }}>MONTHLY</span>
          <button
            onClick={() => setYearly(y => !y)}
            style={{
              width: 56, height: 28, border: '3px solid #000', background: yearly ? '#000' : '#FFE600',
              position: 'relative', cursor: 'pointer', transition: 'background 0.15s', outline: 'none',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: yearly ? 27 : 2,
              width: 18, height: 18, background: yearly ? '#FFE600' : '#000',
              transition: 'left 0.15s',
            }} />
          </button>
          <span style={{ fontWeight: 900, fontSize: '0.9rem', opacity: yearly ? 1 : 0.4 }}>
            YEARLY <span style={{ background: '#00FF00', border: '2px solid #000', padding: '1px 8px', fontSize: '0.7rem', marginLeft: 4 }}>SAVE 20%</span>
          </span>
        </div>
      </section>

      {/* ── 2. PRICING CARDS ── */}
      <section style={{ padding: '64px 24px', background: '#F5F5F5', borderBottom: '3px solid #000' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 28,
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
                  background: plan.color,
                  border: `3px solid #000`,
                  boxShadow: plan.highlight ? '10px 10px 0px #000' : '6px 6px 0px #000',
                  padding: plan.highlight ? '40px 28px 36px' : '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  position: 'relative',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-3px, -3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.highlight ? '13px 13px 0px #000' : '9px 9px 0px #000';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = plan.highlight ? '10px 10px 0px #000' : '6px 6px 0px #000';
                }}
              >
                {/* Tag */}
                {plan.tag && (
                  <div style={{
                    position: 'absolute', top: -16, left: 20,
                    background: plan.highlight ? '#FF60B5' : '#0057FF',
                    color: '#fff', border: '3px solid #000',
                    padding: '3px 14px', fontFamily: "'Archivo Black', sans-serif",
                    fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    boxShadow: '3px 3px 0px #000',
                  }}>
                    {plan.tag}
                  </div>
                )}

                {/* Plan Name */}
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.1rem', textTransform: 'uppercase', color: textColor, marginBottom: 20, letterSpacing: '0.04em' }}>
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 28 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: textColor }}>Monthly (₹)</div>
                      <input 
                        id={`m-${plan.id}`}
                        type="number"
                        defaultValue={plan.monthly}
                        style={{ width: '100%', padding: '6px', border: '3px solid #000', fontWeight: 900, background: '#fff', color: '#000' }}
                      />
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: textColor }}>Yearly (₹/mo)</div>
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
                            alert(`${plan.name} updated!`);
                            window.location.reload();
                          } else {
                            alert(error.message);
                          }
                          setLoading(null);
                        }}
                        style={{ 
                          marginTop: 10, background: '#00FF00', color: '#000', border: '3px solid #000', 
                          padding: '8px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer',
                          boxShadow: '4px 4px 0px #000'
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
                <div style={{ height: 3, background: isBlack ? 'rgba(255,255,255,0.2)' : '#000', marginBottom: 24 }} />

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
                    width: '100%', padding: '14px', border: '3px solid #000',
                    background: plan.btnColor, color: plan.btnText,
                    fontFamily: "'Archivo Black', sans-serif", fontSize: '0.9rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    boxShadow: '4px 4px 0px #000', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.08s, box-shadow 0.08s',
                    opacity: loading && loading !== plan.id ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                  onMouseEnter={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 0px #000'; } }}
                  onMouseLeave={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0px #000'; } }}
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
      <section style={{ padding: '72px 24px', borderBottom: '3px solid #000', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center' }}>
            Compare Plans
          </h2>
          <p style={{ textAlign: 'center', fontWeight: 600, color: '#555', marginBottom: 40 }}>Everything side by side</p>

          <div style={{ border: '3px solid #000', boxShadow: '8px 8px 0px #000', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 20px', background: '#000', color: '#fff', fontFamily: "'Archivo Black', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'left', borderRight: '3px solid #333' }}>
                    Feature
                  </th>
                  {['Free', 'Pro', 'Pro Plus', 'Business', ...(isAdmin ? ['Admin Elite'] : [])].map((h, i) => (
                    <th key={h} style={{
                      padding: '16px 20px', textAlign: 'center',
                      background: h === 'Admin Elite' ? '#FF60B5' : (i === 2 ? '#FFE600' : '#000'),
                      color: h === 'Admin Elite' || i === 2 ? '#000' : '#fff',
                      fontFamily: "'Archivo Black', sans-serif", fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      borderRight: i < (isAdmin ? 4 : 3) ? '3px solid #333' : 'none',
                    }}>
                      {h}
                      {i === 2 && <div style={{ fontWeight: 700, fontSize: '0.65rem', marginTop: 2, textTransform: 'none', fontFamily: "'Public Sans', sans-serif" }}>⭐ Best Value</div>}
                      {h === 'Admin Elite' && <div style={{ fontWeight: 700, fontSize: '0.65rem', marginTop: 2, textTransform: 'none', fontFamily: "'Public Sans', sans-serif" }}>👑 Dynamic Admin</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#F9F9F9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.88rem', borderBottom: '2px solid #000', borderRight: '3px solid #000' }}>
                      {row.label}
                    </td>
                    {(isAdmin ? (['free', 'pro', 'proplus', 'business', 'admin'] as const) : (['free', 'pro', 'proplus', 'business'] as const)).map((key, j) => (
                      <td key={key} style={{
                        padding: '14px 20px', textAlign: 'center',
                        borderBottom: '2px solid #000',
                        borderRight: j < (isAdmin ? 4 : 3) ? '2px solid #ddd' : 'none',
                        background: key === 'admin' ? 'rgba(255,96,181,0.08)' : (j === 2 ? 'rgba(255,230,0,0.08)' : 'transparent'),
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
      <section style={{ padding: '72px 24px', background: '#0A1B3F', borderBottom: '3px solid #000' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', textTransform: 'uppercase', color: '#FFE600', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Unlock Your True Score
          </h2>
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 52, fontSize: '1.05rem' }}>
            Better plan → Higher trust → More opportunities
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {[
              { plan: 'Free', score: 620, bar: '62%', color: '#fff', textColor: '#000', scoreColor: '#555' },
              { plan: 'Pro', score: 760, bar: '76%', color: '#0057FF', textColor: '#fff', scoreColor: '#FFE600' },
              { plan: 'Pro Plus', score: 890, bar: '89%', color: '#FFE600', textColor: '#000', scoreColor: '#000', star: true },
              { plan: 'Business', score: 970, bar: '97%', color: '#FF60B5', textColor: '#fff', scoreColor: '#fff' },
            ].map(s => (
              <div
                key={s.plan}
                style={{ background: s.color, border: '3px solid #000', boxShadow: s.star ? '0 0 0 4px #FFE600, 0 0 0 7px #000' : '6px 6px 0px #000', padding: '28px 20px', position: 'relative' }}
              >
                {s.star && (
                  <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', background: '#FF60B5', color: '#fff', border: '3px solid #000', padding: '3px 14px', fontFamily: "'Archivo Black', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '3px 3px 0px #000' }}>
                    ★ Best Value
                  </div>
                )}
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase', color: s.textColor, marginBottom: 16, letterSpacing: '0.06em' }}>{s.plan}</div>
                <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '3.5rem', color: s.scoreColor, lineHeight: 1, marginBottom: 16 }}>{s.score}</div>
                <div style={{ height: 10, background: 'rgba(0,0,0,0.15)', border: '2px solid rgba(0,0,0,0.3)', marginBottom: 8 }}>
                  <div style={{ width: s.bar, height: '100%', background: s.textColor === '#000' ? '#000' : 'rgba(255,255,255,0.8)' }} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: s.scoreColor, opacity: 0.7 }}>Trust Score</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FAQ ── */}
      <section style={{ padding: '72px 24px 80px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center' }}>
            Got Questions?
          </h2>
          <p style={{ textAlign: 'center', fontWeight: 600, color: '#555', marginBottom: 48 }}>Frequently asked questions</p>

          <div style={{ border: '3px solid #000', boxShadow: '8px 8px 0px #000' }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{ borderBottom: i < FAQS.length - 1 ? '3px solid #000' : 'none' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '20px 24px', background: openFaq === i ? '#FFE600' : '#fff',
                    border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontFamily: "'Archivo Black', sans-serif", fontSize: '1rem',
                    textTransform: 'uppercase', textAlign: 'left', transition: 'background 0.1s',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0, marginLeft: 16, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '4px 24px 24px', background: '#FFF9D6', borderTop: '2px dashed #000' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.7, color: '#333', marginTop: 16 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA STRIP ── */}
      <div style={{ background: '#FFE600', borderTop: '3px solid #000', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, maxWidth: '100%' }}>
        <div>
          <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            Ready to build trust at scale?
          </div>
          <div style={{ fontWeight: 600, color: '#444', marginTop: 4 }}>Start free. Upgrade anytime. No hidden fees.</div>
        </div>
        <button
          onClick={() => handlePlanSelect('free')}
          disabled={!!loading}
          style={{
            background: '#000', color: '#FFE600', border: '3px solid #000',
            padding: '16px 40px', fontFamily: "'Archivo Black', sans-serif",
            fontSize: '1rem', textTransform: 'uppercase', boxShadow: '6px 6px 0px rgba(0,0,0,0.3)',
            cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.05em',
            transition: 'transform 0.08s, box-shadow 0.08s',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 10
          }}
          onMouseEnter={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0px rgba(0,0,0,0.3)'; } }}
          onMouseLeave={e => { if(!loading) { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px rgba(0,0,0,0.3)'; } }}
        >
          {loading === 'free' ? <Loader2 className="animate-spin" size={20} /> : 'Get Started for Free →'}
        </button>
      </div>

    </div>
  );
}
