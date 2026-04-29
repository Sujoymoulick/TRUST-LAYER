import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ShieldAlert } from 'lucide-react';

interface TrustRecord {
  id: string;
  created_at: string;
  identity_hash: string;
  verification_status: 'pending' | 'verified' | 'failed';
  metadata: Record<string, unknown> | null;
}

const STATUS_COLOR: Record<string, string> = {
  verified: '#00FF00',
  pending: '#FFE600',
  failed: '#FF60B5',
};

const RISK_LABEL: Record<string, string> = {
  verified: 'SAFE',
  pending: 'WARNING',
  failed: 'RISKY',
};

export default function RiskAnalysis() {
  const [records, setRecords] = useState<TrustRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data, error } = await supabase
          .from('trust_records')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  // Calculate needle rotation based on verified vs failed ratio
  const verifiedCount = records.filter(r => r.verification_status === 'verified').length;
  const failedCount = records.filter(r => r.verification_status === 'failed').length;
  const total = records.length;
  
  // -90 is Safe (left), 0 is Warning (middle), 90 is Risky (right)
  let rotation = 0;
  if (total > 0) {
    const score = (verifiedCount - failedCount) / total; // Range -1 to 1
    rotation = -score * 90;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin size-12" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-3xl uppercase mb-8">Risk Analysis</h2>

      <div className="brutal-card mb-8 shadow-[8px_8px_0px_#000]">
        <h3 className="font-display text-lg uppercase mb-6 flex items-center gap-2">
          <ShieldAlert size={20} /> Real-time Risk Indicator
        </h3>
        <div className="flex flex-col items-center py-6">
          <svg width="260" height="150" viewBox="0 0 260 150" className="drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="#e5e5e5" strokeWidth="24" strokeLinecap="round" />
            <path d="M 30 130 A 100 100 0 0 1 97 47" fill="none" stroke="#00FF00" strokeWidth="24" />
            <path d="M 97 47 A 100 100 0 0 1 163 47" fill="none" stroke="#FFE600" strokeWidth="24" />
            <path d="M 163 47 A 100 100 0 0 1 230 130" fill="none" stroke="#FF60B5" strokeWidth="24" />
            <g transform={`rotate(${rotation}, 130, 130)`} className="transition-transform duration-1000 ease-in-out">
              <line x1="130" y1="130" x2="130" y2="40" stroke="#000" strokeWidth="6" strokeLinecap="round" />
              <circle cx="130" cy="130" r="10" fill="#000" />
            </g>
          </svg>
          <div className="flex gap-6 mt-6 font-black text-[10px] uppercase">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brutal-green border-2 border-black" /> Safe</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brutal-yellow border-2 border-black" /> Warning</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brutal-pink border-2 border-black" /> Risky</div>
          </div>
        </div>
      </div>

      <div className="brutal-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Identity Hash</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-[10px] uppercase">{r.identity_hash.substring(0, 24)}...</td>
                    <td className="uppercase font-bold">{r.verification_status}</td>
                    <td className="font-bold text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className="brutal-badge !border-2 !px-2 !py-0.5" style={{ background: STATUS_COLOR[r.verification_status] }}>
                        {RISK_LABEL[r.verification_status]}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 font-bold uppercase">No analysis data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
