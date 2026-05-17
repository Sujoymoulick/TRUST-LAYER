import { Shield } from 'lucide-react';

interface ButtonProps {
  clientId: string;
  redirectUri: string;
  state?: string;
  codeChallenge: string;
  scope?: string;
  customText?: string;
}

export default function LoginWithTrustLayerButton({
  clientId,
  redirectUri,
  state = '',
  codeChallenge,
  scope = 'read:trustscore',
  customText = 'Verify with Pramaaan'
}: ButtonProps) {
  
  const handleOAuthClick = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    
    // Construct target authorize URL redirecting to OAuth serverless controller
    const authUrl = `${apiBaseUrl}/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
    
    // Redirect user into the secure login & consent tunnel
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleOAuthClick}
      className="group relative inline-flex items-center gap-3 bg-zinc-950 text-white font-black uppercase text-xs tracking-wider px-6 py-4 border-2 border-white hover:bg-zinc-900 transition-all active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
      style={{
        boxShadow: '4px 4px 0px #00FF66',
      }}
    >
      <div className="w-6 h-6 rounded-none bg-brutal-green text-black flex items-center justify-center border-2 border-black group-hover:scale-110 transition-transform">
        <Shield size={14} className="fill-current" />
      </div>
      
      <span className="font-display font-black tracking-widest">
        {customText}
      </span>

      <span className="text-[10px] bg-white/10 px-2 py-0.5 text-zinc-400 font-bold border border-white/10">
        SDK v1.0
      </span>
    </button>
  );
}
