import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, TrendingUp, BookOpen, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GraphVisualization } from '../components/GraphVisualization';
import { isAdminEmail, getAdminRoleTitle } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useGuest } from '../context/GuestContext';

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
  verified: '#00FF00', 
  pending: '#FFE600', 
  failed: '#FF60B5' 
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
                     setToastMessage('Your Pramaaan Trust Score has been updated by the network coordinator.');
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
          <div className="brutal-card !bg-black !text-[#00E5FF] !border-[#00E5FF] shadow-[6px_6px_0px_#00E5FF] flex items-center gap-4 px-6 py-4 max-w-sm">
            <div className="p-2 border-2 border-[#00E5FF] animate-pulse">
              <Sparkles size={24} className="text-[#00E5FF]" />
            </div>
            <div>
              <p className="font-display text-sm uppercase tracking-widest text-white">System Override</p>
              <p className="text-xs font-bold mt-1 font-mono">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Phase 1: Claim Trust Passport Banner — hide for guests (show sign-up CTA instead) */}
      {!loading && !isGuest && kycStatus === 'not_started' && (
        <div className="brutal-card bg-brutal-yellow flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_#000]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center text-3xl">
              🛂
            </div>
            <div>
              <h4 className="font-display text-xl uppercase leading-none">Claim Your Trust Passport</h4>
              <p className="text-xs font-bold uppercase mt-2">Initialize your global reputation and link your first signals to start building trust.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/identity')}
            className="brutal-btn bg-black text-white px-8 py-3 text-sm font-black uppercase whitespace-nowrap"
          >
            Claim Your Passport
          </button>
        </div>
      )}
      {/* Passport mini-card — only shown when KYC verified */}
      {!loading && !isGuest && kycStatus === 'verified' && (
        <div className="brutal-card bg-black border-4 border-black flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_#000]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 border-4 border-brutal-yellow bg-brutal-yellow flex items-center justify-center flex-shrink-0">
              <BookOpen className="size-8 text-black" />
            </div>
            <div>
              <h4 className="font-display text-xl uppercase leading-none text-brutal-yellow">Trust Passport Active</h4>
              <p className="text-xs font-bold uppercase mt-2 text-white">Your verified identity passport is ready. View all linked accounts, address details &amp; trust graph.</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="bg-brutal-green text-black px-2 py-0.5 border-2 border-black font-black text-[9px] uppercase">✓ KYC Verified</span>
                <span className="text-[9px] font-black uppercase text-white border border-white/30 px-2 py-0.5">{connectedProviders.length} apps linked</span>
                <span className="text-[9px] font-black uppercase bg-brutal-yellow text-black px-2 py-0.5 border-2 border-black">Score: {trustScore}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/passport')}
            className="brutal-btn bg-brutal-yellow text-black px-8 py-3 text-sm font-black uppercase whitespace-nowrap border-4 border-black shadow-[4px_4px_0px_#FFE600]"
          >
            View Full Passport →
          </button>
        </div>
      )}

      {isGuest && (
        <div className="brutal-card bg-black text-brutal-yellow flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_#FFE600]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 border-4 border-brutal-yellow bg-white flex items-center justify-center overflow-hidden">
              <img src={guestmodeLogo} alt="Guest Mode Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-display text-xl uppercase leading-none text-brutal-yellow">You're Viewing Demo Data</h4>
              <p className="text-xs font-bold uppercase mt-2 text-white/80">Create a free account to build your real trust score and link identities.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="brutal-btn bg-brutal-yellow text-black px-8 py-3 text-sm font-black uppercase whitespace-nowrap border-2 border-brutal-yellow"
          >
            Create Free Account →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left Column: Trust Score + Connected Accounts */}
      <div className="lg:col-span-4 space-y-8">
        {isOwner ? (
          <div className="brutal-card bg-black text-white border-4 border-black p-6 space-y-6 shadow-[6px_6px_0px_#00E5FF]">
            <div className="flex items-center gap-2 border-b-2 border-white/20 pb-3">
              <ShieldAlert size={20} className="text-[#00E5FF] animate-pulse shrink-0" />
              <h3 className="font-display text-xs uppercase text-white tracking-widest">Oversight Dashboard</h3>
            </div>
            
            {oversightLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-[#00E5FF]" />
                <span className="text-[9px] font-black uppercase text-gray-400">Loading metrics...</span>
              </div>
            ) : oversightData ? (
              <div className="space-y-4">
                {/* Aggregates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border-2 border-white/20 bg-white/5">
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Total Users</span>
                    <span className="font-display text-2xl font-black text-white">{oversightData.aggregates.totalUsers}</span>
                  </div>
                  <div className="p-3 border-2 border-white/20 bg-white/5">
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Verified KYC</span>
                    <span className="font-display text-2xl font-black text-brutal-green">{oversightData.aggregates.verifiedUsers}</span>
                  </div>
                  <div className="p-3 border-2 border-white/20 bg-white/5">
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Pending KYC</span>
                    <span className="font-display text-2xl font-black text-brutal-yellow">{oversightData.aggregates.pendingKyc}</span>
                  </div>
                  <div className="p-3 border-2 border-white/20 bg-white/5">
                    <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Average Score</span>
                    <span className="font-display text-2xl font-black text-[#00E5FF]">{oversightData.aggregates.averageScore}</span>
                  </div>
                </div>

                {/* Verification Trends */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-[9px] font-black uppercase text-gray-400 mb-2 flex justify-between">
                    <span>Verification Trend</span>
                    <span className="text-[8px] text-brutal-green">▲ 15% this week</span>
                  </h4>
                  <div className="flex items-end justify-between h-20 px-2 pt-2 bg-white/5 border border-white/10">
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
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Active Safety Alerts</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {oversightData.alerts.map((alert: any) => (
                      <div key={alert.id} className={`p-2 border-l-4 text-[9px] uppercase font-bold bg-white/5 ${
                        alert.severity === 'critical' ? 'border-brutal-pink text-brutal-pink' : alert.severity === 'high' ? 'border-[#FF5F00] text-[#FF5F00]' : 'border-brutal-yellow text-brutal-yellow'
                      }`}>
                        <div className="flex justify-between items-center font-black">
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
              <p className="text-[10px] text-gray-400 text-center uppercase font-bold">Failed to load metrics.</p>
            )}
          </div>
        ) : (
          <div className="brutal-card flex flex-col items-center text-center gap-4 py-8">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brutal-green" />
              <h3 className="font-display text-xs uppercase text-gray-500 tracking-widest">Your Trust Score</h3>
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
              <span className="font-display text-sm text-brutal-green uppercase tracking-widest">
                {isGuest ? 'Demo Mode' : (trustScore > 800 ? 'Excellent' : trustScore > 600 ? 'Good' : 'Needs Verification')}
              </span>
              
              <div className="flex items-center justify-between p-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[4px_4px_0px_var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className={(!isGuest && (plan === 'admin' || plan === 'pro' || isOwner)) ? 'text-brutal-blue' : 'text-[var(--text-secondary)]'} />
                  <span className="font-black uppercase text-[10px] tracking-wider text-[var(--text-primary)]">
                    {isGuest ? 'Guest Access' : (isOwner ? `${getAdminRoleTitle(userEmail) || 'Administrator'} (Admin Elite)` : `${plan === 'admin' ? 'Admin Elite' : (plan || 'Free')} Plan`)}
                  </span>
                </div>
                
                {/* Never show Admin Button to guests; show upgrade CTA for guests */}
                {isGuest ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-brutal-yellow px-3 py-1 border-2 border-black text-[9px] font-black uppercase hover:bg-black hover:text-brutal-yellow transition-colors shadow-[2px_2px_0px_#000]"
                  >
                    Sign Up
                  </button>
                ) : isOwner ? (
                   <button 
                    onClick={() => navigate('/admin')}
                    className="bg-brutal-blue px-3 py-1 border-2 border-black text-white text-[9px] font-black uppercase hover:bg-black transition-colors shadow-[2px_2px_0px_#000]"
                  >
                    Admin Console
                  </button>
                ) : (
                  /* Upgrade Button for others */
                  plan !== 'pro' && (
                    <button 
                      onClick={() => navigate('/pricing')}
                      className="bg-brutal-yellow px-3 py-1 border-2 border-black text-[9px] font-black uppercase hover:bg-black hover:text-brutal-yellow transition-colors shadow-[2px_2px_0px_#000]"
                    >
                      Upgrade
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="brutal-card">
          <h3 className="font-display text-xs uppercase text-gray-500 tracking-widest mb-6">Connected Accounts</h3>
          {isGuest && (
            <div className="mb-4 px-3 py-2 border-2 border-black bg-brutal-yellow text-[9px] font-black uppercase text-center">
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
                  className={`flex flex-col items-center gap-2 p-3 border-2 border-[var(--border-color)] text-[10px] font-black uppercase transition-all ${
                    isConnected 
                      ? 'bg-brutal-green text-black cursor-default shadow-[4px_4px_0px_var(--border-color)]' 
                      : 'bg-[var(--bg-primary)] hover:bg-brutal-yellow hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_var(--border-color)] active:translate-y-0 active:shadow-none'
                  }`}
                >
                  <div className={`w-8 h-8 border-2 border-[var(--border-color)] rounded-full flex items-center justify-center text-xs ${isConnected ? 'bg-white text-black' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}>
                     {a.icon}
                  </div>
                  {a.name}
                  <span className={`text-[8px] ${isConnected ? 'opacity-100 font-black' : 'opacity-60'}`}>
                    {isConnected ? 'CONNECTED' : isGuest ? '(LOGIN)' : '(Connect)'}
                  </span>
                </button>
              );
            })}
            {!isGuest && (
              <button 
                onClick={() => navigate('/identity')}
                className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--border-color)] opacity-50 text-[10px] font-black uppercase cursor-pointer hover:opacity-100 hover:bg-[var(--text-primary)]/5 transition-all"
              >
                <div className="w-8 h-8 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">+</div>
                Add new
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Risk Status + Activity Analytics */}
      <div className="lg:col-span-8 space-y-8">
        {isOwner ? (
          <div className="brutal-card bg-white shadow-[6px_6px_0px_#000] border-2 border-black space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-display text-xs uppercase text-black tracking-widest flex items-center gap-2">
                <ShieldAlert size={20} className="text-brutal-pink shrink-0" />
                High-Risk Flagged Users
              </h3>
              <span className="brutal-badge bg-brutal-pink text-white !text-[8px] uppercase font-black tracking-widest">
                Oversight Radar
              </span>
            </div>

            {oversightLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-brutal-pink animate-spin" />
              </div>
            ) : (oversightData && oversightData.highRiskUsers && oversightData.highRiskUsers.length > 0) ? (
              <div className="space-y-3">
                {oversightData.highRiskUsers.map((rUser: any) => (
                  <div 
                    key={rUser.id} 
                    className="p-4 border-2 border-black bg-gray-50 shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border-2 border-black rounded-full bg-white flex items-center justify-center font-black text-xs shadow-[1px_1px_0px_#000]">
                          👤
                        </div>
                        <div>
                          <h4 className="font-black text-xs uppercase leading-tight text-black">{rUser.fullName}</h4>
                          <span className="text-[8px] font-mono text-gray-400 lowercase">{rUser.email}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 border border-black ${
                          rUser.riskLevel === 'CRITICAL' ? 'bg-brutal-pink text-white' : 'bg-[#FF5F00] text-white'
                        }`}>
                          ⚠️ {rUser.riskLevel} RISK
                        </span>
                        <span className="text-[8px] font-black uppercase bg-black text-white px-2 py-0.5">
                          Score: {rUser.score}
                        </span>
                        {rUser.signals.map((sig: string, idx: number) => (
                          <span key={idx} className="text-[8px] font-black uppercase border border-dashed border-gray-400 px-1.5 py-0.5 text-gray-500">
                            {sig}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => navigate('/admin')}
                        className="bg-black text-white hover:bg-brutal-blue border-2 border-black px-4 py-2 text-[9px] font-black uppercase shadow-[2px_2px_0px_#000] transition-colors active:translate-y-0.5"
                      >
                        Audit Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 uppercase font-bold text-center py-6">No high-risk flagged users detected.</p>
            )}
          </div>
        ) : (
          <div className="brutal-card">
            <h3 className="font-display text-xs uppercase text-gray-500 tracking-widest mb-6">Score Breakdown (ML Layers)</h3>
            <div className="space-y-4">
              {[
                { label: 'Layer 1: Rules & Blacklists', key: 'rule', color: 'bg-brutal-blue' },
                { label: 'Layer 2: Behavioral Anomaly', key: 'behavioral', color: 'bg-brutal-pink' },
                { label: 'Layer 3: Graph Collusion', key: 'graph', color: 'bg-brutal-yellow' },
                { label: 'Layer 4: Fingerprinting', key: 'fingerprint', color: 'bg-brutal-green' },
              ].map((layer) => {
                const profileMetadata = records[0]?.metadata as any;
                const score = profileMetadata?.layer_scores?.[layer.key] || (trustScore / 4);
                return (
                  <div key={layer.key}>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                      <span>{layer.label}</span>
                      <span>{Math.round(score)} / 250</span>
                    </div>
                    <div className="h-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[2px_2px_0px_var(--border-color)]">
                      <div 
                        className={`h-full border-r-2 border-[var(--border-color)] ${layer.color}`} 
                        style={{ width: `${(score / 250) * 100}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 p-3 border-2 border-black bg-black text-white text-center">
              <div className="font-display text-lg uppercase">
                {trustScore >= 800 ? 'Elite Tier' : trustScore >= 500 ? 'Verified' : 'Unverified'}
              </div>
              <div className="text-[8px] font-bold tracking-widest uppercase opacity-60">Verified by Pramaaan ML Engine</div>
            </div>
          </div>
        )}

         {/* Live Activity Feed */}
         <div className="brutal-card bg-black text-white border-brutal-blue border-4 shadow-[8px_8px_0px_#0057FF]">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-display text-xs uppercase text-brutal-blue tracking-widest">Live Activity Feed</h3>
             <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
               <span className="w-2 h-2 bg-brutal-green rounded-full animate-pulse"></span>
               Real-time
             </span>
           </div>
           <div className="space-y-3">
             {activityFeed.length > 0 ? activityFeed.map((log) => (
               <div key={log.id} className="flex flex-col gap-1 pb-3 border-b border-white/10 last:border-0">
                 <div className="flex justify-between items-center text-[8px] font-black uppercase text-gray-400">
                   <span>{log.type.replace('_', ' ')}</span>
                   <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                 </div>
                 <div className="text-xs font-bold font-mono">{log.message}</div>
               </div>
             )) : (
               <div className="text-xs font-bold text-gray-500 uppercase py-2">No recent activity</div>
             )}
           </div>
         </div>

         <div className="brutal-card">
          <h3 className="font-display text-xs uppercase text-gray-500 tracking-widest mb-8">Recent Activity</h3>
          
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
                      <td className="font-mono text-[10px]">{r.identity_hash.substring(0, 20)}...</td>
                      <td className="font-bold text-[10px]">{formatDate(r.created_at)}</td>
                      <td>
                        <span className="brutal-badge !border-2 !px-2 !py-0.5 uppercase text-[8px]" style={{ background: STATUS_COLOR[r.verification_status] }}>
                          {r.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400 font-bold uppercase text-xs">
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
      <div className="brutal-card bg-[var(--bg-primary)] mt-8 relative overflow-hidden">
        <h3 className="font-display text-xl uppercase mb-6 flex items-center gap-2">
          <BookOpen className="text-brutal-blue" size={24} />
          Identity Graph
        </h3>
        
        <div className={`transition-all duration-500 ${(!isOwner && plan === 'free') ? 'filter blur-md opacity-40 pointer-events-none' : ''}`}>
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
        </div>

        {/* Lock Overlay for Free Users */}
        {(!isOwner && plan === 'free') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-[2px] z-10 p-4">
            <div className="brutal-card bg-white border-4 border-black text-center max-w-md mx-auto shadow-[8px_8px_0px_#000]">
              <div className="w-16 h-16 bg-brutal-yellow text-black flex items-center justify-center mx-auto mb-4 border-4 border-black shadow-[4px_4px_0px_#000]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-display text-xl uppercase mb-2">Network Intelligence Locked</h4>
              <p className="text-xs font-bold text-gray-600 mb-6 uppercase">Upgrade to Pro to unlock your identity graph and view real-time relationship data.</p>
              <button 
                onClick={() => navigate('/pricing')}
                className="w-full brutal-btn bg-[#00E5FF] text-black font-black uppercase py-4 border-4 border-black hover:bg-black hover:text-[#00E5FF] transition-colors shadow-[4px_4px_0px_#000]"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
