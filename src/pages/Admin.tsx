import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ShieldCheck, 
  Users, 
  Activity, 
  AlertTriangle, 
  Search, 
  Download,
  TrendingUp,
  History,
  UserCheck,
  Eye,
  Shield,
  Clock,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { isAdminEmail } from '../lib/utils';
import { apiFetch } from '../lib/api';


interface AdminStats {
  totalVerifications: number;
  verifiedRate: number;
  activeUsers: number;
  pendingReviews: number;
}

interface TrustRecord {
  id: string;
  created_at: string;
  identity_hash: string;
  verification_status: 'pending' | 'verified' | 'failed';
  metadata: Record<string, unknown> | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  updated_at: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
}

type AdminTab = 'verifications' | 'users' | 'audit_logs' | 'subscriptions' | 'system_status';


export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('verifications');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<TrustRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalVerifications: 0,
    verifiedRate: 0,
    activeUsers: 0,
    pendingReviews: 0
  });
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [diagLoading, setDiagLoading] = useState(false);


  useEffect(() => {
    let profileChannel: any;
    let trustChannel: any;
    let auditChannel: any;

    async function fetchAdminData() {
      try {
        setError(null);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          navigate('/login');
          return;
        }

        // Check if user is an admin via email
        if (isAdminEmail(authUser.email)) {
          // Owner/Contributor is allowed
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single();

          if (profile?.role !== 'admin') {
            console.warn('Unauthorized access to admin panel');
            navigate('/dashboard');
            return;
          }
        }

        // 1. Initial Fetch
        const loadData = async () => {
          const [trustRes, userRes, auditRes, plansRes] = await Promise.all([
            supabase.from('trust_records').select('*').order('created_at', { ascending: false }),
            supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
            supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }),
            supabase.from('plans').select('*').order('monthly_price', { ascending: true })
          ]);

          if (trustRes.error) setError(`Verifications Error: ${trustRes.error.message}`);
          if (userRes.error) setError(`Users Error: ${userRes.error.message}`);
          if (auditRes.error) setError(`Audit Logs Error: ${auditRes.error.message}`);
          if (plansRes.error) setError(`Plans Error: ${plansRes.error.message}`);

          const allRecords = trustRes.data || [];
          setRecords(allRecords);
          setUsers(userRes.data || []);
          setAuditLogs(auditRes.data || []);
          setPlans(plansRes.data || []);

          // Calculate stats
          const verified = allRecords.filter((r: TrustRecord) => r.verification_status === 'verified').length;
          const pending = allRecords.filter((r: TrustRecord) => r.verification_status === 'pending').length;
          const uniqueUsers = new Set(allRecords.map((r: TrustRecord) => r.metadata?.user_id)).size || userRes.data?.length || 0;

          setStats({
            totalVerifications: allRecords.length,
            verifiedRate: allRecords.length > 0 ? Math.round((verified / allRecords.length) * 100) : 0,
            activeUsers: uniqueUsers,
            pendingReviews: pending
          });
        };

        await loadData();

        // 2. Setup Realtime Subscriptions
        profileChannel = supabase.channel('profiles-admin')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadData())
          .subscribe();

        trustChannel = supabase.channel('trust-admin')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'trust_records' }, () => loadData())
          .subscribe();

        auditChannel = supabase.channel('audit-admin')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_audit_log' }, () => loadData())
          .subscribe();

      } catch (err) {
        console.error('Admin initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
    fetchDiagnostics();

    return () => {

      if (profileChannel) supabase.removeChannel(profileChannel);
      if (trustChannel) supabase.removeChannel(trustChannel);
      if (auditChannel) supabase.removeChannel(auditChannel);
    };
  }, [navigate]);

  const handleUpdatePlanPrice = async (planId: string, monthly: number, yearly: number) => {
    try {
      setSaving(planId);
      const { error: updateErr } = await supabase
        .from('plans')
        .update({ monthly_price: monthly, yearly_price: yearly })
        .eq('id', planId);

      if (updateErr) throw updateErr;
      
      // Refresh local state
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, monthly_price: monthly, yearly_price: yearly } : p));
      alert('Price updated successfully!');
    } catch (err: any) {
      console.error('Price update error:', err);
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      setDiagLoading(true);
      const data = await apiFetch('/diagnostics');
      setDiagnostics(data);
    } catch (err) {
      console.error('Diagnostics fetch error:', err);
    } finally {
      setDiagLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin size-12 text-brutal-blue" />
        <p className="font-display text-sm uppercase tracking-widest animate-pulse">Initializing Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl uppercase tracking-tight">Admin Console</h2>
          <p className="font-bold text-gray-500 uppercase text-xs mt-1">System-wide monitoring & management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="brutal-btn bg-white px-4 py-2 text-xs flex items-center gap-2">
            <Download size={14} /> Export Report
          </button>
          <button 
            onClick={() => setActiveTab('system_status')}
            className="brutal-btn bg-black text-white px-4 py-2 text-xs flex items-center gap-2"
          >
            <Activity size={14} /> System Health
          </button>

        </div>
      </div>

      {error && (
        <div className="brutal-card !bg-brutal-pink !text-white flex items-center gap-4 animate-pulse mb-8">
          <div className="p-2 border-2 border-white bg-black/20">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="font-display text-lg uppercase tracking-tight">Database Access Restricted</p>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Verifications', value: stats.totalVerifications, icon: ShieldCheck, color: 'bg-brutal-blue', trend: '+12%' },
          { label: 'Verified Rate', value: `${stats.verifiedRate}%`, icon: TrendingUp, color: 'bg-brutal-green', trend: '+5%' },
          { label: 'Active Identities', value: stats.activeUsers, icon: Users, color: 'bg-brutal-yellow', trend: '+24%' },
          { label: 'Pending Reviews', value: stats.pendingReviews, icon: AlertTriangle, color: 'bg-brutal-pink', trend: '-2%' },
        ].map((stat, i) => (
          <div key={i} className="brutal-card group hover:-translate-y-1 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 border-2 border-black rounded-full ${stat.color} shadow-[3px_3px_0px_#000]`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 border-2 border-black rounded-full ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-display uppercase">{stat.value}</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b-4 border-black gap-2 overflow-x-auto">
        {(['verifications', 'users', 'audit_logs', 'subscriptions', 'system_status'] as const).map(tab => (

          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-display text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-gray-100'
            } border-x-2 border-t-2 border-black`}
          >
            {tab === 'audit_logs' ? 'Audit Logs' : tab === 'system_status' ? 'System Status' : tab}

          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'verifications' && (
            <div className="brutal-card">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl uppercase">Verification Logs</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Search Hash..." className="brutal-input py-1.5 !pl-9 text-xs min-w-[200px]" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Identity Hash</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="text-[10px] font-bold text-gray-500">{new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="font-mono text-[10px] uppercase truncate max-w-[120px]">{r.identity_hash}</td>
                        <td className="text-[10px] font-black uppercase">{String(r.metadata?.method || 'Direct API')}</td>
                        <td>
                          <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${
                            r.verification_status === 'verified' ? 'bg-brutal-green' : 
                            r.verification_status === 'pending' ? 'bg-brutal-yellow' : 'bg-brutal-pink'
                          }`}>{r.verification_status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="brutal-card">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl uppercase">Site Users</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Search Users..." className="brutal-input py-1.5 !pl-9 text-xs min-w-[200px]" />
                  </div>
                </div>
              </div>
              <div className="space-y-12">
                {/* Administrators Table */}
                <div>
                  <h4 className="font-display text-sm uppercase mb-4 text-brutal-blue flex items-center gap-2"><ShieldCheck size={16} /> Administrators</h4>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Last Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'admin').map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="flex items-center gap-2">
                              <div className="w-8 h-8 border-2 border-black rounded-full overflow-hidden">
                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" />
                              </div>
                              <span className="text-xs font-black uppercase">{u.full_name || 'Anonymous'}</span>
                            </td>
                            <td className="text-[10px] font-bold text-gray-500">{u.email}</td>
                            <td>
                              <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-brutal-blue text-white">
                                {u.role}
                              </span>
                            </td>
                            <td className="text-[10px] font-bold text-gray-400">{new Date(u.updated_at).toLocaleDateString()}</td>
                            <td>
                              <button className="p-1 border-2 border-black hover:bg-black hover:text-white"><Eye size={12} /></button>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.role === 'admin').length === 0 && (
                          <tr><td colSpan={5} className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">No administrators found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Normal Users Table */}
                <div>
                  <h4 className="font-display text-sm uppercase mb-4 text-gray-600 flex items-center gap-2"><Users size={16} /> Normal Users</h4>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Last Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'user').map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="flex items-center gap-2">
                              <div className="w-8 h-8 border-2 border-black rounded-full overflow-hidden">
                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" />
                              </div>
                              <span className="text-xs font-black uppercase">{u.full_name || 'Anonymous'}</span>
                            </td>
                            <td className="text-[10px] font-bold text-gray-500">{u.email}</td>
                            <td>
                              <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-white">
                                {u.role}
                              </span>
                            </td>
                            <td className="text-[10px] font-bold text-gray-400">{new Date(u.updated_at).toLocaleDateString()}</td>
                            <td>
                              <button className="p-1 border-2 border-black hover:bg-black hover:text-white"><Eye size={12} /></button>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.role === 'user').length === 0 && (
                          <tr><td colSpan={5} className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">No normal users found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit_logs' && (
            <div className="brutal-card">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl uppercase">Audit History</h3>
                <Clock className="text-gray-400" size={20} />
              </div>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 border-2 border-black bg-brutal-yellow"><History size={16} /></div>
                      <div>
                        <p className="text-xs font-black uppercase">{log.action_type}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">
                          Admin <span className="text-black">{log.admin_id.substring(0, 8)}...</span> 
                          {log.target_user_id && <> targeted <span className="text-black">{log.target_user_id.substring(0, 8)}...</span></>}
                        </p>
                        {log.details && (
                          <pre className="mt-2 text-[8px] bg-gray-50 p-2 border-2 border-black border-dashed overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-12 border-4 border-black border-dashed text-gray-400 font-display uppercase">
                    No audit records available
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="brutal-card">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl uppercase">Plan Management</h3>
                <DollarSign className="text-gray-400" size={20} />
              </div>
              
              <div className="space-y-6">
                {plans.map((p) => (
                  <div key={p.id} className="p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border-2 border-black bg-brutal-blue text-white"><ShieldCheck size={18} /></div>
                        <h4 className="font-display text-lg uppercase">{p.name}</h4>
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 border-2 border-black bg-gray-100 uppercase">{p.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Monthly Price (₹)</label>
                        <input 
                          type="number"
                          defaultValue={p.monthly_price}
                          id={`monthly-${p.id}`}
                          className="w-full p-3 border-4 border-black font-black text-xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#000] outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Yearly Price (₹/mo)</label>
                        <input 
                          type="number"
                          defaultValue={p.yearly_price}
                          id={`yearly-${p.id}`}
                          className="w-full p-3 border-4 border-black font-black text-xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#000] outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const m = parseInt((document.getElementById(`monthly-${p.id}`) as HTMLInputElement).value);
                        const y = parseInt((document.getElementById(`yearly-${p.id}`) as HTMLInputElement).value);
                        handleUpdatePlanPrice(p.id, m, y);
                      }}
                      disabled={saving === p.id}
                      className="w-full brutal-btn bg-black text-brutal-yellow font-display text-sm uppercase py-4 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none transition-all"
                    >
                      {saving === p.id ? <Loader2 className="animate-spin" size={18} /> : <>Update {p.name} Prices <ArrowRight size={18} /></>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'system_status' && (
            <div className="space-y-6">
              <div className="brutal-card">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-xl uppercase">Backend Diagnostics</h3>
                  <button 
                    onClick={fetchDiagnostics}
                    disabled={diagLoading}
                    className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                  >
                    <History size={16} className={diagLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {diagLoading && !diagnostics ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-brutal-blue" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Running tests...</p>
                  </div>
                ) : diagnostics ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Database Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-brutal-blue">
                        <ShieldCheck size={18} />
                        <h4 className="font-display text-sm uppercase">Supabase Connectivity</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${diagnostics.supabase.status === 'reachable' ? 'bg-brutal-green' : 'bg-brutal-pink'}`}>
                          {diagnostics.supabase.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">{diagnostics.supabase.latency}ms</span>
                      </div>
                    </div>

                    {/* Graph Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-brutal-pink">
                        <TrendingUp size={18} />
                        <h4 className="font-display text-sm uppercase">Neo4j AuraDB</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${diagnostics.neo4j.status === 'connected' ? 'bg-brutal-green' : 'bg-brutal-pink'}`}>
                          {diagnostics.neo4j.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">{diagnostics.neo4j.latency}ms</span>
                      </div>
                    </div>

                    {/* Environment Info */}
                    <div className="md:col-span-2 p-4 border-4 border-black bg-gray-50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity size={18} />
                        <h4 className="font-display text-sm uppercase">Server Environment</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-gray-500 uppercase">Version</p>
                          <p className="text-[10px] font-bold">1.0.0</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-500 uppercase">Environment</p>
                          <p className="text-[10px] font-bold uppercase">{diagnostics.environment}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-500 uppercase">Timestamp</p>
                          <p className="text-[10px] font-bold">{new Date(diagnostics.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-500 uppercase">Uptime</p>
                          <p className="text-[10px] font-bold">Stable</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-4 border-black border-dashed text-center">
                    <p className="text-xs font-black uppercase text-gray-400">Failed to load system diagnostics</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="brutal-card bg-brutal-yellow">
            <h3 className="font-display text-lg uppercase mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Alerts</h3>
            <div className="space-y-3">
              <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                <h4 className="text-[10px] font-black uppercase">Live: {users.length} Active Users</h4>
                <p className="text-[9px] font-bold text-gray-600">Site traffic is normal.</p>
              </div>
            </div>
          </div>
          
          <div className="brutal-card">
            <h3 className="font-display text-lg uppercase mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <button className="brutal-btn bg-brutal-blue text-white w-full py-3 text-xs flex items-center justify-center gap-2">
                <UserCheck size={16} /> Verify New Users
              </button>
              <button className="brutal-btn bg-white w-full py-3 text-xs flex items-center justify-center gap-2">
                <Shield size={16} /> Protocol Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
