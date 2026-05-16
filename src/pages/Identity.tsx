import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Link2, ShieldCheck, RefreshCw, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGuest } from '../context/GuestContext';
import { DigiLockerVerify } from '../components/DigiLockerVerify';
import SumsubWebSdk from '@sumsub/websdk-react';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';

import linkedinLogo from '../assets/social/linkedin.png';
import googleLogo from '../assets/social/google.png';
import stripeLogo from '../assets/social/stripe.png';
import paypalLogo from '../assets/social/paypal.png';
import digilockerLogo from '../assets/social/digilocker.png';
import gmailLogo from '../assets/social/gmail.png';
import facebookLogo from '../assets/social/facebook.png';
import instagramLogo from '../assets/social/instagram.png';

const PLATFORMS = [
  { id: 'github', name: 'GitHub', icon: <Link2 size={32} />, category: 'Professional' },
  { id: 'linkedin_oidc', name: 'LinkedIn', icon: <img src={linkedinLogo} className="w-10 h-10 object-contain" alt="LinkedIn" />, category: 'Professional' },
  { id: 'google', name: 'Google', icon: <img src={googleLogo} className="w-10 h-10 object-contain" alt="Google" />, category: 'Professional' },
  { id: 'gmail', name: 'Gmail', icon: <img src={gmailLogo} className="w-10 h-10 object-contain" alt="Gmail" />, category: 'Professional' },
  { id: 'stripe', name: 'Stripe', icon: <img src={stripeLogo} className="w-10 h-10 object-contain" alt="Stripe" />, category: 'Financial' },
  { id: 'paypal', name: 'PayPal', icon: <img src={paypalLogo} className="w-10 h-10 object-contain" alt="PayPal" />, category: 'Financial' },
  { id: 'digilocker', name: 'DigiLocker', icon: <img src={digilockerLogo} className="w-10 h-10 object-contain" alt="DigiLocker" />, category: 'Identity' },
  { id: 'facebook', name: 'Facebook', icon: <img src={facebookLogo} className="w-10 h-10 object-contain" alt="Facebook" />, category: 'Social' },
  { id: 'instagram', name: 'Instagram', icon: <img src={instagramLogo} className="w-10 h-10 object-contain" alt="Instagram" />, category: 'Social' },
];

export default function Identity() {
  const { isGuest } = useGuest();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [showDigiLocker, setShowDigiLocker] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>('not_started');
  const [kycToken, setKycToken] = useState<string | null>(null);
  const [showSumsub, setShowSumsub] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  // Ref so real-time subscription always has the current user ID (avoids stale closure bug)
  const userIdRef = useRef<string | null>(null);

  // Standalone refresh function — can be called manually or by auto-poll
  const refreshKycStatus = useCallback(async (showSpinner = false) => {
    if (isGuest) return;
    if (showSpinner) setStatusRefreshing(true);
    try {
      // When triggered manually: call sync-status which directly queries Sumsub
      // and writes the result to DB, then re-reads from DB for consistency.
      // When auto-polling (showSpinner=false): just read from DB.
      if (showSpinner) {
        await apiFetch('/kyc/sync-status', { method: 'POST' });
      }
      const kyc = await apiFetch('/kyc/status');
      setKycStatus(kyc.status);
      setKycRejectionReason(kyc.rejectionReason);
    } catch (err) {
      console.error('Failed to refresh KYC status:', err);
    } finally {
      if (showSpinner) setStatusRefreshing(false);
    }
  }, [isGuest]);

  useEffect(() => {
    async function getProviders() {
      try {
        if (isGuest) {
          setConnectedProviders([]);
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          userIdRef.current = user.id; // Store in ref for real-time subscription
          setConnectedProviders(user.app_metadata?.providers || []);
          
          // Fetch KYC status
          try {
            const kyc = await apiFetch('/kyc/status');
            setKycStatus(kyc.status);
            setKycRejectionReason(kyc.rejectionReason);
          } catch (err) {
            console.error('Failed to fetch KYC status:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    }
    getProviders();
    
    // Real-time updates for KYC status via Supabase
    // Uses userIdRef instead of `user` state to avoid stale closure
    let subscription: any;
    if (!isGuest) {
      subscription = supabase
        .channel('kyc_status_updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles' 
        }, (payload: any) => {
          if (userIdRef.current && payload.new.id === userIdRef.current) {
            setKycStatus(payload.new.kyc_status);
            setKycRejectionReason(payload.new.kyc_rejection_reason);
          }
        })
        .subscribe();
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [isGuest]);

  // Auto-poll every 10 seconds while status is 'pending'
  useEffect(() => {
    if (kycStatus !== 'pending' || isGuest) return;
    const interval = setInterval(() => refreshKycStatus(), 10000);
    return () => clearInterval(interval);
  }, [kycStatus, isGuest, refreshKycStatus]);

  const handleStartKYC = async () => {
    if (isGuest) return;
    setKycLoading(true);
    setKycError(null);
    try {
      const { token } = await apiFetch('/kyc/create-session', { method: 'POST' });
      setKycToken(token);
      setShowSumsub(true);
    } catch (err: any) {
      console.error('KYC session creation error (full):', err);
      // Show the real error — apiFetch throws with err.message which is the backend `message` field
      setKycError(err.message || 'Failed to start verification. Please try again.');
    } finally {
      setKycLoading(false);
    }
  };

  const handleKycComplete = async () => {
    // Manually refresh status after modal closes to ensure immediate UI update
    try {
      const kyc = await apiFetch('/kyc/status');
      setKycStatus(kyc.status);
      setKycRejectionReason(kyc.rejectionReason);
    } catch (err) {
      console.error('Failed to refresh KYC status:', err);
    }
    setShowSumsub(false);
  };

  const handleConnect = async (provider: string) => {
    if (isGuest) return;

    if (provider === 'digilocker') {
      setShowDigiLocker(true);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/identity`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin size-12 text-brutal-blue" />
          <p className="font-display text-xs uppercase tracking-widest animate-pulse">Synchronizing Identities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {showDigiLocker && (
        <DigiLockerVerify 
          onCancel={() => setShowDigiLocker(false)}
          onSuccess={async (data) => {
            // Update connected providers locally for UI feedback
            setConnectedProviders(prev => [...prev, 'digilocker']);
            setShowDigiLocker(false);
            
            // Log as a signal in DB
            if (user) {
              await supabase.from('signals').insert([{
                user_id: user.id,
                provider: 'digilocker',
                metadata: data
              }]);
            }
          }}
        />
      )}
      <h2 className="font-display text-3xl uppercase mb-8">Link Your Identities</h2>
      
      {/* Sumsub KYC Section */}
      <div className="mb-12 brutal-card bg-white p-6 shadow-[8px_8px_0px_#000]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 border-4 border-black flex items-center justify-center text-3xl ${
              kycStatus === 'verified' ? 'bg-brutal-green' : 
              kycStatus === 'pending' ? 'bg-brutal-yellow' : 
              kycStatus === 'rejected' ? 'bg-brutal-pink' : 'bg-gray-100'
            }`}>
              {kycStatus === 'verified' ? '✅' : '🛂'}
            </div>
            <div>
              <h3 className="font-display text-xl uppercase">Identity Verification (KYC)</h3>
              <p className="text-xs font-bold uppercase mt-1 text-gray-500">
                {kycStatus === 'not_started' && 'Verification Required'}
                {kycStatus === 'pending' && 'Verification Pending'}
                {kycStatus === 'verified' && 'Verification Successful'}
                {kycStatus === 'rejected' && 'Verification Rejected'}
              </p>
              {kycStatus === 'pending' && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="animate-spin size-3" />
                  <span className="text-[10px] font-black uppercase">Auto-refreshing... Est. 5-10 mins</span>
                </div>
              )}
              {kycStatus === 'rejected' && kycRejectionReason && (
                <p className="text-[10px] font-black uppercase text-red-500 mt-2">Reason: {kycRejectionReason}</p>
              )}
              {kycError && (
                <p className="text-[10px] font-black uppercase text-red-500 mt-2 max-w-xs">⚠ {kycError}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Manual refresh button — always shown for non-guest, non-verified */}
            {!isGuest && kycStatus !== 'verified' && (
              <button
                onClick={() => refreshKycStatus(true)}
                disabled={statusRefreshing}
                title="Refresh verification status"
                className="brutal-btn bg-white border-2 border-black size-10 flex items-center justify-center p-0 min-h-0"
              >
                <RefreshCw className={`size-4 ${statusRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {kycStatus !== 'verified' && kycStatus !== 'pending' && (
              <button 
                onClick={handleStartKYC}
                disabled={kycLoading || isGuest}
                className={`brutal-btn px-8 py-3 text-sm font-black uppercase ${
                  kycStatus === 'rejected' ? 'bg-brutal-pink' : 'bg-brutal-yellow'
                } ${isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {kycLoading ? <Loader2 className="animate-spin" /> : kycStatus === 'rejected' ? 'Retry Verification' : 'Start Verification'}
              </button>
            )}

            {kycStatus === 'verified' && (
              <div className="flex items-center gap-2">
                <div className="bg-brutal-green px-4 py-2 border-2 border-black font-black uppercase text-xs">
                  ✓ Passport Unlocked
                </div>
                <button
                  onClick={() => navigate('/passport')}
                  className="brutal-btn bg-black text-white px-4 py-2 text-xs font-black uppercase flex items-center gap-2 min-h-0"
                >
                  <BookOpen size={12} /> View Passport
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSumsub && kycToken && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-[85vh] border-4 border-black shadow-[16px_16px_0px_#000] relative overflow-hidden flex flex-col">
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-brutal-yellow">
               <h3 className="font-display text-sm uppercase tracking-widest">Secure Identity Verification</h3>
               <button 
                onClick={handleKycComplete}
                className="brutal-btn bg-white size-8 flex items-center justify-center font-black p-0 min-h-0"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SumsubWebSdk
                accessToken={kycToken}
                expirationHandler={() => {
                  // Token expired, refresh it
                  handleStartKYC();
                  return Promise.resolve(kycToken);
                }}
                onMessage={(type: string, payload: any) => {
                  console.log('Sumsub message:', type, payload);
                  // Auto close modal when applicant is reviewed or pending
                  if (type === 'idCheck.applicantStatus' && (payload.reviewStatus === 'pending' || payload.reviewStatus === 'completed')) {
                    setTimeout(handleKycComplete, 3000);
                  }
                }}
                onError={(error: any) => {
                  console.error('Sumsub error:', error);
                  alert('Verification tool error. Please try again.');
                  setShowSumsub(false);
                }}
                options={{
                  adaptivness: true,
                  i18n: {
                    en: {
                      'step.id-and-liveness.title': 'Passport Verification',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      <p className="text-sm font-bold text-gray-500 uppercase mb-8 tracking-widest">
        The more accounts you link, the higher your Trust Score becomes.
      </p>

      {['Professional', 'Financial', 'Identity', 'Social'].map(category => (
        <div key={category} className="mb-12">
          <h3 className="font-display text-xl uppercase mb-6 border-b-2 border-black inline-block">{category} Signals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {PLATFORMS.filter(p => p.category === category).map(p => {
              const isConnected = !isGuest && connectedProviders.includes(p.id);
              return (
                <div key={p.id} className={`brutal-card flex flex-col items-center gap-4 text-center ${isConnected ? 'bg-brutal-green' : 'bg-white'}`}>
                  <div className="w-16 h-16 border-4 border-black flex items-center justify-center text-3xl bg-white shadow-[4px_4px_0px_#000]">
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase">{p.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-tighter">
                      {isConnected ? '✓ Verified Link' : 'Not Connected'}
                    </p>
                  </div>
                  <button 
                    className={`brutal-btn w-full py-2 text-xs font-black uppercase flex items-center justify-center gap-2 ${isConnected ? 'bg-black text-white' : 'bg-white text-black'} ${isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isConnected && handleConnect(p.id)}
                    disabled={isConnected || isGuest}
                  >
                    {isConnected ? <><Link2 size={14} /> LINKED</> : isGuest ? 'LOGIN' : 'CONNECT'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Email / Demo Account */}
      <h3 className="font-display text-xl uppercase mb-6 border-b-2 border-black inline-block">Primary Signals</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className={`brutal-card flex flex-col items-center gap-4 text-center ${isGuest ? 'bg-brutal-yellow' : 'bg-brutal-green'}`}>
          <div className="w-16 h-16 border-4 border-black flex items-center justify-center bg-white shadow-[4px_4px_0px_#000]">
            <img src={gmailLogo} className="w-10 h-10 object-contain" alt="Email" />
          </div>
          <div>
            <h3 className="font-display text-lg uppercase">Email</h3>
            <p className="text-[10px] font-black uppercase tracking-tighter">
              {isGuest ? '⚠️ Demo Identity' : '✓ Primary Identity'}
            </p>
          </div>
          <div className="w-full py-2 text-xs font-black uppercase bg-black text-white text-center border-2 border-black">
            {isGuest ? 'GUEST_USER' : (user?.email?.split('@')[0] || 'USER')}
          </div>
        </div>
      </div>

      {/* Trust Insight */}
      <div className="mt-12 brutal-card bg-brutal-pink flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_#000]">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 border-4 border-black bg-white flex items-center justify-center">
            <ShieldCheck className="size-10 text-black" />
          </div>
          <div>
            <h4 className="font-display text-xl uppercase leading-none">Identity Proof</h4>
            <p className="text-xs font-bold uppercase mt-2">Your identities are hashed and stored on the trust layer network.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="brutal-btn bg-white px-6 py-2 text-xs font-black uppercase">View on Explorer</button>
        </div>
      </div>
    </div>
  );
}


