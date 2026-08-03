import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, TrendingUp, BookOpen, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GraphVisualization } from '../components/GraphVisualization';
import { isAdminEmail, getAdminRoleTitle } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useGuest } from '../context/GuestContext';
import { PremiumOverlay } from '../components/PremiumOverlay';

import linkedinLogo from '../assets/social/linkedin.png';
import googleLogo from '../assets/social/google.png';
import facebookLogo from '../assets/social/facebook.png';
import instagramLogo from '../assets/social/instagram.png';
import githubLogo from '../assets/social/github.png';
import twitterLogo from '../assets/social/twitter.png';
import guestmodeLogo from '../assets/guestmode logo.gif';

interface TrustRecord {
  id: string;
  created_at: string;
  identity_hash: string;
  verification_status: 'pending' | 'verified' | 'failed';
  metadata: Record<string, unknown>;
}

const STATUS_COLOR = { 
  verified: 'text-emerald-400', 
  pending: 'text-amber-400', 
  failed: 'text-red-400' 
} as const;

// Demo data for guest mode
const GUEST_DEMO_RECORDS: TrustRecord[] = [];
const GUEST_CONNECTED_PROVIDERS: string[] = ['github'];
const GUEST_TRUST_SCORE = 320;

export default function Dashboard() {
  const navigate = useNavigate();
  const { isGuest } = useGuest();
  const [records, setRecords] = useState<TrustRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('not_started');
  const [isOwner, setIsOwner] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [realTrustScore, setRealTrustScore] = useState<number | null>(null);
  const [isGlowing, setIsGlowing] = useState(false);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Admin Oversight Dashboard data
  const [oversightData, setOversightData] = useState<any>(null);
  const [oversightLoading, setOversightLoading] = useState(false);
  useEffect(() => {
    // Guest mode: show demo data, never fetch real DB data
    if (isGuest) {
      setRecords(GUEST_DEMO_RECORDS);
      setConnectedProviders(GUEST_CONNECTED_PROVIDERS);
      setPlan('free');
      setKycStatus('not_started');
      setIsOwner(false);
      setRealTrustScore(GUEST_TRUST_SCORE);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Avoid race condition: wait for Supabase to process the OAuth redirect fragment
        if (window.location.hash.includes('access_token')) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError && userError.message !== 'Auth session missing!') {
          throw userError;
        }
        
        setIsOwner(isAdminEmail(user?.email));
        if (user?.email) {
          setUserEmail(user.email);
        }

        if (user) {
          const providers = user.identities?.map((identity: any) => identity.provider) || [];
          setConnectedProviders(providers);
          
          // Fetch Profile for Plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan, kyc_status')
            .eq('id', user.id)
            .single();
          
          let userPlan = profile?.plan || 'free';
          if (user.email && isAdminEmail(user.email) && userPlan !== 'admin') {
            console.log('Upgrading admin to Admin Elite plan in DB...');
            const { error: upgradeError } = await supabase
              .from('profiles')
              .update({ plan: 'admin' })
              .eq('id', user.id);
            if (!upgradeError) {
              userPlan = 'admin';
            }
          }
          setPlan(userPlan);
          setKycStatus(profile?.kyc_status || 'not_started');
        }

        const { data, error } = await supabase
          .from('trust_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          setFetchError(error.message);
          console.error('Supabase fetch error:', error);
        } else {
          setRecords(data || []);
        }

        // Fetch Real Trust Score or Oversight Dashboard from Backend
        if (user) {
          try {
            if (isAdminEmail(user.email)) {
              setOversightLoading(true);
              try {
                const oversight = await apiFetch('/admin/oversight');
                if (oversight && oversight.success) {
                  setOversightData(oversight.data);
                }
              } catch (err) {
                console.error('Error fetching oversight data:', err);
              } finally {
                setOversightLoading(false);
              }
            } else {
              const scoreData = await apiFetch('/trust-score');
              if (scoreData && scoreData.score) {
                setRealTrustScore(scoreData.score);
              }
            }

            // Fetch initial activity logs
            const { data: logs } = await supabase
              .from('activity_logs')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5);
            if (logs) setActivityFeed(logs);

            // Subscribe to real-time changes
            supabase.channel('dashboard_updates')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'trust_scores', filter: `user_id=eq.${user.id}` }, (payload: any) => {
                if (payload.new && (payload.new as any).final_score !== undefined) {
                   setRealTrustScore((payload.new as any).final_score);
                   setIsGlowing(true);
                   setTimeout(() => setIsGlowing(false), 3000);
                }
              })
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `user_id=eq.${user.id}` }, (payload: any) => {
                if (payload.new) {
                   setActivityFeed(prev => [payload.new, ...prev].slice(0, 5));
                   if (payload.new.type === 'admin_adjustment' || payload.new.type === 'admin_sync') {
                     setToastMessage('Your Crifolayer Trust Score has been updated by the network coordinator.');
                     setTimeout(() => setToastMessage(null), 6000);
                   }
                }
              })
              .subscribe();

          } catch (err) {
            console.warn('Failed to fetch real-time data:', err);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setFetchError(message);
        console.error('Connection error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    return () => {
      supabase.removeAllChannels();
    };
  }, [isGuest]);

  const trustScore = realTrustScore || (records.length > 0 
    ? Math.min(600 + (records.filter(r => r.verification_status === 'verified').length * 40), 999)
    : 450);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleConnect = async (provider: string) => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin + '/dashboard',
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to connect account. Ensure the provider is enabled in Supabase.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      
      {/* Real-time Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-bounce">
          <div className="bg-[var(--card-bg)] border border-[#00E5FF] rounded-xl shadow-md flex items-center gap-4 px-6 py-4 max-w-sm">
            <div className="p-2 border border-[#00E5FF] rounded-lg animate-pulse">
              <Sparkles size={24} className="text-[#00E5FF]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--text-primary)]">System Update</p>
              <p className="text-xs font-medium mt-1 font-mono text-[var(--text-secondary)]">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Phase 1: Claim Trust Passport Banner — hide for guests (show sign-up CTA instead) */}
      {!loading && !isGuest && kycStatus === 'not_started' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-3xl">
              🛂
            </div>
            <div>
              <h4 className="font-bold text-xl leading-snug text-[var(--text-primary)]">Claim Your Trust Passport</h4>
              <p className="text-sm font-medium mt-1 text-[var(--text-secondary)]">Initialize your global reputation and link your first signals to start building trust.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/identity')}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white whitespace-nowrap" style={{ background: 'var(--accent)' }}
          >
            Claim Your Passport
          </button>
        </div>
      )}
      {/* Passport mini-card — only shown when KYC verified */}
      {!loading && !isGuest && kycStatus === 'verified' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent)' }}>
              <BookOpen className="size-8 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-xl leading-snug text-[var(--text-primary)]">Trust Passport Active</h4>
              <p className="text-sm font-medium mt-1 text-[var(--text-secondary)]">Your verified identity passport is ready. View all linked accounts, address details &amp; trust graph.</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="rounded-full border border-emerald-500 text-emerald-500 px-3 py-0.5 text-xs font-medium">✓ KYC Verified</span>
                <span className="rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] px-3 py-0.5 text-xs font-medium">{connectedProviders.length} apps linked</span>
                <span className="rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] px-3 py-0.5 text-xs font-medium">Score: {trustScore}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/passport')}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white whitespace-nowrap" style={{ background: 'var(--accent)' }}
          >
            View Full Passport →
          </button>
        </div>
      )}

      {isGuest && (
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
              <img src={guestmodeLogo} alt="Guest Mode Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-xl leading-snug text-[var(--text-primary)]">You're Viewing Demo Data</h4>
              <p className="text-sm font-medium mt-1 text-[var(--text-secondary)]">Create a free account to build your real trust score and link identities.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white whitespace-nowrap" style={{ background: 'var(--accent)' }}
          >
            Create Free Account →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left Column: Trust Score + Connected Accounts */}
      <div className="lg:col-span-4 space-y-8">
        {isOwner ? (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-md p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <ShieldAlert size={20} className="text-[#00E5FF] animate-pulse shrink-0" />
              <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight">Oversight Dashboard</h3>
            </div>
            
            {oversightLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-[#00E5FF]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Loading metrics...</span>
              </div>
            ) : oversightData ? (
              <div className="space-y-4">
                {/* Aggregates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]">
                    <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Total Users</span>
                    <span className="font-bold text-2xl text-[var(--text-primary)]">{oversightData.aggregates.totalUsers}</span>
                  </div>
                  <div className="p-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]">
                    <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Verified KYC</span>
                    <span className="font-bold text-2xl text-emerald-400">{oversightData.aggregates.verifiedUsers}</span>
                  </div>
                  <div className="p-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]">
                    <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Pending KYC</span>
                    <span className="font-bold text-2xl text-amber-400">{oversightData.aggregates.pendingKyc}</span>
                  </div>
                  <div className="p-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]">
                    <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Average Score</span>
                    <span className="font-bold text-2xl text-[#00E5FF]">{oversightData.aggregates.averageScore}</span>
                  </div>
                </div>

                {/* Verification Trends */}
                <div className="border-t border-[var(--border-color)] pt-4">
                  <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex justify-between">
                    <span>Verification Trend</span>
                    <span className="text-xs text-emerald-400">▲ 15% this week</span>
                  </h4>
                  <div className="flex items-end justify-between h-20 px-2 pt-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                    {oversightData.trends.verifications.map((val: number, idx: number) => {
                      const maxVal = Math.max(...oversightData.trends.verifications);
                      const heightPercent = (val / maxVal) * 100;
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 group relative">
                          <div 
                            className="w-4 bg-brutal-green border-t border-black hover:bg-[#00E5FF] transition-colors" 
                            style={{ height: `${Math.max(5, heightPercent * 0.6)}px` }} 
                          />
                          <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase leading-none">
                            {oversightData.trends.labels[idx]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Anomaly Alerts */}
                <div className="border-t border-[var(--border-color)] pt-4 space-y-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)] block">Active Safety Alerts</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {oversightData.alerts.map((alert: any) => (
                      <div key={alert.id} className={`p-2 border-l-4 text-[9px] uppercase font-bold bg-white/5 ${
                        alert.severity === 'critical' ? 'border-brutal-pink text-brutal-pink' : alert.severity === 'high' ? 'border-[#FF5F00] text-[#FF5F00]' : 'border-brutal-yellow text-brutal-yellow'
                      }`}>
                        <div className="flex justify-between items-center font-bold">
                          <span>{alert.title}</span>
                          <span className="text-[7px] text-gray-400">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[8px] text-white/80 mt-0.5 lowercase font-normal leading-normal first-letter:uppercase">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] text-center font-medium">Failed to load metrics.</p>
            )}
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6 flex flex-col items-center text-center gap-4 py-8">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight">Your Trust Score</h3>
            </div>
            <div className={`relative flex items-center justify-center w-48 h-48 rounded-full border-8 transition-all duration-1000 ${isGlowing ? 'border-transparent shadow-[0_0_30px_#00E5FF,inset_0_0_30px_#00E5FF]' : 'border-[var(--border-color)]'}`}>
              <div className={`absolute inset-0 rounded-full transition-opacity duration-1000 ${isGlowing ? 'opacity-100 bg-[#00E5FF]/20' : 'opacity-0'}`} />
              <div className={`font-display text-7xl leading-none z-10 transition-colors duration-1000 ${isGlowing ? 'text-white' : ''} drop-shadow-md`}>
                {loading ? <Loader2 className="animate-spin" /> : trustScore}
              </div>
            </div>
            <div className="progress-track w-full mt-4">
              <div className={`progress-fill transition-all duration-1000 ${isGlowing ? 'bg-[#00E5FF]' : ''}`} style={{ width: `${(trustScore / 1000) * 100}%` }} />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <span className="font-semibold text-sm text-emerald-400">
                {isGuest ? 'Demo Mode' : (trustScore > 800 ? 'Excellent' : trustScore > 600 ? 'Good' : 'Needs Verification')}
              </span>
              
              <div className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-primary)]">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className={(!isGuest && (plan === 'admin' || plan === 'pro' || isOwner)) ? 'text-blue-400' : 'text-[var(--text-secondary)]'} />
                  <span className="font-semibold text-xs text-[var(--text-primary)]">
                    {isGuest ? 'Guest Access' : (isOwner ? `${getAdminRoleTitle(userEmail) || 'Administrator'} (Admin Elite)` : `${plan === 'admin' ? 'Admin Elite' : (plan || 'Free')} Plan`)}
                  </span>
                </div>
                
                {/* Never show Admin Button to guests; show upgrade CTA for guests */}
                {isGuest ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors" style={{ background: 'var(--accent)' }}
                  >
                    Sign Up
                  </button>
                ) : isOwner ? (
                   <button 
                    onClick={() => navigate('/admin')}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700"
                  >
                    Admin Console
                  </button>
                ) : (
                  /* Upgrade Button for others */
                  plan !== 'pro' && (
                    <button 
                      onClick={() => navigate('/pricing')}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors" style={{ background: 'var(--accent)' }}
                    >
                      Upgrade
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight mb-6">Connected Accounts</h3>
          {isGuest && (
            <div className="mb-4 px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-xs font-medium text-[var(--text-secondary)] text-center">
              👁 Demo — Sign in to connect real accounts
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'github', name: 'GitHub', icon: <img src={githubLogo} className="w-5 h-5 object-contain" alt="GitHub" /> },
              { id: 'linkedin_oidc', name: 'LinkedIn', icon: <img src={linkedinLogo} className="w-5 h-5 object-contain" alt="LinkedIn" /> },
              { id: 'google', name: 'Google', icon: <img src={googleLogo} className="w-5 h-5 object-contain" alt="Google" /> },
              { id: 'twitter', name: 'Twitter', icon: <img src={twitterLogo} className="w-5 h-5 object-contain" alt="Twitter" /> },
              { id: 'facebook', name: 'Facebook', icon: <img src={facebookLogo} className="w-5 h-5 object-contain" alt="Facebook" /> },
              { id: 'instagram', name: 'Instagram', icon: <img src={instagramLogo} className="w-5 h-5 object-contain" alt="Instagram" /> },
            ].map(a => {
              const isConnected = !isGuest && connectedProviders.includes(a.id);
              return (
                <button 
                  key={a.id} 
                  onClick={() => isGuest ? navigate('/login') : (!isConnected && handleConnect(a.id))}
                  disabled={isConnected}
                  className={`flex flex-col items-center gap-2 p-3 border border-[var(--border-color)] rounded-xl text-xs font-medium transition-all ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-emerald-600 cursor-default' 
                      : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-primary)] hover:border-[var(--accent)] hover:translate-y-[-2px] hover:shadow-sm active:translate-y-0'
                  }`}
                >
                  <div className={`w-8 h-8 border border-[var(--border-color)] rounded-full flex items-center justify-center text-xs ${isConnected ? 'bg-white' : 'bg-[var(--bg-primary)]'}`}>
                     {a.icon}
                  </div>
                  {a.name}
                  <span className={`text-[10px] font-medium ${isConnected ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                    {isConnected ? 'Connected' : isGuest ? 'Login' : 'Connect'}
                  </span>
                </button>
              );
            })}
            {!isGuest && (
              <button 
                onClick={() => navigate('/identity')}
                className="flex flex-col items-center justify-center gap-2 p-3 border border-dashed border-[var(--border-color)] rounded-xl opacity-50 text-xs font-medium cursor-pointer hover:opacity-100 hover:bg-[var(--bg-primary)] transition-all"
              >
                <div className="w-8 h-8 border border-dashed border-[var(--border-color)] rounded-full flex items-center justify-center text-[var(--text-primary)]">+</div>
                Add new
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Risk Status + Activity Analytics */}
      <div className="lg:col-span-8 space-y-8">
        {isOwner ? (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-400 shrink-0" />
                High-Risk Flagged Users
              </h3>
              <span className="rounded-full border border-red-400 text-red-400 px-3 py-1 text-xs font-medium">
                Oversight Radar
              </span>
            </div>

            {oversightLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-red-400" />
              </div>
            ) : (oversightData && oversightData.highRiskUsers && oversightData.highRiskUsers.length > 0) ? (
              <div className="space-y-3">
                {oversightData.highRiskUsers.map((rUser: any) => (
                  <div 
                    key={rUser.id} 
                    className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-[var(--border-color)] rounded-full bg-[var(--card-bg)] flex items-center justify-center text-xs">
                          👤
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs leading-tight text-[var(--text-primary)]">{rUser.fullName}</h4>
                          <span className="text-xs font-mono text-[var(--text-secondary)]">{rUser.email}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                          rUser.riskLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-400' : 'bg-orange-500/10 text-orange-400 border border-orange-400'
                        }`}>
                          ⚠️ {rUser.riskLevel} Risk
                        </span>
                        <span className="text-xs font-medium rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] px-2 py-0.5">
                          Score: {rUser.score}
                        </span>
                        {rUser.signals.map((sig: string, idx: number) => (
                          <span key={idx} className="text-xs font-medium border border-dashed border-[var(--border-color)] rounded-full px-2 py-0.5 text-[var(--text-secondary)]">
                            {sig}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => navigate('/admin')}
                        className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-700"
                      >
                        Audit Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] font-medium text-center py-6">No high-risk flagged users detected.</p>
            )}
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight mb-6">Score Breakdown (ML Layers)</h3>
            <div className="space-y-4">
              {[
                { label: 'Layer 1: Rules & Blacklists', key: 'rule', color: 'bg-blue-500' },
                { label: 'Layer 2: Behavioral Anomaly', key: 'behavioral', color: 'bg-red-400' },
                { label: 'Layer 3: Graph Collusion', key: 'graph', color: 'bg-amber-400' },
                { label: 'Layer 4: Fingerprinting', key: 'fingerprint', color: 'bg-emerald-400' },
              ].map((layer) => {
                const profileMetadata = records[0]?.metadata as any;
                const score = profileMetadata?.layer_scores?.[layer.key] || (trustScore / 4);
                return (
                  <div key={layer.key}>
                    <div className="flex justify-between text-xs font-medium text-[var(--text-secondary)] mb-1">
                      <span>{layer.label}</span>
                      <span>{Math.round(score)} / 250</span>
                    </div>
                    <div className="h-2 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${layer.color}`} 
                        style={{ width: `${(score / 250) * 100}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center">
              <div className="font-bold text-base text-[var(--text-primary)]">
                {trustScore >= 800 ? 'Elite Tier' : trustScore >= 500 ? 'Verified' : 'Unverified'}
              </div>
              <div className="text-xs font-medium text-[var(--text-secondary)] mt-1">Verified by Crifolayer ML Engine</div>
            </div>
          </div>
        )}

         {/* Live Activity Feed */}
         <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight">Live Activity Feed</h3>
             <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
               <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
               Real-time
             </span>
           </div>
           <div className="space-y-3">
             {activityFeed.length > 0 ? activityFeed.map((log) => (
               <div key={log.id} className="flex flex-col gap-1 pb-3 border-b border-[var(--border-color)] last:border-0">
                 <div className="flex justify-between items-center text-xs font-medium text-[var(--text-secondary)]">
                   <span>{log.type.replace('_', ' ')}</span>
                   <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                 </div>
                 <div className="text-xs font-semibold font-mono text-[var(--text-primary)]">{log.message}</div>
               </div>
             )) : (
               <div className="text-xs font-medium text-[var(--text-secondary)] py-2">No recent activity</div>
             )}
           </div>
         </div>

         <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-xs text-[var(--text-secondary)] tracking-tight mb-8">Recent Activity</h3>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Verification Hash</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-red-500 font-bold uppercase text-xs">
                      Error: {fetchError}
                    </td>
                  </tr>
                ) : records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 font-mono">{r.identity_hash.substring(0, 20)}...</td>
                      <td className="py-3 font-medium">{formatDate(r.created_at)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium border border-[var(--border-color)] ${STATUS_COLOR[r.verification_status]}`}>
                          {r.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-[var(--text-secondary)] font-medium text-xs">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* Network Intelligence Section (Neo4j) */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm p-6 mt-8 relative overflow-hidden">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
          <BookOpen className="text-blue-500" size={24} />
          Identity Graph
        </h3>
        
        {(!isOwner && plan === 'free') ? (
          <PremiumOverlay requiredPlan="Pro" title="Network Intelligence Locked" description="Upgrade to Pro to unlock your identity graph and view real-time relationship data.">
            <GraphVisualization 
              nodes={[
                { id: '1', label: 'You', color: '#3B82F6' },
                { id: '2', label: 'Employer (Verified)', color: '#10B981' },
                { id: '3', label: 'Payment Gateway', color: '#10B981' },
                { id: '4', label: 'Unknown Device', color: '#EF4444' },
              ]}
              edges={[
                { from: '1', to: '2', label: 'TRUSTS' },
                { from: '2', to: '3', label: 'PAID' },
                { from: '4', to: '1', label: 'LINKED' },
              ]}
            />
          </PremiumOverlay>
        ) : (
          <GraphVisualization 
            nodes={[
              { id: '1', label: 'You', color: '#3B82F6' },
              { id: '2', label: 'Employer (Verified)', color: '#10B981' },
              { id: '3', label: 'Payment Gateway', color: '#10B981' },
              { id: '4', label: 'Unknown Device', color: '#EF4444' },
            ]}
            edges={[
              { from: '1', to: '2', label: 'TRUSTS' },
              { from: '2', to: '3', label: 'PAID' },
              { from: '4', to: '1', label: 'LINKED' },
            ]}
          />
        )}
      </div>
    </div>
  );
}
