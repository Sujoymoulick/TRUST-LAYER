import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { useGuest } from '../context/GuestContext';
import { 
  Database, 
  Plus, 
  Clock, 
  ArrowLeft, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ConsentVaultModal } from '../components/ConsentVaultModal';

import githubLogo from '../assets/social/github.png';
import linkedinLogo from '../assets/social/linkedin.png';
import googleLogo from '../assets/social/google.png';
import facebookLogo from '../assets/social/facebook.png';
import digilockerLogo from '../assets/social/digilocker.png';
import gmailLogo from '../assets/social/gmail.png';

const PROVIDERS = [
  { id: 'github', name: 'GitHub', logo: githubLogo, type: 'OAuth' },
  { id: 'linkedin_oidc', name: 'LinkedIn', logo: linkedinLogo, type: 'OAuth' },
  { id: 'google', name: 'Google', logo: googleLogo, type: 'OAuth' },
  { id: 'facebook', name: 'Facebook', logo: facebookLogo, type: 'OAuth' },
  { id: 'digilocker', name: 'DigiLocker', logo: digilockerLogo, type: 'Government ID' },
  { id: 'email', name: 'Email', logo: gmailLogo, type: 'Direct' },
];

export default function ConnectedApps() {
  const { isGuest } = useGuest();
  const navigate = useNavigate();
  const [connectedApps, setConnectedApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [consentModalProvider, setConsentModalProvider] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    fetchApps();
  }, [isGuest]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/passport');
      if (data && data.connectedApps) {
        setConnectedApps(data.connectedApps);
      }
    } catch (err) {
      console.error('Error fetching connected apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    if (isGuest) return;
    try {
      setLinkingProvider(provider);
      const { error } = await supabase.auth.linkIdentity({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin + '/connected-apps',
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to initiate app connection. Verify configuration in Supabase.');
    } finally {
      setLinkingProvider(null);
    }
  };

  const isConnected = (providerId: string) => {
    return connectedApps.some(app => app.provider === providerId);
  };

  const getConnectedDetails = (providerId: string) => {
    return connectedApps.find(app => app.provider === providerId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header toolbar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/passport')}
          className="flex items-center gap-1.5 bg-white text-black border border-slate-200 dark:border-zinc-800 px-4 py-2 font-display text-xs uppercase shadow-sm hover:translate-x-[1px] hover:translate-y-[1px]  transition-all"
        >
          <ArrowLeft size={14} /> Back to Passport
        </button>
        
        <div className="flex items-center gap-2 bg-brutal-blue text-white border border-slate-200 dark:border-zinc-800 px-4 py-2 shadow-sm font-display text-xs uppercase font-bold">
          <Database size={14} className="shrink-0" />
          Credentials Vault
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-4xl uppercase tracking-tight">Connected Apps &amp; Identities</h2>
        <p className="font-bold text-gray-500 uppercase text-xs">
          Manage your linked Web2 and Web3 credentials, check authentication status, and synchronize your reputation graph.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin size-10 text-brutal-blue" />
          <p className="font-display text-xs uppercase tracking-widest animate-pulse">Loading linked apps...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROVIDERS.map((prov) => {
            const connected = isConnected(prov.id);
            const details = getConnectedDetails(prov.id);

            return (
              <motion.div 
                key={prov.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`brutal-card border border-slate-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-56 transition-all ${
                  connected 
                    ? 'bg-white shadow-md' 
                    : 'bg-gray-50 shadow-md opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 border border-slate-200 dark:border-zinc-800 rounded-full bg-white flex items-center justify-center p-2 shadow-sm">
                      <img src={prov.logo} className="w-full h-full object-contain" alt={prov.name} />
                    </div>
                    
                    {connected ? (
                      <span className="bg-brutal-green text-black border border-slate-200 dark:border-zinc-800 text-[9px] font-bold uppercase px-2 py-0.5 shadow-sm">
                        ✓ Connected
                      </span>
                    ) : (
                      <span className="bg-gray-200 text-gray-500 border border-gray-400 text-[9px] font-bold uppercase px-2 py-0.5">
                        ⚠️ Disconnected
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-display text-lg uppercase text-black leading-none">{prov.name}</h3>
                    <span className="text-[8px] font-mono uppercase bg-black text-white px-2 py-0.5 inline-block mt-2">
                      {prov.type}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-zinc-800 border-dashed pt-4 flex items-center justify-between">
                  {connected ? (
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-gray-500 truncate max-w-[200px] leading-tight">
                        ID: {details.accountId || 'anonymous'}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Clock size={10} /> Linked {new Date(details.linkedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold text-gray-400 uppercase">
                      No linked reputation data.
                    </p>
                  )}

                  {connected ? (
                    <div className="flex items-center gap-2">
                      {details.profileUrl && (
                        <a 
                          href={details.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-black hover:bg-brutal-blue border border-slate-200 dark:border-zinc-800 text-white p-2 shadow-sm active:scale-[0.98] active:shadow-none transition-all"
                          title="View Verified Profile"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setConsentModalProvider(prov.name)}
                      disabled={linkingProvider === prov.id || isGuest}
                      className="bg-brutal-yellow hover:bg-black text-black hover:text-brutal-yellow border border-slate-200 dark:border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase shadow-sm active:scale-[0.98] active:shadow-none transition-all flex items-center gap-1.5"
                    >
                      {linkingProvider === prov.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={12} /> Link App
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interstitial Consent Vault Modal */}
      <ConsentVaultModal
        isOpen={consentModalProvider !== null}
        onClose={() => setConsentModalProvider(null)}
        providerName={consentModalProvider || ''}
        onSuccess={() => {
          if (consentModalProvider) {
            const matchedProv = PROVIDERS.find(p => p.name === consentModalProvider);
            if (matchedProv) {
              handleConnect(matchedProv.id);
            }
          }
        }}
      />
    </div>
  );
}
