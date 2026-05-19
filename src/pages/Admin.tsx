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
  ArrowRight,
  Database,
  RefreshCw,
  ExternalLink,
  Fingerprint,
  Cloud,
  Wallet
} from 'lucide-react';
import { isAdminEmail, getAdminRoleTitle } from '../lib/utils';
import { VITE_API_BASE_URL } from '../lib/api';
import { useGuest } from '../context/GuestContext';



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
  institution_email?: string | null;
  status?: string | null;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface GlobalEvent {
  id: string;
  type: 'activity' | 'risk';
  message: string;
  severity?: string;
  created_at: string;
  user_id: string;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
}

type AdminTab = 'activity_stream' | 'verifications' | 'users' | 'audit_logs' | 'subscriptions' | 'system_status';

const getInstitutionEmail = (email: string) => {
  const normalized = email.toLowerCase().trim();
  if (normalized === 'sujoymoulick05@gmail.com') return 'sujoy.moulick2024@iem.edu.in';
  if (normalized === 'somnath.uem0@gmail.com') return 'somnath.das2024@iem.edu.in';
  if (normalized === 'basakarnab430@gmail.com') return 'arnab.basak2024@iem.edu.in';
  return null;
};

const renderStatusBadge = (status?: string | null) => {
  const s = status || 'active';
  if (s === 'suspended') {
    return (
      <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-brutal-pink text-white shadow-[1px_1px_0px_#000] font-black">
        suspended
      </span>
    );
  }
  if (s === 'paused') {
    return (
      <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-brutal-yellow text-black shadow-[1px_1px_0px_#000] font-black">
        paused
      </span>
    );
  }
  return (
    <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-[#39FF14] text-black shadow-[1px_1px_0px_#000] font-black">
      active
    </span>
  );
};

export default function Admin() {
  const navigate = useNavigate();
  const { isGuest } = useGuest();
  const [activeTab, setActiveTab] = useState<AdminTab>('activity_stream');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [kycApps, setKycApps] = useState<any[]>([]);
  const [globalStream, setGlobalStream] = useState<GlobalEvent[]>([]);
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
  const [diagError, setDiagError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [projectAge, setProjectAge] = useState('');

  // God Mode Modal State
  const [selectedUserForScore, setSelectedUserForScore] = useState<UserProfile | null>(null);
  const [userScoreData, setUserScoreData] = useState<any>(null);
  const [manualAdjustment, setManualAdjustment] = useState<number>(0);
  const [scoreModalLoading, setScoreModalLoading] = useState(false);
  const [selectedUserPlan, setSelectedUserPlan] = useState<string>('free');
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>('active');



  useEffect(() => {
    // Guests are never allowed in the admin panel
    if (isGuest) {
      navigate('/login');
      return;
    }

    let profileChannel: any;
    let trustChannel: any;
    let auditChannel: any;
    let plansChannel: any;

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
          const { data: { session } } = await supabase.auth.getSession();
          
          const usersRes = await fetch(`${VITE_API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          });
          const usersData = await usersRes.json();
          if (usersData.success) {
            setUsers(usersData.data);
          }

          const kycRes = await fetch(`${VITE_API_BASE_URL}/admin/kyc-applications`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          });
          const kycData = await kycRes.json();
          if (kycData.success) {
            setKycApps(kycData.data);
          }

          const [trustRes, auditRes, plansRes, activityRes, riskRes] = await Promise.all([
            supabase.from('trust_records').select('*').order('created_at', { ascending: false }),
            supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }),
            supabase.from('plans').select('*').order('monthly_price', { ascending: true }),
            supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(30),
            supabase.from('risk_logs').select('*').order('created_at', { ascending: false }).limit(30)
          ]);

          if (trustRes.error) setError(`Verifications Error: ${trustRes.error.message}`);
          if (auditRes.error) setError(`Audit Logs Error: ${auditRes.error.message}`);
          if (plansRes.error) setError(`Plans Error: ${plansRes.error.message}`);

          const allRecords = trustRes.data || [];
          setAuditLogs(auditRes.data || []);
          
          let dbPlans = plansRes.data || [];
          const hasAdminPlan = dbPlans.some((p: any) => p.id === 'admin');
          if (!hasAdminPlan) {
            console.log('Inserting/upserting hidden admin plan into database...');
            const { data: insertedPlan, error: insertError } = await supabase
              .from('plans')
              .insert([
                {
                  id: 'admin',
                  name: 'Admin Elite',
                  monthly_price: 9999,
                  yearly_price: 7999,
                  features: [
                    'Unlimited API access',
                    'Full system oversight',
                    'Real-time risk warnings',
                    'Bespoke KYC control',
                    'Dedicated tech founder support'
                  ]
                }
              ])
              .select();
            if (!insertError && insertedPlan) {
              dbPlans = [...dbPlans, ...insertedPlan].sort((a, b) => a.monthly_price - b.monthly_price);
            } else {
              console.error('Failed to auto-insert admin plan:', insertError);
            }
          }
          setPlans(dbPlans);

          // Combine activities and risks into a single global stream
          const acts = (activityRes.data || []).map((a: any) => ({ ...a, type: 'activity', severity: 'info' }));
          const risks = (riskRes.data || []).map((r: any) => ({ id: r.id, user_id: r.user_id, message: `FRAUD FLAG: ${r.fraud_type}`, type: 'risk', severity: r.severity, created_at: r.created_at }));
          const combined = [...acts, ...risks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setGlobalStream(combined);

          // Calculate stats
          const verified = allRecords.filter((r: TrustRecord) => r.verification_status === 'verified').length;
          const pending = allRecords.filter((r: TrustRecord) => r.verification_status === 'pending').length;
          const uniqueUsers = new Set(allRecords.map((r: TrustRecord) => r.metadata?.user_id)).size || usersData.data?.length || 0;

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
          .on('postgres_changes', { event: '*', schema: 'public', table: 'trust_scores' }, () => loadData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => loadData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_logs' }, () => loadData())
          .subscribe();

        auditChannel = supabase.channel('audit-admin')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_audit_log' }, () => loadData())
          .subscribe();

        plansChannel = supabase.channel('plans-admin')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => loadData())
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
      if (plansChannel) supabase.removeChannel(plansChannel);
    };
  }, [navigate, isGuest]);

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
    const targetUrl = `${VITE_API_BASE_URL}/diagnostics`;
    try {
      setDiagLoading(true);
      setDiagError(null);
      console.log('Fetching diagnostics from:', targetUrl);
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`Server error: ${response.status} — URL: ${targetUrl}`);
      const data = await response.json();
      setDiagnostics(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Diagnostics fetch error:', err);
      setDiagError(`${err.message || 'Unknown error'} (calling: ${targetUrl})`);
    } finally {
      setDiagLoading(false);
    }
  };


  const openScoreModal = async (user: UserProfile) => {
    setSelectedUserForScore(user);
    setScoreModalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      };
      
      const res = await fetch(`${VITE_API_BASE_URL}/admin/recalculate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user.id })
      });
      const result = await res.json();
      if (result.success) {
        setUserScoreData(result.data);
        const { data: profile } = await supabase.from('profiles').select('manual_adjustment, plan, status').eq('id', user.id).single();
        setManualAdjustment(profile?.manual_adjustment || 0);
        setSelectedUserPlan(profile?.plan || 'free');
        setSelectedUserStatus(profile?.status || 'active');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScoreModalLoading(false);
    }
  };

  const handleAdjustScore = async () => {
    if (!selectedUserForScore) return;
    setScoreModalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      };
      
      const res = await fetch(`${VITE_API_BASE_URL}/admin/adjust-score`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId: selectedUserForScore.id, manualAdjustment })
      });

      // Update their subscription plan and status in the profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          plan: selectedUserPlan,
          status: selectedUserStatus
        })
        .eq('id', selectedUserForScore.id);
      
      if (profileUpdateError) {
        console.error('Profile plan/status update error:', profileUpdateError);
      }

      const result = await res.json();
      if (result.success) {
        setUserScoreData(result.data);
        alert('Score, Subscription, and Account Status adjusted successfully!');
        setSelectedUserForScore(null);
        // Refresh site users table
        const usersRes = await fetch(`${VITE_API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
        }
      } else {
        alert('Failed to adjust user profile.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScoreModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForScore) return;
    
    const confirm1 = window.confirm(`WARNING: Are you absolutely sure you want to PERMANENTLY DELETE ${selectedUserForScore.email}?\n\nThis action cannot be undone and will erase all data, trust scores, and logins!`);
    if (!confirm1) return;

    const confirm2 = window.confirm(`FINAL CONFIRMATION: Are you really sure you want to completely purge ${selectedUserForScore.email} from the system? Click OK to proceed.`);
    if (!confirm2) return;

    setScoreModalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${VITE_API_BASE_URL}/admin/users/${selectedUserForScore.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      if (result.success) {
        alert('User account permanently deleted successfully.');
        setSelectedUserForScore(null);
        // Refresh site users table
        const usersRes = await fetch(`${VITE_API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
        }
      } else {
        alert(`Deletion failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setScoreModalLoading(false);
    }
  };

  const handleInlineAdjust = async (userId: string, val: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      };
      
      const res = await fetch(`${VITE_API_BASE_URL}/admin/adjust-score`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId, manualAdjustment: val })
      });
      const result = await res.json();
      if (result.success) {
        // Trigger sync after setting adjustment
        await fetch(`${VITE_API_BASE_URL}/admin/sync`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId })
        });
        alert('Score recalculated successfully!');
        // UI will auto-refresh due to realtime subscription
      } else {
         alert('Failed to adjust score');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKycDecision = async (id: string, decision: 'approve' | 'reject') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${VITE_API_BASE_URL}/admin/kyc-applications/${id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setKycApps(prev => prev.map(app => app.id === id ? { ...app, status: decision === 'approve' ? 'approved' : 'rejected' } : app));
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Project Age Counter
  useEffect(() => {
    const startDate = new Date('2026-04-02T00:00:00+05:30');
    
    const updateAge = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setProjectAge(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, []);

  // Realtime polling: refresh diagnostics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDiagnostics();
    }, 30000);
    return () => clearInterval(interval);
  }, []);



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
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button className="brutal-btn bg-white px-4 py-2 text-xs flex items-center gap-2 flex-1 sm:flex-none">
            <Download size={14} /> Export Report
          </button>
          <a
            href={import.meta.env.VITE_BACKEND_DASHBOARD_URL || VITE_API_BASE_URL.replace('/api/v1', '')}
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-btn bg-brutal-blue text-white px-4 py-2 text-xs flex items-center gap-2 no-underline flex-1 sm:flex-none"
          >
            <ExternalLink size={14} /> View Backend
          </a>
          <button 
            onClick={() => setActiveTab('system_status')}
            className="brutal-btn bg-black text-white px-4 py-2 text-xs flex items-center gap-2 flex-1 sm:flex-none"
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b-4 border-black gap-4">
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto">
          {(['activity_stream', 'verifications', 'users', 'audit_logs', 'subscriptions', 'system_status'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-display text-xs sm:text-sm uppercase transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              } border-x-2 border-t-2 border-black mb-[-4px]`}
            >
              {tab === 'audit_logs' ? 'Audit Logs' : tab === 'activity_stream' ? 'Activity Stream' : tab === 'system_status' ? 'System Status' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          {activeTab === 'activity_stream' && (
            <div className="brutal-card shadow-[6px_6px_0px_#000]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl uppercase">Global Activity Stream</h3>
              </div>
              <div className="space-y-4">
                {globalStream.map((event) => (
                  <div key={event.id} className={`p-4 border-4 border-black flex items-start gap-4 ${event.type === 'risk' ? 'bg-[#FF0055]/10' : 'bg-white'}`}>
                    <div className={`p-2 border-2 border-black ${event.type === 'risk' ? 'bg-[#FF0055] text-white' : 'bg-[#39FF14] text-black'}`}>
                      {event.type === 'risk' ? <AlertTriangle size={16} /> : <Activity size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-mono text-xs font-bold uppercase ${event.type === 'risk' ? 'text-[#FF0055]' : 'text-black'}`}>{event.message}</p>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">User ID: <span className="font-mono text-black">{event.user_id.substring(0,8)}</span></p>
                    </div>
                    <span className="font-mono text-[8px] font-black uppercase text-gray-400">{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {globalStream.length === 0 && (
                  <div className="text-center py-12 border-4 border-black border-dashed text-gray-400 font-display uppercase">
                    No activity recorded
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'verifications' && (
            <div className="brutal-card">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl uppercase">Manual Verification Queue</h3>
                <ShieldCheck className="text-brutal-blue" size={20} />
              </div>
              <div className="space-y-6">
                {kycApps.filter(app => app.status === 'pending').map(app => (
                  <div key={app.id} className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-lg uppercase">{app.extracted_data?.fullName || app.profiles?.full_name || 'Unknown User'}</h4>
                        <p className="text-xs font-bold text-gray-500 uppercase">{app.profiles?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {app.sumsub_applicant_id && (
                          <a 
                            href={`https://cockpit.sumsub.com/check-applicant/${app.sumsub_applicant_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 border-2 border-black bg-brutal-blue text-white hover:bg-black transition-colors"
                            title="Open in Sumsub Cockpit"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <span className="brutal-badge !text-[10px] !px-2 !py-0.5 !border-2 uppercase bg-brutal-yellow text-black">
                          Pending Review
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-black uppercase text-gray-400 mb-1">Date of Birth</p>
                        <p className="font-bold">{app.extracted_data?.dob || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-black uppercase text-gray-400 mb-1">Country</p>
                        <p className="font-bold">{app.extracted_data?.country || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-black uppercase text-gray-400 mb-1">ID Documents</p>
                        {app.extracted_data?.idDocs?.map((doc: any, i: number) => (
                           <div key={i} className="flex gap-2 items-center">
                             <span className="bg-gray-100 px-2 py-1 border border-black font-mono">{doc.idDocType || 'UNKNOWN_DOC'}</span>
                           </div>
                        )) || <span className="italic text-gray-400">No doc details extracted</span>}
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-2">
                      <button onClick={() => handleKycDecision(app.id, 'approve')} className="flex-1 py-2 bg-brutal-green border-2 border-black font-black uppercase shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:shadow-none transition-all">Approve</button>
                      <button onClick={() => handleKycDecision(app.id, 'reject')} className="flex-1 py-2 bg-brutal-pink text-white border-2 border-black font-black uppercase shadow-[2px_2px_0px_#000] hover:translate-y-[2px] hover:shadow-none transition-all">Reject</button>
                    </div>
                  </div>
                ))}
                {kycApps.filter(app => app.status === 'pending').length === 0 && (
                  <div className="text-center py-12 border-4 border-black border-dashed text-gray-400 font-display uppercase">
                    Queue is empty
                  </div>
                )}

                {kycApps.filter(app => app.status !== 'pending').length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-display text-sm uppercase mb-4 text-gray-400">Recently Reviewed</h4>
                    <div className="space-y-2">
                      {kycApps.filter(app => app.status !== 'pending').slice(0, 5).map(app => (
                        <div key={app.id} className="flex items-center justify-between p-2 border-2 border-black bg-gray-50 text-xs font-bold uppercase">
                          <span>{app.extracted_data?.fullName || app.profiles?.email}</span>
                          <span className={app.status === 'approved' ? 'text-brutal-green' : 'text-brutal-pink'}>{app.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                          <th>Institution Mail</th>
                          <th>Role</th>
                          <th>Designation</th>
                          <th>Last Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'admin').map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="flex items-center gap-2">
                              <div className="w-8 h-8 border-2 border-black rounded-full overflow-hidden flex-shrink-0">
                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-xs font-black uppercase">{u.full_name || 'Anonymous'}</span>
                            </td>
                            <td className="text-[10px] font-bold text-gray-500">{u.email}</td>
                            <td>
                              {(u.institution_email || getInstitutionEmail(u.email)) ? (
                                <span className="text-[10px] font-bold text-gray-500 lowercase select-all border border-dashed border-gray-300 px-1.5 py-0.5 bg-gray-50 font-mono">
                                  {u.institution_email || getInstitutionEmail(u.email)}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">—</span>
                              )}
                            </td>
                            <td>
                              <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-brutal-blue text-white">
                                {u.role}
                              </span>
                            </td>
                            <td>
                              {getAdminRoleTitle(u.email) ? (
                                <span className={`brutal-badge !text-[8px] !px-2.5 !py-0.5 !border-2 uppercase font-black ${
                                  getAdminRoleTitle(u.email) === 'Founder' ? 'bg-brutal-green text-black' : 'bg-brutal-yellow text-black'
                                } shadow-[1px_1px_0px_#000]`}>
                                  {getAdminRoleTitle(u.email)}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">—</span>
                              )}
                            </td>
                            <td className="text-[10px] font-bold text-gray-400">{new Date(u.updated_at).toLocaleDateString()}</td>
                            <td>
                              <button onClick={() => openScoreModal(u)} className="p-1 border-2 border-black bg-brutal-yellow hover:bg-black hover:text-brutal-yellow mr-2" title="God Mode"><Shield size={12} /></button>
                              <button className="p-1 border-2 border-black hover:bg-black hover:text-white"><Eye size={12} /></button>
                            </td>
                          </tr>
                        ))}
                        {users.filter(u => u.role === 'admin').length === 0 && (
                          <tr><td colSpan={7} className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">No administrators found.</td></tr>
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
                          <th>Current Score</th>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Adjust & Recalculate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'user').map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="flex items-center gap-2">
                              <div className="w-8 h-8 border-2 border-black rounded-full overflow-hidden flex-shrink-0">
                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-xs font-black uppercase">{u.full_name || 'Anonymous'}</span>
                            </td>
                            <td>
                              <span className="font-mono text-sm font-bold text-[#39FF14] bg-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_#000]">
                                {u.trust_score?.final_score || 0}
                              </span>
                            </td>
                            <td>
                              <span className="brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase bg-white">
                                {u.plan || 'Free'}
                              </span>
                            </td>
                            <td>{renderStatusBadge(u.status)}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  id={`adj-${u.id}`} 
                                  defaultValue={u.trust_score?.admin_score_modifier || 0} 
                                  className="brutal-input !py-1 !px-2 !w-20 !text-xs" 
                                />
                                <button 
                                  onClick={() => {
                                    const val = (document.getElementById(`adj-${u.id}`) as HTMLInputElement).value;
                                    handleInlineAdjust(u.id, Number(val));
                                  }} 
                                  className="p-1 px-3 font-display text-[10px] uppercase tracking-widest border-2 border-black bg-[#00E5FF] hover:bg-black hover:text-[#00E5FF] shadow-[2px_2px_0px_#000]"
                                >
                                  Recalculate
                                </button>
                                <button onClick={() => openScoreModal(u)} className="p-1 border-2 border-black bg-brutal-yellow hover:bg-black hover:text-brutal-yellow" title="God Mode Breakdown"><Eye size={14} /></button>
                              </div>
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
                  <div className="flex flex-col">
                    <h3 className="font-display text-xl uppercase">Backend Diagnostics</h3>
                    {lastRefreshed && (
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <RefreshCw size={9} />
                        Auto-refreshes every 30s · Last: {lastRefreshed.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={fetchDiagnostics}
                    disabled={diagLoading}
                    className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    title="Refresh now"
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
                    {/* Supabase Health */}
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

                    {/* Neo4j Health */}
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

                    {/* MongoDB Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-brutal-yellow" style={{ color: '#E8A400' }}>
                        <Database size={18} />
                        <h4 className="font-display text-sm uppercase">MongoDB Atlas</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${
                          diagnostics.mongodb?.status === 'connected'    ? 'bg-brutal-green' :
                          diagnostics.mongodb?.status === 'connecting'   ? 'bg-brutal-yellow' :
                          diagnostics.mongodb?.status === 'disconnected' ? 'bg-brutal-pink'   :
                          'bg-gray-200'
                        }`}>
                          {diagnostics.mongodb?.status ?? 'unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">
                          {diagnostics.mongodb?.status === 'connected'
                            ? `${diagnostics.mongodb.latency}ms`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Cloudinary Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-brutal-yellow" style={{ color: '#0078FF' }}>
                        <Cloud size={18} />
                        <h4 className="font-display text-sm uppercase">Cloudinary Storage</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${
                          diagnostics.cloudinary?.status === 'connected' ? 'bg-brutal-green' : 'bg-brutal-pink'
                        }`}>
                          {diagnostics.cloudinary?.status ?? 'unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">
                           {diagnostics.cloudinary?.status === 'connected' ? `${diagnostics.cloudinary.latency}ms` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Connect Wallet API Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-brutal-pink">
                        <Wallet size={18} />
                        <h4 className="font-display text-sm uppercase">Wallet Auth API</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${
                          diagnostics.wallet?.status === 'reachable' ? 'bg-brutal-green' : 'bg-brutal-pink'
                        }`}>
                          {diagnostics.wallet?.status ?? 'unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">
                           {diagnostics.wallet?.status === 'reachable' ? `${diagnostics.wallet.latency}ms` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Sumsub Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-brutal-blue">
                        <Fingerprint size={18} />
                        <h4 className="font-display text-sm uppercase">Sumsub eKYC</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${
                          diagnostics.sumsub?.status === 'reachable' ? 'bg-brutal-green' : 
                          diagnostics.sumsub?.status === 'not_configured' ? 'bg-gray-100' : 'bg-brutal-pink'
                        }`}>
                          {diagnostics.sumsub?.status ?? 'unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">
                           {diagnostics.sumsub?.status === 'reachable' ? `${diagnostics.sumsub.latency}ms` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Razorpay Gateway Health */}
                    <div className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_#000] space-y-4">
                      <div className="flex items-center gap-2 text-blue-500">
                        <DollarSign size={18} />
                        <h4 className="font-display text-sm uppercase">Razorpay Gateway</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase">Status:</span>
                        <span className={`brutal-badge !text-[8px] !px-2 !py-0.5 !border-2 uppercase ${
                          diagnostics.razorpay?.status === 'connected' ? 'bg-brutal-green text-black' :
                          diagnostics.razorpay?.status === 'not_configured' ? 'bg-gray-100 text-gray-400' : 'bg-brutal-pink text-white'
                        }`}>
                          {diagnostics.razorpay?.status === 'connected' ? 'connected' :
                           diagnostics.razorpay?.status === 'not_configured' ? 'not configured' :
                           diagnostics.razorpay?.status === 'unauthorized' ? 'invalid keys' : 
                           (diagnostics.razorpay?.status ?? 'unknown')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500">Latency:</span>
                        <span className="text-[10px] font-bold">
                           {diagnostics.razorpay?.status === 'connected' ? `${diagnostics.razorpay.latency}ms` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Environment Info — spans full width */}
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
                          <p className="text-[8px] font-black text-gray-500 uppercase">Production Time</p>
                          <p className="text-[10px] font-bold tabular-nums">{projectAge}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-4 border-black border-dashed text-center space-y-2">
                    <p className="text-xs font-black uppercase text-red-500">Failed to load system diagnostics</p>
                    {diagError && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{diagError}</p>}
                    <button onClick={fetchDiagnostics} className="text-[8px] font-black underline uppercase hover:text-black">Try Again</button>
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

          <div className="brutal-card !bg-brutal-blue !text-white shadow-[4px_4px_0px_#000] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock size={20} className="shrink-0" />
              <div className="font-display text-xs uppercase tracking-widest leading-tight">
                Production<br />Time:
              </div>
            </div>
            <div className="font-display text-sm font-black uppercase tracking-widest tabular-nums text-right leading-tight">
              {projectAge}
            </div>
          </div>
        </div>
      </div>
      
      {/* God Mode Score Modal */}
      {selectedUserForScore && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="brutal-card bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setSelectedUserForScore(null)} className="absolute top-4 right-4 text-2xl font-black">×</button>
            <h2 className="font-display text-2xl uppercase border-b-4 border-black pb-4 mb-6">
              God Mode: <span className="text-brutal-blue">{selectedUserForScore.email}</span>
            </h2>

            {scoreModalLoading && !userScoreData ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brutal-blue" size={32} /></div>
            ) : userScoreData ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-black text-white p-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400">Calculated</p>
                    <p className="font-display text-4xl">{userScoreData.calculatedScore}</p>
                  </div>
                  <div className="text-xl font-black">+</div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400">Admin Adjust</p>
                    <p className="font-display text-4xl text-brutal-yellow">{manualAdjustment}</p>
                  </div>
                  <div className="text-xl font-black">=</div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-brutal-blue">Final Score</p>
                    <p className="font-display text-5xl text-brutal-green">{userScoreData.finalScore}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-sm uppercase mb-3">Trust Signals Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(userScoreData.signals || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 border-2 border-black bg-gray-50">
                        <span className="text-[10px] font-black uppercase">{key.replace('_', ' ')}</span>
                        <span className="font-mono font-bold">{String(value)} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-4 border-brutal-blue p-4 bg-brutal-blue/10 space-y-4">
                  <div>
                    <h3 className="font-display text-sm uppercase mb-2 text-brutal-blue">Trust Score Override</h3>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        value={manualAdjustment} 
                        onChange={(e) => setManualAdjustment(Number(e.target.value))}
                        className="brutal-input flex-1 !text-lg !font-bold"
                        placeholder="e.g. 100 or -50"
                      />
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-brutal-blue/30 pt-3">
                    <h3 className="font-display text-sm uppercase mb-2 text-brutal-blue">Subscription Plan Override</h3>
                    <select
                      value={selectedUserPlan}
                      onChange={(e) => setSelectedUserPlan(e.target.value)}
                      className="brutal-input w-full !py-2.5 !font-black uppercase text-xs"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t-2 border-dashed border-brutal-blue/30 pt-3">
                    <h3 className="font-display text-sm uppercase mb-2 text-brutal-blue">Account Status Override</h3>
                    <select
                      value={selectedUserStatus}
                      onChange={(e) => setSelectedUserStatus(e.target.value)}
                      className="brutal-input w-full !py-2.5 !font-black uppercase text-xs"
                    >
                      <option value="active">ACTIVE</option>
                      <option value="paused">PAUSED</option>
                      <option value="suspended">SUSPENDED</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleAdjustScore}
                    disabled={scoreModalLoading}
                    className="w-full brutal-btn bg-brutal-blue text-white uppercase text-xs py-3 mt-2 font-display tracking-wider flex items-center justify-center gap-2"
                  >
                    {scoreModalLoading ? <Loader2 className="animate-spin" size={16} /> : 'Apply God Mode Overrides'}
                  </button>

                  <div className="border-t-2 border-dashed border-red-500/30 pt-3 mt-4">
                    <h3 className="font-display text-sm uppercase mb-2 text-red-600 font-black">Danger Zone</h3>
                    <button 
                      onClick={handleDeleteUser}
                      disabled={scoreModalLoading}
                      className="w-full brutal-btn bg-brutal-pink text-white uppercase text-xs py-3 font-display tracking-wider flex items-center justify-center gap-2 hover:bg-black hover:text-brutal-pink transition-colors font-black"
                    >
                      {scoreModalLoading ? <Loader2 className="animate-spin" size={16} /> : 'Permanently Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
