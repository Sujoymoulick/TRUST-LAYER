import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, ArrowLeft } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';
import { useDisconnect } from 'wagmi';

const Logout = () => {
  const { exitGuest } = useGuest();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      disconnect(); // Disconnect wallet on logout
      exitGuest();
      setIsLoggedOut(true);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedOut) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="brutal-card text-center space-y-8 py-10 px-8">
            <h1 className="text-4xl font-display leading-none uppercase tracking-tight">Stay or Exit?</h1>
            
            {/* Cute animated duck walker video */}
            <div className="flex justify-center my-4">
              <div className="border-4 border-black shadow-[6px_6px_0px_#000] bg-white overflow-hidden p-2 rounded-lg" style={{ width: '180px', height: '180px' }}>
                <video 
                  src="/CookieDuckApp_Duck_Walk_01.webm" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <p className="text-lg font-body font-bold text-gray-700">
              Do you want to stay in your secure Pramaaan trust session or exit and log out?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Stay / Cancel Button */}
              <button 
                onClick={() => navigate(-1)} 
                className="brutal-btn flex-1 bg-brutal-green text-black font-black uppercase text-sm py-4 cursor-pointer"
              >
                <span>Stay</span>
              </button>

              {/* Exit / Confirm Button */}
              <button 
                onClick={handleLogout}
                disabled={loading}
                className="brutal-btn flex-1 bg-brutal-pink text-white font-black uppercase text-sm py-4 cursor-pointer"
              >
                <span>{loading ? 'Exiting...' : 'Exit'}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 font-display text-xs uppercase hover:underline decoration-2 underline-offset-2"
              >
                <ArrowLeft size={12} />
                Return to Landing Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="brutal-card text-center space-y-8 py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brutal-yellow border-4 border-black shadow-[4px_4px_0px_#000] mb-4">
            <LogOut size={40} className="text-black" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-display leading-none">Logged Out</h1>
            <p className="text-xl font-body font-bold">
              You have been safely logged out of your Pramaaan session.
            </p>
          </div>

          <div className="bg-brutal-pink border-4 border-black p-6 shadow-[6px_6px_0px_#000] rotate-1">
            <p className="text-white font-black uppercase text-sm tracking-widest">
              Security Notice
            </p>
            <p className="text-black font-bold mt-2">
              For maximum security, please close your browser window if you are on a public computer.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Link to="/login" className="brutal-btn w-full bg-brutal-green">
              <span>Sign In Again</span>
            </Link>
            <Link to="/" className="brutal-btn w-full bg-white">
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 font-display text-sm uppercase hover:underline decoration-4 underline-offset-4"
          >
            <ArrowLeft size={16} />
            Return to Pramaaan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Logout;
