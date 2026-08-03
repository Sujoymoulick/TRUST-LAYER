import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumOverlayProps {
  requiredPlan: 'Pro' | 'Pro Plus' | 'Business';
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PremiumOverlay({ requiredPlan, title, description, children }: PremiumOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="relative group overflow-hidden rounded-sm">
      <div className="filter blur-[6px] opacity-40 pointer-events-none select-none transition-all duration-300">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-[2px] z-10 p-4">
        <div className="brutal-card bg-white border-4 border-black text-center max-w-md mx-auto shadow-[8px_8px_0px_#000]">
          <div className="w-16 h-16 bg-brutal-yellow text-black flex items-center justify-center mx-auto mb-4 border-4 border-black shadow-[4px_4px_0px_#000]">
            <Lock className="w-8 h-8" />
          </div>
          <h4 className="font-display text-xl uppercase mb-2">{title}</h4>
          <p className="text-xs font-bold text-gray-600 mb-6 uppercase">{description}</p>
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full brutal-btn bg-[#00E5FF] text-black font-black uppercase py-4 border-4 border-black hover:bg-black hover:text-[#00E5FF] transition-colors shadow-[4px_4px_0px_#000]"
          >
            Upgrade to {requiredPlan}
          </button>
        </div>
      </div>
    </div>
  );
}
