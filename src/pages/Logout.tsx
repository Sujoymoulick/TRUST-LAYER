import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Home, ArrowLeft } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';

import { useDisconnect } from 'wagmi';

const Logout = () => {
  const { exitGuest } = useGuest();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
        disconnect(); // Disconnect wallet on logout
        exitGuest();
      } catch (error) {
        console.error('Logout error:', error);
      }
    };
    handleLogout();
    
    const timer = setTimeout(() => {
      // navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [exitGuest]);

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
