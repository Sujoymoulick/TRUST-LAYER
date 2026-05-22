import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, BarChart2, Code, Settings, Bell, Menu, X, DollarSign, LogOut, ShieldCheck, Lock, Wallet, BookOpen, MessageSquare, Database } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';
import { isAdminEmail, getAdminRoleTitle } from '../lib/utils';
import mainLogo from '../assets/pramaaanlogo-removebg.png';
import { SafetyMonitor } from '../components/SafetyMonitor';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSIWE } from '../hooks/useSIWE';
import { useProfileAvatar } from '../hooks/useProfileAvatar';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', guestAllowed: true },
  { to: '/verification-center', icon: ShieldCheck, label: 'Verification Center', guestAllowed: true },
  { to: '/wallet',    icon: Wallet,          label: 'Wallet',    guestAllowed: false },
  { to: '/identity',  icon: User,            label: 'Identity',  guestAllowed: true  },
  { to: '/passport',  icon: BookOpen,        label: 'Passport',  guestAllowed: false },
  { to: '/connected-apps', icon: Database,   label: 'Connected Apps', guestAllowed: false },
  { to: '/vault',     icon: Lock,            label: 'Consent Vault', guestAllowed: false },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics', guestAllowed: true  },
  {
    label: 'DEV Tools',
    icon: Code,
    guestAllowed: false,
    submenu: [
      { to: '/developer/portal',     label: 'Developer Portal' },
      { to: '/developer/keys',       label: 'Personal Keys' },
      { to: '/developer/docs',       label: 'API Docs' },
      { to: '/developer/playground', label: 'Playground' },
      { to: '/developer/sdk',        label: 'SDK & Libraries' },
      { to: '/developer/webhooks',   label: 'Webhooks' },
      { to: '/developer/logs',       label: 'API Logs' },
      { to: '/developer/status',     label: 'API Status' },
    ]
  },
  { to: '/pricing',   icon: DollarSign,       label: 'Pricing',   guestAllowed: true  },
  { to: '/feedback',  icon: MessageSquare,    label: 'Feedback',  guestAllowed: true  },
];

export function DashboardLayout() {
  const { isGuest, exitGuest } = useGuest();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('active');
  const [devToolsOpen, setDevToolsOpen] = useState(pathname.startsWith('/developer'));

  useEffect(() => {
    if (pathname.startsWith('/developer')) {
      setDevToolsOpen(true);
    }
  }, [pathname]);

  useSIWE();

  // Real-time avatar from Supabase Storage
  const avatar = useProfileAvatar(user?.id ?? null);

  useEffect(() => {
    async function getUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Owner fallback handled below for the plan

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, role, plan, status')
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
              plan: 'free',
              status: 'active'
            }]);
            
          if (insertError) {
             console.error('Frontend profile creation failed (RLS blocked?):', insertError);
          } else {
             console.log('Successfully created missing profile from frontend!');
          }
        } else if (error) {
          console.error('Profile fetch error:', error);
        }
        
        if (profile?.full_name) setProfileName(profile.full_name);
        if (profile?.status) setStatus(profile.status);
        
        let userPlan = profile?.plan || 'free';
        if (user.email && isAdminEmail(user.email) && userPlan !== 'admin') {
          console.log('Upgrading admin to Admin Elite plan in DB...');
          const { error: upgradeError } = await supabase
            .from('profiles')
            .update({ plan: 'admin' })
            .eq('id', user.id);
          if (!upgradeError) {
            userPlan = 'admin';
          }
        }
        setPlan(userPlan);
      }
    }
    if (!isGuest) getUserAndProfile();
  }, [isGuest, navigate]);

  // Real-time subscription to listen specifically to the current user's status changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('Realtime profile status update received:', payload);
          if (payload.new && typeof payload.new.status === 'string') {
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const visibleNavItems = isGuest
    ? NAV_ITEMS.filter(item => item.guestAllowed)
    : NAV_ITEMS;

  const handleSignIn = () => { exitGuest(); navigate('/login'); };
  const closeSidebar = () => setSidebarOpen(false);

  // If user is administrative block or suspended, render full screen Neo-Brutalist overlay
  if (!isGuest && (status === 'suspended' || status === 'paused')) {
    const isSuspended = status === 'suspended';
    return (
      <div 
        className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 md:p-8 min-h-screen w-full transition-all duration-300 ${
          isSuspended ? 'bg-[#FF60B5]' : 'bg-[#FFE600]'
        }`}
        style={{ fontFamily: "'Public Sans', sans-serif" }}
      >
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>

        <div className="relative w-full max-w-2xl bg-white border-[4px] border-black p-6 md:p-10 shadow-[8px_8px_0px_#000] text-black text-center z-10 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 border-3 border-black bg-black text-white font-display text-xs md:text-sm uppercase tracking-wider mb-6 shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
            <Lock size={16} className={isSuspended ? 'text-[#FF60B5]' : 'text-[#FFE600]'} />
            <span>Administrative Action Enforced</span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-4 break-words">
            {isSuspended ? 'Account Suspended' : 'Account Paused'}
          </h1>

          <div className="border-3 border-black bg-zinc-100 p-4 md:p-6 mb-8 text-left shadow-[4px_4px_0px_#000]">
            <p className="font-bold text-sm md:text-base leading-relaxed mb-4 text-black">
              {isSuspended ? (
                <>
                  Your account has been <span className="underline decoration-[#FF60B5] decoration-4 font-black">permanently suspended</span> by the network administration for protocol violations, suspicious activities, or score irregularities.
                </>
              ) : (
                <>
                  Your account has been <span className="underline decoration-[#FFE600] decoration-4 font-black">temporarily paused</span> by the network administration. Standard capabilities are disabled until review completion.
                </>
              )}
            </p>
            <div className="text-xs text-zinc-600 font-bold border-t-2 border-black/10 pt-4 flex flex-col gap-1">
              <div><strong>USER IDENTIFIER:</strong> {user?.email}</div>
              <div><strong>ENFORCEMENT SYSTEM:</strong> God Mode Terminal</div>
              <div><strong>REAL-TIME STATUS:</strong> <span className="uppercase text-black font-black">{status}</span></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/logout')}
              className="brutal-btn w-full sm:w-auto bg-black text-white hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={16} />
              <span>Log Out & Exit</span>
            </button>
            <a
              href="/"
              className="brutal-btn w-full sm:w-auto bg-white text-black hover:bg-zinc-100 transition-colors"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              <BookOpen size={16} />
              <span>Public Website</span>
            </a>
          </div>

        </div>

        <div className="mt-8 text-center font-display text-xs uppercase tracking-widest text-black/60 select-none z-10">
          Pramaaan Trust Layer • Security Protocol v2.4
        </div>
      </div>
    );
  }

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
          'flex flex-col bg-[var(--bg-primary)] border-r-[3px] border-[var(--border-color)]',
          'z-50 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="p-4 sm:p-5 border-b-[3px] border-[var(--border-color)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 sm:gap-2">
              <img src={mainLogo} alt="Pramaaan Logo" className="h-6 sm:h-8 w-auto object-contain" />
              <span className="font-display text-base sm:text-lg uppercase italic font-black text-[var(--text-primary)] tracking-tight">Pramaaan</span>
            </span>
            {isGuest && (
              <div className="mt-1 inline-block text-center" style={{ background: '#FFE600', border: '2px solid #000', padding: '2px 10px', fontFamily: "'Archivo Black', sans-serif", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#000' }}>
                Guest Mode
              </div>
            )}
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 border-2 border-[var(--border-color)] bg-[var(--bg-primary)]">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            if (item.submenu) {
              const isSubmenuActive = pathname.startsWith('/developer');
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col">
                  <div 
                    onClick={() => setDevToolsOpen(!devToolsOpen)}
                    className={`nav-link cursor-pointer hover:bg-brutal-yellow/10 flex items-center justify-between select-none ${isSubmenuActive ? 'text-black font-black bg-zinc-100 border-l-[6px] border-black' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-black text-black/50 transition-transform duration-200 mr-2 ${devToolsOpen ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </div>
                  {devToolsOpen && (
                    <div className="flex flex-col border-l-[3px] border-black/20 ml-[23px] my-1 gap-1">
                      {item.submenu.map((sub: any) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={closeSidebar}
                          className={({ isActive }) => 
                            `pl-4 py-2 text-xs font-black uppercase tracking-wider block transition-all border-b border-black/5 last:border-b-0 ${
                              isActive 
                                ? 'text-black bg-brutal-yellow border-r-2 border-black font-black shadow-[2px_2px_0px_#000] translate-x-1' 
                                : 'text-zinc-600 hover:text-black hover:bg-brutal-yellow/20'
                            }`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            const Icon = item.icon;
            const to = item.to || '';
            return (
              <NavLink
                key={to}
                to={to}
                onClick={closeSidebar}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          
          {/* Admin Console - Only visible to the owner or admin plan (never to guests) */}
          {!isGuest && (isAdminEmail(user?.email) || plan === 'admin') && (
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
          <div className="p-4 border-t-[3px] border-[var(--border-color)]" style={{ background: 'rgba(255, 230, 0, 0.1)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex-shrink-0 border-2 border-[var(--border-color)] rounded-full overflow-hidden bg-[var(--bg-primary)] flex items-center justify-center">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Anonymous</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Guest Access</div>
              </div>
            </div>
            <button onClick={handleSignIn} className="brutal-btn w-full bg-[var(--text-primary)] text-[var(--bg-primary)] py-2 text-xs uppercase font-black">
              Sign In to Unlock
            </button>
          </div>
        ) : (
          <div className="p-4 border-t-[3px] border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-primary)]">
            <div className="w-9 h-9 flex-shrink-0 border-2 border-[var(--border-color)] rounded-full overflow-hidden bg-gray-100 shadow-[2px_2px_0px_var(--border-color)]">
              <img src={avatar.url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/personas/svg?seed=${user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontWeight: 900, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                {profileName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {isAdminEmail(user?.email) ? `${getAdminRoleTitle(user?.email) || 'ADMINISTRATOR'} (Admin Elite)` : `${plan === 'admin' ? 'Admin Elite' : (plan || 'Free')} Plan`}
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => navigate('/settings')}
                className="p-1.5 border-2 border-[var(--border-color)] transition-colors hover:bg-brutal-yellow"
                title="Settings"
              >
                <Settings size={14} className="text-[var(--text-primary)]" />
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Guest banner */}
        {isGuest && (
          <div className="flex items-center justify-between flex-shrink-0 px-4 md:px-8 py-2.5 border-b-[3px] border-[var(--border-color)]" style={{ background: '#FFE600' }}>
            <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#000' }}>
              👁 Guest Mode — demo data only
            </span>
            <button onClick={handleSignIn} className="brutal-btn bg-black text-brutal-yellow px-4 py-1.5 text-[10px] min-h-0 uppercase font-black">
              Create Account →
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b-[3px] border-[var(--border-color)] bg-[var(--bg-primary)]" style={{ height: 64 }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 border-[3px] border-[var(--border-color)] bg-brutal-yellow shadow-[3px_3px_0px_#000]"
            >
              <Menu size={20} className="text-black" />
            </button>
            <h2 className="hidden sm:block font-display text-lg uppercase tracking-tight text-[var(--text-primary)]">
              Network Console
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="bg-brutal-yellow text-black border-2 border-black font-black uppercase text-[10px] px-2.5 sm:px-4 py-1.5 shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all whitespace-nowrap"
                            type="button"
                          >
                            <span className="hidden sm:inline">Connect Wallet</span>
                            <span className="inline sm:hidden">Connect</span>
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="bg-brutal-pink text-white border-2 border-black font-black uppercase text-[10px] px-2.5 sm:px-4 py-1.5 shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all whitespace-nowrap"
                            type="button"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            className="bg-white hover:bg-gray-50 text-black border-2 border-black font-black uppercase text-[10px] px-2 py-1 shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 whitespace-nowrap"
                            type="button"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            <span className="hidden md:inline">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="bg-brutal-blue text-white border-2 border-black font-black uppercase text-[10px] px-2.5 sm:px-4 py-1.5 shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all whitespace-nowrap"
                            type="button"
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
            <button className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full transition-colors">
              <Bell size={20} className="text-[var(--text-primary)]" />
            </button>
            {isGuest ? (
              <button onClick={handleSignIn} className="brutal-btn bg-brutal-pink text-white text-[10px] px-4 py-1.5 min-h-0 uppercase font-black">
                Sign In
              </button>
            ) : (
              <div onClick={() => navigate('/settings')} className="w-9 h-9 border-2 border-[var(--border-color)] rounded-full overflow-hidden bg-gray-100 cursor-pointer shadow-[2px_2px_0px_var(--border-color)]">
                <img src={avatar.url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/personas/svg?seed=${user?.email}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8" style={{ background: 'var(--bg-primary)' }}>
          <SafetyMonitor />
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex-shrink-0 flex border-t-[3px] border-[var(--border-color)] bg-[var(--bg-primary)]" style={{ minHeight: 60 }}>
          {visibleNavItems.slice(0, 5).map((item) => {
            const to = item.to || item.submenu?.[0]?.to || '';
            const Icon = item.icon;
            const label = item.label;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 py-2 border-r-[2px] border-[var(--border-color)] last:border-r-0 text-[0.55rem] font-black uppercase tracking-wide no-underline transition-colors ${isActive ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
