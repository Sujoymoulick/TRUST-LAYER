import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Loader2, Key, CheckCircle, Trash2, Plus, AlertTriangle, EyeOff, Lock } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiKey {
  _id: string;
  name: string;
  apiId: string;
  keyHint: string;
  lastUsed: string | null;
  status: string;
  createdAt: string;
}

export default function ApiDashboard() {
  const { isGuest } = useGuest();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  
  // New API Key States
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ apiId: string; secretKey: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Guest mode: no API key fetching
    if (isGuest) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await fetchApiKeys(user.id);
        }

        const { data, error } = await supabase
          .from('trust_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isGuest]);

  const fetchApiKeys = async (uid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/keys?ownerId=${uid}`);
      if (response.ok) {
        const keys = await response.json();
        setApiKeys(keys);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
  };

  const handleGenerateKey = async () => {
    if (!userId) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: userId, name: 'Production Key' })
      });
      if (response.ok) {
        const data = await response.json();
        setNewKeyData(data);
        await fetchApiKeys(userId); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  const confirmRevokeKey = async () => {
    if (!userId || !keyToRevoke) return;
    try {
      const response = await fetch(`${API_BASE_URL}/keys/${keyToRevoke}?ownerId=${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchApiKeys(userId);
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    } finally {
      setKeyToRevoke(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin size-12" />
      </div>
    );
  }

  // Guest Mode: show locked placeholder
  if (isGuest) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div>
          <h2 className="font-display text-3xl uppercase">API Dashboard</h2>
          <p className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">Manage your TrustLayer production access.</p>
        </div>

        <div className="brutal-card shadow-[8px_8px_0px_#000] flex flex-col items-center text-center py-16 gap-6">
          <div className="w-20 h-20 border-4 border-black bg-brutal-yellow flex items-center justify-center shadow-[6px_6px_0px_#000]">
            <Lock size={40} />
          </div>
          <h3 className="font-display text-2xl uppercase">API Keys Locked</h3>
          <p className="font-bold text-gray-600 uppercase text-xs tracking-widest max-w-sm leading-relaxed">
            API key management is only available to registered users. Create a free account to generate and manage your production keys.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="brutal-btn bg-brutal-yellow text-black px-8 py-3 text-sm font-black uppercase"
          >
            Create Free Account →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="brutal-card">
            <h3 className="font-display text-lg uppercase mb-6">API Utilization</h3>
            <div className="h-40 relative border-b-4 border-l-4 border-black ml-8 mb-4 opacity-30 blur-sm">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                <path d="M0,80 L40,70 L80,85 L120,40 L160,60 L200,20 L240,45 L280,30 L320,65 L360,40 L400,50" fill="none" stroke="#0057FF" strokeWidth="4" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex justify-between font-black text-[10px] uppercase text-gray-300">
              <span>Current Month</span>
              <span>— Total Calls</span>
            </div>
          </div>

          <div className="brutal-card flex flex-col justify-center gap-4 bg-brutal-navy text-white">
            <h3 className="font-display text-xl uppercase">Developer Docs</h3>
            <p className="text-xs font-bold leading-relaxed opacity-80 uppercase">
              Integrate the TrustLayer protocol into your own applications using our high-performance SDK.
            </p>
            <button className="brutal-btn bg-brutal-yellow text-black self-start px-6 py-2 text-xs">
              Read API Docs →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">
      {/* Brutalist Revoke Confirmation Modal */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_#000] max-w-sm w-full p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={32} />
              <h3 className="font-display text-2xl uppercase leading-none">Revoke Key?</h3>
            </div>
            
            <p className="text-xs font-bold uppercase text-gray-600 tracking-widest leading-relaxed">
              Are you sure you want to revoke this API key? This action is permanent and cannot be undone. Applications using this key will lose access immediately.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button 
                onClick={() => setKeyToRevoke(null)}
                className="brutal-btn flex-1 bg-gray-100 text-black px-4 py-3 border-2 border-black font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_#000] hover:shadow-[0px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRevokeKey}
                className="brutal-btn flex-1 bg-red-500 text-white px-4 py-3 border-2 border-black font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0px_#000] hover:shadow-[0px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphism Modal for New Key */}
      {newKeyData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/20 shadow-2xl rounded-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="p-2 bg-brutal-green/20 rounded-full text-brutal-green">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-white font-display text-xl uppercase tracking-wider">New API Key Generated</h3>
                <p className="text-white/60 text-xs">Save this key securely.</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 text-red-200">
                <AlertTriangle className="shrink-0 text-red-400" />
                <p className="text-sm">This is the <strong>only time</strong> we will show you this secret key. If you lose it, you will need to generate a new one.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-widest">Secret Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black border border-white/10 rounded-lg p-3 font-mono text-sm text-white break-all flex items-center gap-2">
                    <EyeOff size={16} className="text-white/40 shrink-0" />
                    {newKeyData.secretKey}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 uppercase tracking-widest">API ID (Public)</label>
                <div className="bg-black border border-white/10 rounded-lg p-3 font-mono text-sm text-white/60 break-all">
                  {newKeyData.apiId}
                </div>
              </div>

              <button 
                onClick={() => handleCopy(newKeyData.secretKey)}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  copied ? 'bg-brutal-green text-black shadow-[0_0_15px_rgba(0,255,100,0.5)]' : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {copied ? <><CheckCircle size={20} /> Copied to Clipboard</> : <><Copy size={20} /> Copy Secret Key</>}
              </button>
            </div>

            <div className="p-4 bg-black border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setNewKeyData(null)}
                className="text-white/70 hover:text-white px-4 py-2 font-bold text-sm transition-colors"
              >
                I have saved my key securely
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-3xl uppercase">API Dashboard</h2>
        <p className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">Manage your TrustLayer production access.</p>
      </div>

      <div className="brutal-card shadow-[8px_8px_0px_#000]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-lg uppercase flex items-center gap-2">
            <Key size={20} /> API Keys
          </h3>
          <button 
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="brutal-btn bg-brutal-yellow text-black text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin size-4" /> : <Plus size={16} />}
            Generate Key
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 bg-gray-50">
            <p className="text-gray-500 font-bold uppercase text-xs">No active API keys found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map(key => (
              <div key={key._id} className="border-2 border-black p-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{key.name}</span>
                    {key.status === 'active' && <span className="bg-brutal-green text-black text-[10px] uppercase font-black px-2 py-0.5">Active</span>}
                  </div>
                  <div className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 inline-block">
                    {key.apiId}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Secret: sk_live_****{key.keyHint} • Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={() => setKeyToRevoke(key._id)}
                  className="text-red-500 hover:bg-red-50 p-2 border-2 border-transparent hover:border-red-500 transition-colors self-end md:self-auto"
                  title="Revoke Key"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="brutal-card">
          <h3 className="font-display text-lg uppercase mb-6">API Utilization</h3>
          <div className="h-40 relative border-b-4 border-l-4 border-black ml-8 mb-4">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
              <path
                d="M0,80 L40,70 L80,85 L120,40 L160,60 L200,20 L240,45 L280,30 L320,65 L360,40 L400,50"
                fill="none"
                stroke="#0057FF"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex justify-between font-black text-[10px] uppercase text-gray-400">
            <span>Current Month</span>
            <span>{records.length * 12} Total Calls</span>
          </div>
        </div>

        <div className="brutal-card flex flex-col justify-center gap-4 bg-brutal-navy text-white">
          <h3 className="font-display text-xl uppercase">Developer Docs</h3>
          <p className="text-xs font-bold leading-relaxed opacity-80 uppercase">
            Integrate the TrustLayer protocol into your own applications using our high-performance SDK.
          </p>
          <button className="brutal-btn bg-brutal-yellow text-black self-start px-6 py-2 text-xs">
            Read API Docs →
          </button>
        </div>
      </div>

      <div className="brutal-card p-0 overflow-hidden shadow-[8px_8px_0px_#000]">
        <h3 className="font-display text-lg uppercase p-4 border-b-4 border-black bg-gray-50">Recent API Transactions</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Hash</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id}>
                    <td className="uppercase font-mono text-xs font-black">POST /verify</td>
                    <td className="font-mono text-[10px]">{r.identity_hash.substring(0, 16)}...</td>
                    <td className="font-bold text-xs">{new Date(r.created_at).toLocaleTimeString()}</td>
                    <td>
                      <div className={`w-4 h-4 border-2 border-black mx-auto ${r.verification_status === 'verified' ? 'bg-brutal-green' : 'bg-brutal-pink'}`} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400 font-bold uppercase">No API logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
