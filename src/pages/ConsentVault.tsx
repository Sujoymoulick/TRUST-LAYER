import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, CheckCircle2, History, ArrowRight, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { useGuest } from '../context/GuestContext';

const B2B_PLATFORMS = [
  { id: 'upwork', name: 'Upwork', icon: '💼' },
  { id: 'toptal', name: 'Toptal', icon: '🎯' },
  { id: 'fiverr', name: 'Fiverr', icon: '🎨' },
  { id: 'enterprise', name: 'Enterprise Clients', icon: '🏢' },
  { id: 'financial', name: 'Financial Institutions', icon: '🏛️' },
];

const DATA_SOURCES = [
  { id: 'github_contributions', name: 'GitHub Contributions', icon: '🐙' },
  { id: 'linkedin_profile', name: 'LinkedIn Profile', icon: '🔗' },
  { id: 'financial_behavior', name: 'Financial Behavior', icon: '📊' },
  { id: 'identity_docs', name: 'Identity Documents', icon: '🪪' },
  { id: 'digilocker', name: 'DigiLocker', icon: '🇮🇳' },
  { id: 'transaction_data', name: 'Transaction Data', icon: '💰' },
];

export default function ConsentVault() {
  const { isGuest } = useGuest();
  const [selectedPlatform, setSelectedPlatform] = useState(B2B_PLATFORMS[0]);
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Initialize mock consents for the selected platform
    const initialConsents: Record<string, boolean> = {};
    DATA_SOURCES.forEach(source => {
      initialConsents[`${selectedPlatform.id}_${source.id}`] = false;
    });
    setConsents(prev => ({ ...prev, ...initialConsents }));

    if (!isGuest) {
      fetchLogs();
    } else {
       // Mock logs for guest
       setLogs([
         { id: '1', consumer_id: 'upwork', scope: 'github_contributions', status: 'granted', timestamp: new Date().toISOString() },
         { id: '2', consumer_id: 'toptal', scope: 'identity_verification', status: 'granted', timestamp: new Date(Date.now() - 3600000).toISOString() },
       ]);
    }
  }, [selectedPlatform, isGuest]);

  async function fetchLogs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('consent_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      setLogs(data || []);
    }
  }

  const toggleConsent = async (sourceId: string) => {
    const consentId = `${selectedPlatform.id}_${sourceId}`;
    const newState = !consents[consentId];
    setConsents(prev => ({ ...prev, [consentId]: newState }));

    if (!isGuest) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('consent_logs').insert([{
            user_id: user.id,
            consumer_id: selectedPlatform.id,
            scope: sourceId,
            status: newState ? 'granted' : 'revoked'
          }]);
          fetchLogs();
        }
      } catch (err) {
        console.error('Failed to log consent:', err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-4 border-black pb-8">
        <div>
          <h2 className="font-display text-4xl uppercase mb-2">Personal Consent Vault</h2>
          <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">
            Privacy-by-Design: You are the ultimate controller of your Trust Passport.
          </p>
        </div>
        <div className="brutal-badge bg-brutal-green text-xs !px-4 !py-2">
          DPDP 2023 & GDPR Compliant
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 1. B2B Platforms Selection (Left) */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-display text-xs uppercase text-gray-400 tracking-widest mb-4">Select Consumer</h3>
          {B2B_PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform)}
              className={`w-full brutal-card flex items-center gap-4 transition-all text-left ${
                selectedPlatform.id === platform.id 
                  ? 'bg-black text-white translate-x-2' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{platform.icon}</span>
              <span className="font-black uppercase text-xs">{platform.name}</span>
              {selectedPlatform.id === platform.id && <ArrowRight size={14} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* 2. User Gatekeeper Console (Middle) */}
        <div className="lg:col-span-6">
          <div className="brutal-card bg-white min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
              <div className="flex items-center gap-3">
                <Shield className="text-brutal-blue" />
                <h3 className="font-display text-lg uppercase">User Gatekeeper</h3>
              </div>
              <div className="text-[10px] font-black uppercase text-gray-400">
                Control: {selectedPlatform.name}
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {DATA_SOURCES.map(source => {
                const isToggled = consents[`${selectedPlatform.id}_${source.id}`];
                return (
                  <div key={source.id} className="flex items-center justify-between p-4 border-2 border-black bg-gray-50 shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center text-xl">
                        {source.icon}
                      </div>
                      <div>
                        <div className="font-black uppercase text-xs">{source.name}</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">Ephemeral Token Verification</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleConsent(source.id)}
                      className="transition-colors"
                    >
                      {isToggled ? (
                        <ToggleRight className="text-brutal-green" size={32} />
                      ) : (
                        <ToggleLeft className="text-gray-300" size={32} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-brutal-blue text-white border-2 border-black text-center font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_#000]">
              Explicit Consent Required for Every Data Point
            </div>
          </div>
        </div>

        {/* 3. Privacy Compliance Info (Right) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="brutal-card bg-brutal-pink">
             <div className="flex items-center gap-2 mb-4">
               <ShieldCheck size={18} />
               <h4 className="font-display text-xs uppercase">Compliance as a Moat</h4>
             </div>
             <p className="text-[9px] font-bold uppercase leading-relaxed text-gray-800">
               Built natively for GDPR, CCPA, and India's DPDP 2023. Our architecture ensures that users, not platforms, own the data.
             </p>
          </div>

          <div className="brutal-card bg-brutal-yellow">
             <div className="flex items-center gap-2 mb-4">
               <CheckCircle2 size={18} />
               <h4 className="font-display text-xs uppercase">Data Minimization</h4>
             </div>
             <p className="text-[9px] font-bold uppercase leading-relaxed text-gray-800">
               By default, everything is private. We only collect data strictly needed for trust evaluation.
             </p>
          </div>

          <div className="brutal-card bg-white border-dashed">
             <div className="flex items-center gap-2 mb-4">
               <History size={18} />
               <h4 className="font-display text-xs uppercase text-gray-400">Zero-Knowledge Anchors</h4>
             </div>
             <p className="text-[9px] font-bold uppercase leading-relaxed text-gray-400">
               Immutable consent logs ensure the user is the ultimate controller of their Trust Passport.
             </p>
          </div>
        </div>

      </div>

      {/* Audit Logs Section */}
      <div className="brutal-card bg-black text-white">
        <div className="flex items-center gap-3 mb-8">
          <History size={24} className="text-brutal-yellow" />
          <h3 className="font-display text-2xl uppercase">Immutable Consent Audit Trail</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <th className="pb-4">Timestamp</th>
                <th className="pb-4">Platform (Consumer)</th>
                <th className="pb-4">Data Scope</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.map((log) => (
                <tr key={log.id} className="text-[10px] font-bold uppercase">
                  <td className="py-4 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-4 text-brutal-green">{log.consumer_id}</td>
                  <td className="py-4">{log.scope.replace('_', ' ')}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 border-2 border-current ${log.status === 'granted' ? 'text-brutal-green' : 'text-brutal-pink'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-600 font-black italic">
                    No logs found in the immutable vault.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
