import React, { useState, useEffect } from 'react';
import { ShieldAlert, Settings2, Check } from 'lucide-react';

interface ConsentPreferences {
  essential: boolean;
  fingerprint: boolean;
  thirdPartySharing: boolean;
}

export const ConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [showManage, setShowManage] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    fingerprint: true,
    thirdPartySharing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('crifolayer_consent_choices');
    if (!saved) {
      // Delay display slightly for gorgeous entry animation
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const all = { essential: true, fingerprint: true, thirdPartySharing: true };
    localStorage.setItem('crifolayer_consent_choices', JSON.stringify(all));
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    const minimal = { essential: true, fingerprint: true, thirdPartySharing: false };
    localStorage.setItem('crifolayer_consent_choices', JSON.stringify(minimal));
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('crifolayer_consent_choices', JSON.stringify(preferences));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 p-5 md:p-6 shadow-2xl z-[9999] transition-all duration-300 transform translate-y-0 text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Main Banner Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg flex-shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-100">
                Privacy & Trust Framework
              </h3>
              <p className="text-[11px] md:text-xs leading-relaxed text-zinc-400">
                Crifolayer minimizes traditional cookies, but utilizes advanced digital device fingerprinting strictly for platform security, bot protection, and preserving the integrity of the Trust Score ecosystem.
              </p>
            </div>
          </div>

          {!showManage && (
            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs font-bold uppercase tracking-wider rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={() => setShowManage(true)}
                className="px-3 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Manage Granular Preferences"
              >
                <Settings2 size={14} />
                Manage
              </button>
            </div>
          )}
        </div>

        {showManage && (
          <div className="border-t border-zinc-900 pt-4 mt-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Preference 1 */}
              <div className="flex items-center justify-between gap-4 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">Essential Cookies</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Required for session state</p>
                </div>
                <Check size={16} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full" />
              </div>

              {/* Preference 2 */}
              <div className="flex items-center justify-between gap-4 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">Device Fingerprinting</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Security & anti-gaming verification</p>
                </div>
                <Check size={16} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full" />
              </div>

              {/* Preference 3 */}
              <div className="flex items-center justify-between gap-4 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">B2B Partner Trust Sharing</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Allows third-party query verification</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.thirdPartySharing}
                  onChange={(e) => setPreferences({ ...preferences, thirdPartySharing: e.target.checked })}
                  className="w-4 h-4 border border-zinc-700 rounded bg-zinc-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-900">
              <button
                onClick={() => setShowManage(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Save Choices
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
