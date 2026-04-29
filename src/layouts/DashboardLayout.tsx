import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, BarChart2, Code, Settings, Bell, Menu, X, DollarSign, LogOut, ShieldCheck, Lock } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';
import { isAdminEmail } from '../lib/utils';
import mainLogo from '../assets/main-logo.png';
import { SafetyMonitor } from '../components/SafetyMonitor';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/identity',  icon: User,            label: 'Identity'  },
  { to: '/vault',     icon: Lock,            label: 'Consent Vault' },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
  { to: '/api',       icon: Code,             label: 'API'       },
  { to: '/pricing',   icon: DollarSign,       label: 'Pricing'   },
  { to: '/settings',  icon: Settings,         label: 'Settings'  },
];

export function DashboardLayout() {
  const { isGuest, exitGuest } = useGuest();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    async function getUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Owner fallback handled below for the plan

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, plan')
          .eq('id', user.id)
          .single();
        
        if (error && error.code === 'PGRST116') {
          console.log('Profile missing. Attempting to create it from frontend...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url,
              role: isAdminEmail(user.email) ? 'admin' : 'user',
              plan: 'free'
            }]);
            
          if (insertError) {
             console.error('Frontend profile creation failed (RLS blocked?):', insertError);
          } else {
             console.log('Successfully created missing profile from frontend!');
          }
        } else if (error) {
          console.error('Profile fetch error:', error);
        }
        
        // If profile is missing (e.g. database trigger failed), fallback to free plan to avoid infinite loop
        const userPlan = profile?.plan || (isAdminEmail(user.email) ? 'pro' : 'free');
        setPlan(userPlan);
      }
    }
    if (!isGuest) getUserAndProfile();
  }, [isGuest, navigate]);

  const visibleNavItems = NAV_ITEMS;

  const handleSignIn = () => { exitGuest(); navigate('/login'); };
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Public Sans', sans-serif" }}>

      {/* ── Mobile backdrop ── */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''} lg:hidden`}
        onClick={closeSidebar}
      />

      <aside
        className={[
          'fixed lg:static inset-y-0 left-0',
          'w-60 flex-shrink-0',
          'flex flex-col bg-white border-r-[3px] border-black',
          'z-50 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="p-5 border-b-[3px] border-black flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-2">
              <img src={mainLogo} alt="TrustLayer Logo" className="h-8 w-auto object-contain" />
            </span>
            {isGuest && (
              <div className="mt-1 inline-block text-center" style={{ background: '#FFE600', border: '2px solid #000', padding: '2px 10px', fontFamily: "'Archivo Black', sans-serif", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Guest Mode
              </div>
            )}
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 border-2 border-black bg-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto">
          {visibleNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
          
          {/* Admin Console - Only visible to the owner */}
          {isAdminEmail(user?.email) && (
            <NavLink
              to="/admin"
              onClick={closeSidebar}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <ShieldCheck size={17} className="text-brutal-blue" />
              <span className="font-black text-brutal-blue">Admin Console</span>
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        {isGuest ? (
          <div className="p-4 border-t-[3px] border-black" style={{ background: '#FFF8E0' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex-shrink-0 border-2 border-black rounded-full overflow-hidden bg-white flex items-center justify-center">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>Anonymous</div>
                <div style={{ fontSize: '0.6rem', color: '#888', fontWeight: 600 }}>Guest Access</div>
              </div>
            </div>
            <button onClick={handleSignIn} className="brutal-btn w-full bg-black text-brutal-yellow py-2 text-xs uppercase font-black">
              Sign In to Unlock
            </button>
          </div>
        ) : (
          <div className="p-4 border-t-[3px] border-black flex items-center gap-3 bg-white">
            <div className="w-9 h-9 flex-shrink-0 border-2 border-black rounded-full overflow-hidden bg-gray-100 shadow-[2px_2px_0px_#000]">
              <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`} alt="avatar" className="w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontWeight: 900, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#555', fontWeight: 600, textTransform: 'capitalize' }}>
                {plan || 'Free'} Plan
              </div>
            </div>
            <button 
              onClick={() => navigate('/logout')}
              className="p-1.5 border-2 border-black hover:bg-brutal-pink hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Guest banner */}
        {isGuest && (
          <div className="flex items-center justify-between flex-shrink-0 px-4 md:px-8 py-2.5 border-b-[3px] border-black" style={{ background: '#FFE600' }}>
            <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              👁 Guest Mode — demo data only
            </span>
            <button onClick={handleSignIn} className="brutal-btn bg-black text-brutal-yellow px-4 py-1.5 text-[10px] min-h-0 uppercase font-black">
              Create Account →
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b-[3px] border-black bg-white" style={{ height: 64 }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 border-[3px] border-black bg-brutal-yellow shadow-[3px_3px_0px_#000]"
            >
              <Menu size={20} />
            </button>
            <h2 className="hidden sm:block font-display text-lg uppercase tracking-tight">
              Network Console
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
            </button>
            {isGuest ? (
              <button onClick={handleSignIn} className="brutal-btn bg-brutal-pink text-white text-[10px] px-4 py-1.5 min-h-0 uppercase font-black">
                Sign In
              </button>
            ) : (
              <div onClick={() => navigate('/settings')} className="w-9 h-9 border-2 border-black rounded-full overflow-hidden bg-gray-100 cursor-pointer shadow-[2px_2px_0px_#000]">
                <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="avatar" className="w-full" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8" style={{ background: '#F5F5F5' }}>
          <SafetyMonitor />
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex-shrink-0 flex border-t-[3px] border-black bg-white" style={{ minHeight: 60 }}>
          {visibleNavItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2 border-r-[2px] border-black last:border-r-0 text-[0.55rem] font-black uppercase tracking-wide no-underline transition-colors ${isActive ? 'bg-black text-brutal-yellow' : 'bg-white text-black'}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </div>
    </div>
  );
}
