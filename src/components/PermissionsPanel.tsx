import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, Trash2, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VITE_API_BASE_URL } from '../lib/api';

interface ConsentLog {
  consent_id: string;
  action_type: string;
  scope_consented: {
    provider?: string;
    permissions?: string[];
  };
  status: 'ACTIVE' | 'REVOKED';
  timestamp: string;
  ip_address: string;
}

export const PermissionsPanel: React.FC = () => {
  const [logs, setLogs] = useState<ConsentLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [purgeLoading, setPurgeLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchActiveConsents();
  }, []);

  const fetchActiveConsents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch profiles configuration
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_shared_with_third_party')
        .eq('id', user.id)
        .single();
      
      setIsShared(profile?.is_shared_with_third_party || false);

      // 2. Fetch logged consents
      const { data: consentLogs, error } = await supabase
        .from('consent_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setLogs(consentLogs || []);
    } catch (err) {
      console.error('Failed to load active consents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSharing = async () => {
    const nextState = !isShared;
    setIsShared(nextState);
    setActionLoading('sharing');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const endpoint = nextState ? 'grant' : 'revoke';
      const response = await fetch(`${VITE_API_BASE_URL}/consent/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_type: 'SHARE_PASSPORT_B2B',
          scope_consented: {
            sharing_enabled: nextState,
            allowed_partner_types: ['fintech', 'recruitment', 'marketplaces']
          }
        })
      });

      if (!response.ok) throw new Error('Failed to update sharing preference');
      fetchActiveConsents();
    } catch (err: any) {
      console.error('Sharing update error:', err);
      alert('Failed: ' + err.message);
      setIsShared(!nextState); // Rollback
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (actionType: string, consentId: string) => {
    setActionLoading(consentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${VITE_API_BASE_URL}/consent/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_type: actionType
        })
      });

      if (!response.ok) throw new Error('Revocation failed');
      fetchActiveConsents();
    } catch (err: any) {
      console.error('Revoke error:', err);
      alert('Revocation failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const generateSimpleDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const txt = 'Pramaaan,ai - Compliance Engine 2026';
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125,1,62,20);
      ctx.fillStyle = "#069";
      ctx.fillText(txt, 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText(txt, 4, 17);
    }
    const canvasData = canvas.toDataURL();
    // basic hashing simulator
    let hash = 0;
    for (let i = 0; i < canvasData.length; i++) {
      hash = (hash << 5) - hash + canvasData.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  };

  const handleTotalPurge = async () => {
    setPurgeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fp = generateSimpleDeviceFingerprint();
      
      const response = await fetch(`${VITE_API_BASE_URL}/user/account-purge`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fingerprint: fp,
          device_attributes: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            timezoneOffset: new Date().getTimezoneOffset()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Total purge server request failed');
      }

      const resData = await response.json();
      alert(resData.message);
      
      // Signout and redirect
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Account purge error:', err);
      alert('Account deletion failed: ' + err.message);
      setPurgeLoading(false);
    }
  };

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_#000] p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-brutal-green" />
          <h3 className="font-display text-base uppercase tracking-wider text-black">Consent Vault & Privacy Audit</h3>
        </div>
        <button 
          onClick={fetchActiveConsents}
          disabled={loading}
          className="p-1.5 border-2 border-black hover:bg-gray-100 transition-colors"
          title="Refresh Permission Logs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* B2B Trust sharing control */}
        <div className="lg:col-span-1 p-4 border-2 border-black bg-gray-50 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_#000]">
          <div className="space-y-2">
            <h4 className="font-display text-xs uppercase text-black">Public Trust Score Privacy</h4>
            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
              When disabled, all external metrics are private by default. B2B recruitment or lending partners cannot query your Trust Score without explicit runtime consent.
            </p>
          </div>
          
          <button
            onClick={handleToggleSharing}
            disabled={actionLoading === 'sharing'}
            className={`w-full py-2 border-2 border-black font-black text-[10px] uppercase shadow-[3px_3px_0px_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000] flex items-center justify-center gap-2 ${
              isShared ? 'bg-brutal-yellow text-black' : 'bg-white text-gray-500'
            }`}
          >
            {actionLoading === 'sharing' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isShared ? (
              <>
                <Eye size={14} /> Shared with Third-Party
              </>
            ) : (
              <>
                <EyeOff size={14} /> Private (Default)
              </>
            )}
          </button>
        </div>

        {/* Auditing permissions logs */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="font-display text-xs uppercase text-black">Linked Platform Consents</h4>
          
          {loading ? (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="animate-spin text-brutal-blue" size={24} />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-[10px] font-black uppercase text-gray-400 py-4 text-center">No active platform connections found.</p>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-2 border-2 border-black p-3 bg-gray-50 shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]">
              {logs.map((log) => (
                <div key={log.consent_id} className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex justify-between items-center gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[10px] uppercase">{log.action_type}</span>
                      {log.scope_consented?.provider && (
                        <span className="brutal-badge !text-[8px] !px-1.5 !py-0.5 uppercase bg-brutal-blue text-white">
                          {log.scope_consented.provider}
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] font-bold text-gray-400 mt-1">
                      Logged IP: {log.ip_address} · {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    {log.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleRevoke(log.action_type, log.consent_id)}
                        disabled={actionLoading === log.consent_id}
                        className="px-2 py-1 border-2 border-black bg-brutal-pink text-white text-[8px] font-black uppercase shadow-[1px_1px_0px_#000] hover:bg-red-600 transition-colors"
                      >
                        {actionLoading === log.consent_id ? '...' : 'Revoke'}
                      </button>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-gray-400 border border-gray-300 px-2 py-1 bg-gray-100">
                        Revoked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* GDPR Data Deletion Challenge */}
      <div className="border-t-4 border-dashed border-black pt-5 space-y-3">
        <h4 className="font-display text-xs uppercase text-black flex items-center gap-1.5">
          <AlertCircle size={14} className="text-brutal-pink" /> Right to be Forgotten (GDPR / DPDP)
        </h4>
        <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
          Requesting total deletion will completely purge your cleartext PII, profile data, connected accounts, and transactions. To prevent bad actors from creating circular accounts to game Trust Scores, an immutable SHA-256 fingerprint remains logged in our security prevention ledger.
        </p>
        <button
          onClick={() => setShowPurgeModal(true)}
          className="px-4 py-2 border-2 border-black bg-brutal-pink text-white text-[10px] font-black uppercase shadow-[3px_3px_0px_#000] hover:bg-red-600 transition-all"
        >
          Request Total Account Deletion
        </button>
      </div>

      {/* Total Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-sm shadow-[8px_8px_0px_#000] space-y-5 animate-in zoom-in duration-200">
            <div className="flex items-center gap-2 border-b-4 border-black pb-3 text-brutal-pink">
              <Trash2 size={22} />
              <h3 className="font-display text-base uppercase tracking-wider text-black">Confirm Total Deletion</h3>
            </div>

            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Are you absolutely sure? This will delete your reputation passport, credentials, linked accounts, and reviews instantly. <strong>This action is completely irreversible.</strong>
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                disabled={purgeLoading}
                className="px-4 py-2 border-2 border-black bg-white text-xs font-black uppercase text-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTotalPurge}
                disabled={purgeLoading}
                className="px-5 py-2 border-2 border-black bg-brutal-pink text-white text-xs font-black uppercase shadow-[3px_3px_0px_#000] hover:bg-red-600 flex items-center gap-2"
              >
                {purgeLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Purging
                  </>
                ) : (
                  'Purge My Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
