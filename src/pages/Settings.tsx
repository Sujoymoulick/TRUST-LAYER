import { useEffect, useState } from 'react';
import { useGuest } from '../context/GuestContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Trash2, ShieldCheck, Sun, Moon } from 'lucide-react';

import type { User } from '@supabase/supabase-js';

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url: string;
}

export default function Settings() {
  const { isGuest, exitGuest } = useGuest();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    avatar_url: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setProfile({
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        email: profile.email !== user.email ? profile.email : undefined,
        data: { 
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        }
      });

      if (error) throw error;
      setMessage('Settings updated successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin size-12" />
      </div>
    );
  }

  if (isGuest || !user) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-12">
        <h2 className="font-display text-4xl uppercase">Settings</h2>
        <div className="brutal-card space-y-6 py-12">
          <div className="text-6xl">🔒</div>
          <h3 className="font-display text-xl uppercase">Guest Mode</h3>
          <p className="font-bold text-gray-600 leading-relaxed">
            Settings are only available to registered users. Create a free account to manage your profile and privacy.
          </p>
          <button
            className="brutal-btn bg-brutal-yellow w-full py-4 text-base"
            onClick={() => { exitGuest(); navigate('/login'); }}
          >
            Create Free Account →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-3xl uppercase mb-12">Settings</h2>

      {message && (
        <div className={`brutal-card mb-8 py-4 px-6 font-bold uppercase text-sm ${message.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12">
        <div className="space-y-4">
          <button className="w-full text-left font-display text-base uppercase pb-2 border-b-4 border-[var(--border-color)] flex items-center gap-2">
            <ShieldCheck size={20} /> Profile
          </button>
          <button className="w-full text-left font-display text-base uppercase pb-2 border-b-4 border-gray-200 text-gray-400">Privacy</button>
        </div>

        <div className="space-y-12">
          <form onSubmit={handleUpdate} className="brutal-card space-y-8">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 border-4 border-[var(--border-color)] rounded-full overflow-hidden bg-gray-100 shadow-[4px_4px_0px_#000]">
                  <img src={profile.avatar_url} alt="avatar" />
               </div>
               <div className="space-y-2">
                 <button type="button" className="brutal-btn bg-white px-4 py-1 text-[10px] uppercase font-black" onClick={() => setProfile({...profile, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`})}>Randomize Avatar</button>
                 <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Changes are saved locally until you submit.</p>
               </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-black text-xs uppercase mb-2">Display Name</label>
                <input 
                  className="brutal-input" 
                  value={profile.full_name} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block font-black text-xs uppercase mb-2">Email Address</label>
                <input 
                  className="brutal-input" 
                  value={profile.email} 
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  type="email"
                />
              </div>
              <div>
                <label className="block font-black text-xs uppercase mb-2">Identity Verification</label>
                <div className="brutal-badge bg-neon-orange text-[10px]">VERIFIED USER</div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="brutal-btn bg-brutal-blue text-white w-full sm:w-auto px-12 py-3 flex items-center justify-center gap-2"
                disabled={updating}
              >
                {updating ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
              </button>
            </div>
          </form>

          <section className="brutal-card space-y-6">
             <h3 className="font-display text-lg uppercase mb-4">Appearance</h3>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="p-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
                      {theme === 'dark' ? <Moon className="text-neon-orange" /> : <Sun className="text-brutal-yellow" />}
                   </div>
                   <div>
                      <h4 className="font-display text-sm uppercase">Dark Mode</h4>
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Toggle between light and dark system themes.</p>
                   </div>
                </div>
                <input 
                  type="checkbox" 
                  className="brutal-toggle" 
                  checked={theme === 'dark'} 
                  onChange={toggleTheme}
                />
             </div>
          </section>

          <section className="brutal-card space-y-6">
             <h3 className="font-display text-lg uppercase mb-4">Privacy & Access</h3>
             <div className="flex items-center justify-between">
                <div>
                   <h4 className="font-display text-sm uppercase">Visible to Public</h4>
                   <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Allow others to see your trust score on the network.</p>
                </div>
                <input type="checkbox" className="brutal-toggle" defaultChecked />
             </div>
          </section>

          <div className="pt-4 border-t-4 border-[var(--border-color)] border-dashed">
             <button type="button" className="brutal-btn bg-white text-red-600 border-red-600 w-full sm:w-auto px-8 py-3 flex items-center gap-2 hover:bg-red-50">
               <Trash2 size={18} /> Delete Account Permanently
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
