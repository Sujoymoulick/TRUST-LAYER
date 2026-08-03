import React, { useState } from 'react';
import { ShieldCheck, Loader2, X, CheckCircle2, Lock, Smartphone } from 'lucide-react';

interface DigiLockerVerifyProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export const DigiLockerVerify: React.FC<DigiLockerVerifyProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'initial' | 'otp' | 'success'>('initial');
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (aadhaar.length !== 12) {
      alert('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setLoading(true);
    // Mock API call to DigiLocker/Aadhaar
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    // Mock verification
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        onSuccess({ provider: 'digilocker', status: 'verified', doc_type: 'AADHAAR' });
      }, 2000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="brutal-card bg-white max-w-md w-full animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-slate-200 dark:border-zinc-800 bg-brutal-blue flex items-center justify-center">
               <ShieldCheck className="text-white" />
            </div>
            <h2 className="font-display text-xl uppercase tracking-tighter">DigiLocker Verify</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 border border-slate-200 dark:border-zinc-800">
            <X size={20} />
          </button>
        </div>

        {step === 'initial' && (
          <div className="space-y-6">
            <p className="text-[10px] font-bold uppercase text-gray-500 leading-relaxed">
              Verify your identity using India's national digital locker system. This will add <span className="text-black font-bold">+150 Trust Points</span> to your passport.
            </p>
            
            <div>
              <label className="block text-[10px] font-bold uppercase mb-2">Aadhaar Number</label>
              <input 
                type="text" 
                maxLength={12}
                placeholder="XXXX XXXX XXXX"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                className="w-full p-4 border border-slate-200 dark:border-zinc-800 font-bold text-lg focus:bg-brutal-yellow transition-colors outline-none"
              />
            </div>

            <button 
              onClick={handleSendOtp}
              disabled={loading}
              className="brutal-btn w-full bg-black text-white py-4 text-xs font-bold uppercase flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <Smartphone size={16} /></>}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div className="p-4 bg-brutal-yellow border border-slate-200 dark:border-zinc-800">
               <p className="text-[10px] font-bold uppercase">OTP sent to your Aadhaar linked mobile number ending in ****8901</p>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase mb-2">6-Digit OTP</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full p-4 border border-slate-200 dark:border-zinc-800 font-bold text-2xl tracking-[1em] text-center focus:bg-brutal-green transition-colors outline-none"
              />
            </div>

            <button 
              onClick={handleVerifyOtp}
              disabled={loading}
              className="brutal-btn w-full bg-brutal-green py-4 text-xs font-bold uppercase flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Verify & Link DigiLocker'}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
             <div className="w-24 h-24 rounded-full border border-slate-200 dark:border-zinc-800 bg-brutal-green flex items-center justify-center shadow-lg">
                <CheckCircle2 size={48} className="text-white" />
             </div>
             <div className="text-center">
               <h3 className="font-display text-2xl uppercase">Identity Anchored</h3>
               <p className="text-[10px] font-bold uppercase text-gray-500 mt-2">DigiLocker Verification Successful</p>
             </div>
             <div className="brutal-badge bg-black text-white text-[10px] !px-4 !py-2">
               +150 Trust Score
             </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-[8px] font-bold text-gray-400 uppercase">
           <Lock size={10} /> 256-bit Encrypted Zero-Knowledge Verification
        </div>

      </div>
    </div>
  );
};
