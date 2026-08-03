import React, { useState } from 'react';
import { ShieldCheck, Lock, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VITE_API_BASE_URL } from '../lib/api';

interface ConsentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  onSuccess: () => void;
}

export const ConsentVaultModal: React.FC<ConsentVaultModalProps> = ({
  isOpen,
  onClose,
  providerName,
  onSuccess
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${VITE_API_BASE_URL}/consent/grant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_type: 'LINK_ACCOUNT',
          scope_consented: {
            provider: providerName.toLowerCase(),
            permissions: ['read_profile_data', 'verify_reputation_score', 'read_activity_metrics'],
            purpose: 'Computing dynamic trust passport reputation score'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Consent logging failed on server');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onSuccess();
        onClose();
      }, 1800);
    } catch (error: any) {
      console.error('Consent authorization error:', error);
      alert('Authorization failed: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 dark:border-zinc-800 p-6 w-full max-w-md shadow-lg relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={loading}
          className="absolute top-4 right-4 p-1 border border-slate-200 dark:border-zinc-800 bg-white hover:bg-gray-100 font-bold text-xs uppercase"
        >
          ✕
        </button>

        {!success ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div className="p-1.5 border border-slate-200 dark:border-zinc-800 bg-brutal-blue text-white shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-display text-lg uppercase tracking-wider text-black">
                Consent Vault
              </h3>
            </div>

            <div className="p-3 bg-gray-50 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs font-semibold text-gray-700 leading-relaxed">
              <p>
                <span className="font-bold text-black">Crifolayer</span> is requesting a user-as-agent secure proxy delegation to your <span className="font-bold text-black text-brutal-blue uppercase">{providerName}</span> account.
              </p>
              <div className="border-t-2 border-dashed border-gray-300 my-2" />
              <div className="space-y-1 text-[11px]">
                <p className="flex items-center gap-1.5 text-black">
                  <Lock size={12} className="text-brutal-green" /> 
                  We will pull your job completion rates & earnings.
                </p>
                <p className="flex items-center gap-1.5 text-black">
                  <Lock size={12} className="text-brutal-green" /> 
                  We will strictly comply with provider rate limits.
                </p>
                <p className="flex items-center gap-1.5 text-gray-500">
                  <Lock size={12} className="text-brutal-pink" /> 
                  We will NOT read private messages or post on your behalf.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
              <Lock size={10} /> Private by default · AES-256 Encrypted
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-800 bg-white text-xs font-bold uppercase text-black hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthorize}
                disabled={loading}
                className="px-5 py-2 border border-slate-200 dark:border-zinc-800 bg-brutal-green text-xs font-bold uppercase text-black shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm active:bg-green-300 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Authorizing
                  </>
                ) : (
                  <>Authorize and Link</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-3 border border-slate-200 dark:border-zinc-800 bg-brutal-green text-black rounded-full shadow-md animate-bounce">
              <Sparkles size={32} />
            </div>
            <h3 className="font-display text-xl uppercase tracking-wider text-black">
              Authorized Successfully!
            </h3>
            <p className="text-xs font-semibold text-gray-600 max-w-xs">
              Your {providerName} credentials have been linked securely. Calculating updated Trust Score in background...
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
