import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GraphVisualization } from '../components/GraphVisualization';
import { isAdminEmail } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { useGuest } from '../context/GuestContext';

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

        if (user) {
          const providers = user.identities?.map((identity: any) => identity.provider) || [];
          setConnectedProviders(providers);
          
          // Fetch Profile for Plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan, kyc_status')
            .eq('id', user.id)
            .single();
          setPlan(profile?.plan || 'free');
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

        // Fetch Real Trust Score from Backend
        if (user) {
          try {
            const scoreData = await apiFetch('/trust-score');
            if (scoreData && scoreData.score) {
              setRealTrustScore(scoreData.score);
            }
          } catch (err) {
            console.warn('Failed to fetch trust score from backend:', err);
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
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
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
            <div className="w-16 h-16 border-4 border-brutal-yellow bg-white flex items-center justify-center text-3xl">
              👁
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
        <div className="brutal-card flex flex-col items-center text-center gap-4 py-8">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brutal-green" />
            <h3 className="font-display text-xs uppercase text-gray-500 tracking-widest">Your Trust Score</h3>
          </div>
          <div className="font-display text-7xl leading-none">
            {loading ? <Loader2 className="animate-spin" /> : trustScore}
          </div>
          <div className="progress-track w-full">
            <div className="progress-fill" style={{ width: `${(trustScore / 1000) * 100}%` }} />
          </div>
          <div className="flex flex-col gap-3 w-full">
            <span className="font-display text-sm text-brutal-green uppercase tracking-widest">
              {isGuest ? 'Demo Mode' : (trustScore > 800 ? 'Excellent' : trustScore > 600 ? 'Good' : 'Needs Verification')}
            </span>
            
            <div className="flex items-center justify-between p-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[4px_4px_0px_var(--border-color)]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={(!isGuest && (plan === 'pro' || isOwner)) ? 'text-brutal-blue' : 'text-[var(--text-secondary)]'} />
                <span className="font-black uppercase text-[10px] tracking-wider text-[var(--text-primary)]">
                  {isGuest ? 'Guest Access' : (isOwner ? 'Administrator' : `${plan || 'Free'} Plan`)}
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

        <div className="brutal-card">
          <h3 className="font-display text-xs uppercase text-gray-500 tracking-widest mb-6">Connected Accounts</h3>
          {isGuest && (
            <div className="mb-4 px-3 py-2 border-2 border-black bg-brutal-yellow text-[9px] font-black uppercase text-center">
              👁 Demo — Sign in to connect real accounts
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'github', name: 'GitHub' },
              { id: 'linkedin_oidc', name: 'LinkedIn' },
              { id: 'google', name: 'Google' },
              { id: 'twitter', name: 'Twitter' },
              { id: 'facebook', name: 'Facebook' },
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
                  <div className={`w-8 h-8 border-2 border-[var(--border-color)] rounded-full flex items-center justify-center text-xs ${isConnected ? 'bg-black text-white' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}>
                     {a.name[0]}
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
      <div className="brutal-card bg-[var(--bg-primary)] mt-8">
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
    </div>
  );
}
