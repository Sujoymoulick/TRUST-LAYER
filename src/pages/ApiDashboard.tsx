import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Loader2, Key, CheckCircle } from 'lucide-react';

export default function ApiDashboard() {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check for existing API key in user_metadata or a separate table
          // For now, we'll use a hashed version of the user ID as a mock real key
          const mockKey = `tl_live_${btoa(user.id).substring(0, 32)}`;
          setApiKey(mockKey);
        }

        const { data, error } = await supabase
          .from('trust_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error('Error fetching API data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="font-display text-3xl uppercase">API Dashboard</h2>
        <p className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">Manage your TrustLayer production access.</p>
      </div>

      <div className="brutal-card shadow-[8px_8px_0px_#000]">
        <h3 className="font-display text-lg uppercase mb-4 flex items-center gap-2">
          <Key size={20} /> Your Production API Key
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 brutal-input bg-gray-50 flex items-center overflow-hidden font-mono text-sm break-all">
            {apiKey || 'No key generated'}
          </div>
          <button 
            onClick={handleCopy}
            className={`brutal-btn px-6 gap-2 flex items-center justify-center min-w-[140px] transition-colors ${copied ? 'bg-brutal-green' : 'bg-white'}`}
          >
            {copied ? <><CheckCircle size={18} /> Copied</> : <><Copy size={18} /> Copy Key</>}
          </button>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase mt-4">
          Warning: Never share your API key. It provides full access to your trust identity data.
        </p>
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
