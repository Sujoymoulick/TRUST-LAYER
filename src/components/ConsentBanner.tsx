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
    <div className="fixed bottom-6 left-6 right-6 md:right-auto md:max-w-md bg-white border border-slate-200 dark:border-zinc-800 p-6 shadow-lg z-[9999] transition-all duration-300 transform translate-y-0">
      <div className="flex items-start gap-4">
        <div className="p-2 border border-slate-200 dark:border-zinc-800 bg-brutal-yellow text-black flex-shrink-0 shadow-sm">
          <ShieldAlert size={20} />
        </div>
        <div className="space-y-3 min-w-0 flex-1">
          <h3 className="font-display text-sm uppercase tracking-wider text-black">
            Privacy & Trust Framework
          </h3>
          <p className="text-[11px] leading-relaxed font-semibold text-gray-700">
            Crifolayer minimizes traditional cookies, but utilizes advanced digital device fingerprinting strictly for platform security, bot protection, and preserving the integrity of the Trust Score ecosystem.
          </p>

          {!showManage ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 bg-brutal-green text-black text-[10px] font-bold uppercase shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm transition-all"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-3 py-1.5 border border-slate-200 dark:border-zinc-800 bg-gray-100 text-black text-[10px] font-bold uppercase shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm transition-all"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={() => setShowManage(true)}
                className="px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white text-black text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-gray-50 transition-colors"
                title="Manage Granular Preferences"
              >
                <Settings2 size={12} />
                Manage
              </button>
            </div>
          ) : (
            <div className="border-t-2 border-dashed border-gray-300 pt-3 space-y-3">
              <div className="space-y-2">
                {/* Preference 1 */}
                <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-black">Essential Cookies</p>
                    <p className="text-[8px] font-bold text-gray-500">Required for session state</p>
                  </div>
                  <Check size={14} className="text-brutal-green" />
                </div>

                {/* Preference 2 */}
                <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-black">Device Fingerprinting</p>
                    <p className="text-[8px] font-bold text-gray-500">Security & anti-gaming verification</p>
                  </div>
                  <Check size={14} className="text-brutal-green" />
                </div>

                {/* Preference 3 */}
                <div className="flex items-center justify-between gap-3 p-2 bg-white border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-black">B2B Partner Trust Sharing</p>
                    <p className="text-[8px] font-bold text-gray-500">Allows third-party query verification</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.thirdPartySharing}
                    onChange={(e) => setPreferences({ ...preferences, thirdPartySharing: e.target.checked })}
                    className="w-4 h-4 border border-slate-200 dark:border-zinc-800 text-black focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowManage(false)}
                  className="px-2.5 py-1 border border-slate-200 dark:border-zinc-800 bg-white text-[9px] font-bold uppercase text-black hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-3 py-1 border border-slate-200 dark:border-zinc-800 bg-brutal-green text-[9px] font-bold uppercase text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm transition-all"
                >
                  Save Choices
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
