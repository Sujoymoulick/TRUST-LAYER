import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Loader2, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useGuest } from '../context/GuestContext';

interface ConnectedApp {
  id: string;
  provider: string;
  providerAccountId: string;
  status: string;
  lastSyncedAt: string;
  metadata: any;
}

export function ConnectedAppsSettingsTab({ userId }: { userId: string }) {
  const { isGuest } = useGuest();
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [confirmModalProvider, setConfirmModalProvider] = useState<ConnectedApp | null>(null);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    fetchApps();
  }, [userId, isGuest]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/v1/auth/oauth/summary/${userId}`);
      if (data && data.connectedAccounts) {
        setApps(data.connectedAccounts);
      }
    } catch (err) {
      console.error('Error fetching connected apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (provider: string) => {
    try {
      setUnlinkingId(provider);
      await apiFetch(`/api/v1/auth/oauth/revoke/${provider}`, { method: 'POST' });
      // Optimistic update
      setApps(apps.filter(app => app.provider !== provider));
      setConfirmModalProvider(null);
    } catch (err) {
      console.error('Failed to unlink:', err);
      alert('Failed to unlink provider.');
    } finally {
      setUnlinkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin size-10 text-brutal-blue" />
        <p className="font-display text-xs uppercase tracking-widest animate-pulse">Loading linked apps...</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="brutal-card p-12 text-center space-y-4">
        <Database size={48} className="mx-auto text-gray-300 mb-6" />
        <h3 className="font-display text-xl uppercase">No Apps Connected</h3>
        <p className="font-bold text-gray-500 uppercase text-xs">
          You haven't linked any external accounts yet. Go to your Passport to connect Web2 and Web3 identities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-2xl uppercase mb-6">Manage Connected Apps</h3>
      <div className="grid gap-6">
        {apps.map((app) => (
          <div key={app.id} className="brutal-card border-4 border-black p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#000]">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h4 className="font-display text-xl uppercase capitalize">{app.provider}</h4>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${app.status === 'CONNECTED' ? 'bg-brutal-green' : 'bg-brutal-pink text-white'}`}>
                  {app.status}
                </span>
              </div>
              <div className="text-xs font-bold text-gray-600 uppercase flex flex-wrap gap-x-4 gap-y-1">
                <span>ID: {app.providerAccountId}</span>
                <span>Last Synced: {new Date(app.lastSyncedAt).toLocaleString()}</span>
              </div>
              {app.metadata && Object.keys(app.metadata).length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-mono text-gray-500 line-clamp-1">
                    Scopes/Data: {Object.keys(app.metadata).join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex shrink-0">
              <button
                onClick={() => setConfirmModalProvider(app)}
                disabled={unlinkingId === app.provider}
                className="brutal-btn bg-brutal-pink text-white border-2 border-black px-6 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_#000] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000] transition-all flex items-center gap-2 w-full md:w-auto justify-center"
              >
                {unlinkingId === app.provider ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Unlink
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModalProvider && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="brutal-card border-[4px] border-black max-w-md w-full bg-white p-8 relative animate-in zoom-in-95 duration-200 shadow-[12px_12px_0px_#FF60B5]">
             <div className="text-brutal-pink mb-6">
                <AlertTriangle size={48} />
             </div>
             <h2 className="font-display text-2xl uppercase tracking-tighter mb-4">Unlink {confirmModalProvider.provider}?</h2>
             <p className="font-bold text-sm text-gray-600 mb-8 leading-relaxed">
               Are you sure you want to disconnect this app? We will immediately revoke the server-side tokens and delete the local connection records. Your trust score will be recalculated.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 w-full">
               <button 
                 onClick={() => setConfirmModalProvider(null)}
                 className="brutal-btn bg-gray-100 text-black border-2 border-black w-full"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => handleUnlink(confirmModalProvider.provider)}
                 disabled={unlinkingId === confirmModalProvider.provider}
                 className="brutal-btn bg-brutal-pink text-white border-2 border-black w-full flex items-center justify-center gap-2"
               >
                 {unlinkingId === confirmModalProvider.provider ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                 Yes, Disconnect
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
