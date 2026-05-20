import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Copy,
  Loader2,
  Key,
  CheckCircle,
  Trash2,
  Plus,
  AlertTriangle,
  EyeOff,
  Lock,
  Shield,
  Activity,
  Code,
  Clock,
  Globe,
  ArrowUpRight,
  BarChart2
} from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

interface B2bApp {
  id: string;
  name: string;
  description: string | null;
  sandboxKeyHint: string;
  productionKeyHint: string;
  createdAt: string;
}

export default function ApiDashboard() {
  const { isGuest } = useGuest();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Portal State Data
  const [apps, setApps] = useState<B2bApp[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Registration Form
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);

  // Keys Display Modal
  const [generatedApp, setGeneratedApp] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Revoke App Modal
  const [appToRevoke, setAppToRevoke] = useState<B2bApp | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    async function initializePortal() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await fetchAppsAndMetrics(user.id);
        }
      } catch (err) {
        console.error('Failed to load Developer Portal:', err);
      } finally {
        setLoading(false);
      }
    }

    initializePortal();
  }, [isGuest]);

  const fetchAppsAndMetrics = async (uid: string) => {
    try {
      // List Developer Apps
      const appsRes = await fetch(`${API_BASE_URL}/developer/apps?userId=${uid}`);
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApps(appsData.data || []);
      }

      // Fetch Telemetry metrics
      const metricsRes = await fetch(`${API_BASE_URL}/developer/metrics?userId=${uid}`);
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch apps/metrics:', err);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newAppName.trim()) return;
    setIsRegistering(true);

    try {
      const response = await fetch(`${API_BASE_URL}/developer/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAppName,
          description: newAppDesc,
          userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedApp(data);
        setShowRegModal(false);
        setNewAppName('');
        setNewAppDesc('');
        await fetchAppsAndMetrics(userId);
      }
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevokeApp = async () => {
    if (!userId || !appToRevoke) return;
    setIsRevoking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/developer/apps/${appToRevoke.id}?userId=${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setAppToRevoke(null);
        await fetchAppsAndMetrics(userId);
      }
    } catch (err) {
      console.error('Failed to revoke app:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCopy = (text: string, type: 'sb' | 'prod') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-zinc-800 size-12" />
      </div>
    );
  }

  // Guest Mode placeholder
  if (isGuest) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div>
          <h2 className="font-display text-3xl uppercase">B2B Developer Portal</h2>
          <p className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">Integrate Pramaaan Trustlayer into third-party apps.</p>
        </div>

        <div className="brutal-card shadow-[8px_8px_0px_#000] flex flex-col items-center text-center py-16 gap-6">
          <div className="w-20 h-20 border-4 border-black bg-brutal-yellow flex items-center justify-center shadow-[6px_6px_0px_#000]">
            <Lock size={40} />
          </div>
          <h3 className="font-display text-2xl uppercase">Developer Suite Locked</h3>
          <p className="font-bold text-gray-600 uppercase text-xs tracking-widest max-w-sm leading-relaxed">
            API key generation, HMAC payload signing credentials, and integration telemetry logs are reserved for registered users.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="brutal-btn bg-brutal-yellow text-black px-8 py-3 text-sm font-black uppercase"
          >
            Create Developer Account →
          </button>
        </div>
      </div>
    );
  }

  // Pure SVG brutalist time-series chart points generator
  const getChartPath = (daily: any) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const values = days.map(d => daily?.[d] || 0);
    const maxVal = Math.max(...values, 5);
    
    // Convert 7 coordinates to SVG line coordinates
    return values.map((val, idx) => {
      const x = (idx * 60) + 20;
      const y = 90 - ((val / maxVal) * 70);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
      
      {/* ─── MODAL 1: REGISTER APPLICATION ─── */}
      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_#000] max-w-md w-full p-6 flex flex-col gap-6">
            <h3 className="font-display text-2xl uppercase leading-none">Register New App</h3>
            
            <form onSubmit={handleCreateApp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Application Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Web Platform"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full border-2 border-black p-3 font-bold text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Unified payment check logic"
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  className="w-full border-2 border-black p-3 font-bold text-xs uppercase h-20"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="brutal-btn flex-1 bg-zinc-100 text-black px-4 py-3 font-black uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="brutal-btn flex-1 bg-brutal-green text-black px-4 py-3 font-black uppercase text-[10px] flex items-center justify-center gap-2"
                >
                  {isRegistering ? <Loader2 className="animate-spin size-4" /> : 'Register App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CREDENTIALS GENERATED SCREEN ─── */}
      {generatedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/20 shadow-2xl rounded-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="p-2 bg-brutal-green/20 rounded-full text-brutal-green">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-white font-display text-xl uppercase tracking-wider">Credentials Generated</h3>
                <p className="text-white/60 text-xs">Copy and store keys securely now.</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 text-red-200">
                <AlertTriangle className="shrink-0 text-red-400 size-5" />
                <p className="text-xs">
                  This is the <strong>only time</strong> we will display these keys cleartext. If you lose them, you will need to regenerate new application key pairs.
                </p>
              </div>

              {/* Sandbox Key */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Sandbox API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black border border-white/10 rounded-lg p-3 font-mono text-xs text-white break-all flex items-center gap-2">
                    <EyeOff size={14} className="text-white/40 shrink-0" />
                    {generatedApp.sandboxKey}
                  </div>
                  <button
                    onClick={() => handleCopy(generatedApp.sandboxKey, 'sb')}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors shrink-0"
                  >
                    {copiedKey === 'sb' ? <CheckCircle size={16} className="text-brutal-green" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Production Key */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Production API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black border border-white/10 rounded-lg p-3 font-mono text-xs text-white break-all flex items-center gap-2">
                    <EyeOff size={14} className="text-white/40 shrink-0" />
                    {generatedApp.productionKey}
                  </div>
                  <button
                    onClick={() => handleCopy(generatedApp.productionKey, 'prod')}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors shrink-0"
                  >
                    {copiedKey === 'prod' ? <CheckCircle size={16} className="text-brutal-green" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black border-t border-white/10 flex justify-end">
              <button
                onClick={() => setGeneratedApp(null)}
                className="text-white/70 hover:text-white px-4 py-2 font-bold text-xs transition-colors uppercase tracking-wider"
              >
                I have saved these keys securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: REVOKE APPLICATION CONFIRMATION ─── */}
      {appToRevoke && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_#000] max-w-sm w-full p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle size={32} />
              <h3 className="font-display text-2xl uppercase leading-none">Revoke App?</h3>
            </div>
            
            <p className="text-xs font-bold uppercase text-gray-500 tracking-widest leading-relaxed">
              Are you sure you want to revoke <strong>{appToRevoke.name}</strong>? This is permanent. All B2B API requests using sandbox or production credentials of this app will fail instantly.
            </p>
            
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setAppToRevoke(null)}
                className="brutal-btn flex-1 bg-zinc-100 text-black px-4 py-3 font-black uppercase text-[10px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleRevokeApp}
                disabled={isRevoking}
                className="brutal-btn flex-1 bg-red-500 text-white px-4 py-3 font-black uppercase text-[10px] flex items-center justify-center gap-2"
              >
                {isRevoking ? <Loader2 className="animate-spin size-4" /> : 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-3xl uppercase flex items-center gap-2">
            <Code size={32} /> B2B Developer Portal
          </h2>
          <p className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">Generate encrypted API key credentials, review telemetry charts, and integrate verify widgets.</p>
        </div>
        <button
          onClick={() => setShowRegModal(true)}
          className="brutal-btn bg-brutal-yellow text-black text-xs px-6 py-3 flex items-center gap-2 font-black uppercase shadow-[4px_4px_0px_#000]"
        >
          <Plus size={16} /> Register B2B App
        </button>
      </div>

      {/* ─── ROW 1: METRICS HIGHLIGHT CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Calls */}
        <div className="brutal-card p-6 flex items-center gap-4 bg-white border-4 border-black shadow-[6px_6px_0px_#000]">
          <div className="p-3 bg-brutal-blue/15 text-brutal-blue border-2 border-black">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total API Transactions</h4>
            <span className="text-2xl font-display uppercase tracking-wide text-black dark:text-white">{metrics?.totalCalls || 0}</span>
          </div>
        </div>

        {/* Card 2: Average Latency */}
        <div className="brutal-card p-6 flex items-center gap-4 bg-white border-4 border-black shadow-[6px_6px_0px_#000]">
          <div className="p-3 bg-brutal-yellow/15 text-brutal-yellow border-2 border-black">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Average Gateway Latency</h4>
            <span className="text-2xl font-display uppercase tracking-wide text-black dark:text-white">{metrics?.averageLatency || 0}ms</span>
          </div>
        </div>

        {/* Card 3: Integrators Status */}
        <div className="brutal-card p-6 flex items-center gap-4 bg-white border-4 border-black shadow-[6px_6px_0px_#000]">
          <div className="p-3 bg-brutal-green/15 text-brutal-green border-2 border-black">
            <Globe size={24} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Registered B2B Apps</h4>
            <span className="text-2xl font-display uppercase tracking-wide text-black dark:text-white">{apps.length} Active</span>
          </div>
        </div>

      </div>

      {/* ─── ROW 2: ACTIVE B2B APPLICATIONS LIST ─── */}
      <div className="brutal-card p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000]">
        <h3 className="font-display text-lg uppercase flex items-center gap-2 mb-6">
          <Shield size={20} /> Registered Applications
        </h3>

        {apps.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-zinc-300 bg-zinc-50">
            <p className="text-zinc-500 font-bold uppercase text-xs">No B2B integrations active. Register your first application above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.map(app => (
              <div key={app.id} className="border-3 border-black p-4 bg-zinc-50 dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_#000]">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-sm uppercase text-black dark:text-white">{app.name}</h4>
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase mt-0.5">{app.description || 'No description provided'}</p>
                    </div>
                    <span className="bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-[9px] font-mono px-2 py-0.5 border border-black dark:border-zinc-700 uppercase font-bold">
                      ID: {app.id}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {/* Sandbox hint */}
                    <div className="flex justify-between items-center text-[10px] bg-white dark:bg-zinc-800 p-2 border border-black dark:border-zinc-700 font-mono text-zinc-600 dark:text-zinc-300">
                      <span>SANDBOX:</span>
                      <span className="font-black text-black dark:text-white">{app.sandboxKeyHint}</span>
                    </div>
                    {/* Prod hint */}
                    <div className="flex justify-between items-center text-[10px] bg-white dark:bg-zinc-800 p-2 border border-black dark:border-zinc-700 font-mono text-zinc-600 dark:text-zinc-300">
                      <span>PRODUCTION:</span>
                      <span className="font-black text-black dark:text-white">{app.productionKeyHint}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-black">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Created: {new Date(app.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => setAppToRevoke(app)}
                    className="text-red-500 hover:bg-red-50 p-2 border-2 border-transparent hover:border-black transition-all"
                    title="Revoke Application"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ROW 3: CHARTS & WIDGET CODE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: SVG Telemetry Chart */}
        <div className="brutal-card lg:col-span-2 p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg uppercase flex items-center gap-2 mb-6">
              <BarChart2 size={20} /> Telemetry Volume (Last 7 Days)
            </h3>

            {/* SVG Brutalist Polyline Chart */}
            <div className="border-4 border-black p-4 bg-zinc-50 relative aspect-[2.5/1] overflow-hidden flex items-end">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#ddd" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="55" x2="400" y2="55" stroke="#ddd" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#ccc" strokeWidth="2" />

                {/* Neo-brutalist Bold Chart Stroke */}
                {metrics?.dailyVolume ? (
                  <>
                    {/* Shadow block */}
                    <polygon
                      points={`20,90 ${getChartPath(metrics.dailyVolume)} 380,90`}
                      fill="rgba(0, 255, 102, 0.08)"
                    />
                    <polyline
                      fill="none"
                      stroke="#000"
                      strokeWidth="6"
                      points={getChartPath(metrics.dailyVolume)}
                      strokeLinecap="square"
                    />
                    <polyline
                      fill="none"
                      stroke="#00FF66"
                      strokeWidth="3"
                      points={getChartPath(metrics.dailyVolume)}
                      strokeLinecap="square"
                    />
                  </>
                ) : (
                  <text x="50" y="50" fill="#999" fontSize="12" fontWeight="bold">NO TELEMETRY SIGNALS CAPTURED</text>
                )}
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className={metrics?.dailyVolume?.[d] ? 'text-black dark:text-white font-black' : ''}>{d} ({metrics?.dailyVolume?.[d] || 0})</span>
            ))}
          </div>
        </div>

        {/* Right: Embeddable Login Widget Code */}
        <div className="brutal-card p-6 bg-brutal-navy text-white border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="font-display text-lg uppercase text-brutal-yellow">Verify Widget Code</h3>
            <p className="text-xs font-bold leading-relaxed opacity-90 uppercase">
              Embed our high-contrast, premium B2B third-party verify button directly inside your project structure.
            </p>
            
            {/* HTML code snippet block */}
            <div className="bg-black/50 border-2 border-black p-3 rounded-none font-mono text-[10px] text-brutal-green break-all overflow-y-auto max-h-24">
              {`<LoginWithTrustLayerButton
  clientId="${apps[0]?.id || 'YOUR_APP_ID'}"
  redirectUri="https://yourdomain.com/callback"
  codeChallenge="PKCE_CHALLENGE"
/>`}
            </div>
          </div>

          <button
            onClick={() => {
              if (apps[0]) {
                const code = `<LoginWithTrustLayerButton\n  clientId="${apps[0].id}"\n  redirectUri="https://yourdomain.com/callback"\n  codeChallenge="PKCE_CHALLENGE"\n/>`;
                navigator.clipboard.writeText(code);
                alert('Widget code block copied to clipboard!');
              } else {
                alert('Please register a B2B Application first to populate the client ID.');
              }
            }}
            className="brutal-btn bg-brutal-yellow text-black self-start px-6 py-3 text-xs font-black uppercase flex items-center gap-2 border-2 border-black"
          >
            Copy Snippet <ArrowUpRight size={16} />
          </button>
        </div>

      </div>

      {/* ─── ROW 4: RECENT API TRANSACTION LOGS ─── */}
      <div className="brutal-card p-0 overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000] bg-white">
        <h3 className="font-display text-lg uppercase p-4 border-b-4 border-black bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white flex items-center gap-2">
          <Activity size={20} /> Real-Time B2B API Transaction Logs
        </h3>
        
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>App</th>
                <th>Endpoint</th>
                <th>Latency</th>
                <th>Environment</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recentLogs && metrics.recentLogs.length > 0 ? (
                metrics.recentLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="uppercase font-mono text-xs font-black text-black">
                      <span className={`px-2 py-0.5 border border-black ${log.method === 'POST' ? 'bg-brutal-blue/10 text-brutal-blue' : 'bg-zinc-100 text-black'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="font-bold text-xs">{log.appName}</td>
                    <td className="font-mono text-xs text-zinc-500">{log.endpoint}</td>
                    <td className="font-bold text-xs">{log.duration}ms</td>
                    <td>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${log.environment === 'production' ? 'bg-brutal-yellow/20 text-yellow-700 border-yellow-700' : 'bg-zinc-200 border-zinc-400'}`}>
                        {log.environment}
                      </span>
                    </td>
                    <td className="font-bold text-xs">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td>
                      <div className={`w-6 h-6 border-2 border-black flex items-center justify-center font-bold text-[10px] ${log.status >= 400 ? 'bg-brutal-pink text-black' : 'bg-brutal-green text-black'}`}>
                        {log.status}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400 font-bold uppercase">No gateway transactions recorded. Verify your API credentials.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
