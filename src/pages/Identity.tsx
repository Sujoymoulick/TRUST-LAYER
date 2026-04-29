import { useEffect, useState } from 'react';
import { Loader2, Link2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGuest } from '../context/GuestContext';
import { DigiLockerVerify } from '../components/DigiLockerVerify';

const PLATFORMS = [
  { id: 'github', name: 'GitHub', icon: '🐙', category: 'Professional' },
  { id: 'linkedin_oidc', name: 'LinkedIn', icon: '🔗', category: 'Professional' },
  { id: 'google', name: 'Google', icon: '🔍', category: 'Professional' },
  { id: 'stripe', name: 'Stripe', icon: '💳', category: 'Financial' },
  { id: 'paypal', name: 'PayPal', icon: '💰', category: 'Financial' },
  { id: 'onfido', name: 'Onfido', icon: '🪪', category: 'Identity' },
  { id: 'digilocker', name: 'DigiLocker', icon: '🇮🇳', category: 'Identity' },
];

export default function Identity() {
  const { isGuest } = useGuest();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [showDigiLocker, setShowDigiLocker] = useState(false);

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
          setConnectedProviders(user.app_metadata?.providers || []);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    }
    getProviders();
  }, [isGuest]);

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
        <Loader2 className="animate-spin size-12" />
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
      <p className="text-sm font-bold text-gray-500 uppercase mb-8 tracking-widest">
        The more accounts you link, the higher your Trust Score becomes.
      </p>

      {['Professional', 'Financial', 'Identity'].map(category => (
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
          <div className="w-16 h-16 border-4 border-black flex items-center justify-center text-3xl bg-white shadow-[4px_4px_0px_#000]">
            📧
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


