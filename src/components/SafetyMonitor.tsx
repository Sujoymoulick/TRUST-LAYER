import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface SafetyEvent {
  severity: 'yellow' | 'red';
  category: string;
}

export const SafetyMonitor: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<SafetyEvent | null>(null);

  useEffect(() => {
    // Listen for 'harmful_detected' events via Supabase Realtime
    // Note: In a real scenario, this would be a broadcast channel or a table change
    const channel = supabase.channel('message-safety')
      .on('broadcast', { event: 'harmful_detected' }, ({ payload }: { payload: any }) => {
        setActiveAlert(payload as SafetyEvent);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!activeAlert) return null;

  const isRed = activeAlert.severity === 'red';

  return (
    <>
      {/* Red Alert: High-Priority Modal */}
      {isRed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="brutal-card bg-brutal-pink max-w-md w-full animate-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 border border-slate-200 dark:border-zinc-800 bg-white flex items-center justify-center">
                <ShieldAlert className="size-10 text-brutal-pink" />
              </div>
              <h2 className="font-display text-2xl uppercase leading-none">Security Threat Detected</h2>
            </div>
            <p className="text-sm font-bold uppercase mb-8">
              An incoming message was flagged for <span className="underline">{activeAlert.category}</span>. 
              The content has been blocked to protect your identity.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveAlert(null)}
                className="brutal-btn bg-black text-white w-full py-4 text-xs font-bold uppercase"
              >
                Dismiss Safely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yellow Alert: Warning Banner */}
      {!isRed && (
        <div className="fixed top-0 left-0 right-0 z-[90] p-4 animate-in slide-in-from-top duration-300">
          <div className="brutal-card bg-brutal-yellow flex items-center justify-between gap-4 py-3 shadow-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Warning: Suspicious message pattern detected ({activeAlert.category})
              </span>
            </div>
            <button onClick={() => setActiveAlert(null)} className="p-1 hover:bg-black/10 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
