import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, BarChart2, Code, Settings, Bell, Menu, X, DollarSign, LogOut, ShieldCheck, Lock, Wallet, BookOpen, MessageSquare, Database, ChevronRight } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';
import { isAdminEmail, getAdminRoleTitle } from '../lib/utils';
import mainLogo from '../assets/crifolayerlogo-removebg.png';
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

  // If user is suspended or paused, render full-screen sleek overlay
  if (!isGuest && (status === 'suspended' || status === 'paused')) {
    const isSuspended = status === 'suspended';
    return (
      <div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 md:p-8 min-h-screen w-full"
        style={{
          background: isSuspended
            ? 'linear-gradient(135deg, #0f0f11 0%, #1e0a1e 100%)'
            : 'linear-gradient(135deg, #0f0f11 0%, #0a1a0f 100%)',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative w-full max-w-lg rounded-2xl border border-white/10 p-8 md:p-12 text-center z-10 shadow-2xl" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-medium mb-8">
            <Lock size={12} className={isSuspended ? 'text-red-400' : 'text-amber-400'} />
            <span>Administrative Action Enforced</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            {isSuspended ? 'Account Suspended' : 'Account Paused'}
          </h1>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8 text-left">
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              {isSuspended ? (
                <>Your account has been <span className="text-red-400 font-semibold">permanently suspended</span> by the network administration for protocol violations, suspicious activities, or score irregularities.</>
              ) : (
                <>Your account has been <span className="text-amber-400 font-semibold">temporarily paused</span> by the network administration. Standard capabilities are disabled until review completion.</>
              )}
            </p>
            <div className="text-xs text-white/40 border-t border-white/10 pt-4 flex flex-col gap-1 font-mono">
              <div><strong className="text-white/60">USER:</strong> {user?.email}</div>
              <div><strong className="text-white/60">SYSTEM:</strong> God Mode Terminal</div>
              <div><strong className="text-white/60">STATUS:</strong> <span className="text-white/80">{status}</span></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/logout')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 transition-all"
            >
              <LogOut size={15} />
              Log Out & Exit
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <BookOpen size={15} />
              Public Website
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-white/25 select-none">
          Crifolayer Trust Layer · Security Protocol v2.4
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Mobile backdrop ── */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''} lg:hidden`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed lg:static inset-y-0 left-0',
          'w-60 flex-shrink-0',
          'flex flex-col border-r border-[var(--border-color)]',
          'z-50 transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <img src={mainLogo} alt="Crifolayer Logo" className="h-10 w-auto object-contain" />
              <span className="font-display text-base font-bold text-[var(--text-primary)] tracking-tight">Crifolayer</span>
            </span>
            {isGuest && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb), 0.2)' }}>
                Guest Mode
              </div>
            )}
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--border-color)] transition-colors">
            <X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {visibleNavItems.map((item) => {
            if (item.submenu) {
              const isSubmenuActive = pathname.startsWith('/developer');
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col">
                  <div
                    onClick={() => setDevToolsOpen(!devToolsOpen)}
                    className={`nav-link cursor-pointer flex items-center justify-between select-none ${isSubmenuActive ? 'active' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={13} className={`text-[var(--text-secondary)] transition-transform duration-200 mr-1 ${devToolsOpen ? 'rotate-90' : ''}`} />
                  </div>
                  {devToolsOpen && (
                    <div className="flex flex-col ml-9 my-1 pl-3 border-l border-[var(--border-color)] gap-0.5">
                      {item.submenu.map((sub: any) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={closeSidebar}
                          className={({ isActive }) =>
                            `px-3 py-1.5 text-xs font-medium rounded-lg block transition-all ${
                              isActive
                                ? 'text-[var(--accent)] bg-[rgba(var(--accent-rgb),0.1)] font-semibold'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--accent-rgb),0.05)]'
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
                <Icon size={16} />
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
              <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>Admin Console</span>
            </NavLink>
          )}
        </nav>

        {/* Sidebar Footer */}
        {isGuest ? (
          <div className="p-4 border-t border-[var(--border-color)]" style={{ background: 'rgba(var(--accent-rgb), 0.04)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden border border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-center text-sm">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Anonymous</div>
                <div className="text-xs text-[var(--text-secondary)]">Guest Access</div>
              </div>
            </div>
            <button
              onClick={handleSignIn}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Sign In to Unlock
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden border border-[var(--border-color)] shadow-sm">
              <img src={avatar.url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/personas/svg?seed=${user?.email || 'user'}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {profileName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'}
              </div>
              <div className="text-xs text-[var(--text-secondary)] capitalize">
                {isAdminEmail(user?.email) ? `${getAdminRoleTitle(user?.email) || 'Administrator'}` : `${plan === 'admin' ? 'Admin Elite' : (plan || 'Free')} Plan`}
              </div>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
              title="Settings"
            >
              <Settings size={14} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        )}
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Guest banner */}
        {isGuest && (
          <div className="flex items-center justify-between flex-shrink-0 px-4 md:px-8 py-2.5 border-b border-[var(--border-color)]" style={{ background: 'rgba(var(--accent-rgb), 0.08)' }}>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              👁 Guest Mode — demo data only
            </span>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Create Account →
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-color)]" style={{ height: 64, background: 'var(--bg-primary)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors"
            >
              <Menu size={18} className="text-[var(--text-primary)]" />
            </button>
            <h2 className="hidden sm:block font-display text-base font-semibold text-[var(--text-primary)]">
              Network Console
            </h2>
          </div>

          <div className="flex items-center gap-3">
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
                            className="rounded-xl border border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all whitespace-nowrap"
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
                            className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/15 transition-all whitespace-nowrap"
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
                            className="rounded-xl border border-[var(--border-color)] px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all flex items-center gap-1.5 whitespace-nowrap"
                            type="button"
                          >
                            {chain.hasIcon && (
                              <div style={{ background: chain.iconBackground, width: 12, height: 12, borderRadius: 999, overflow: 'hidden' }}>
                                {chain.iconUrl && (
                                  <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} style={{ width: 12, height: 12 }} />
                                )}
                              </div>
                            )}
                            <span className="hidden md:inline">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ background: 'var(--accent)' }}
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

            <button className="p-2 rounded-xl hover:bg-[var(--border-color)] transition-colors">
              <Bell size={18} className="text-[var(--text-secondary)]" />
            </button>

            {isGuest ? (
              <button
                onClick={handleSignIn}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                Sign In
              </button>
            ) : (
              <div
                onClick={() => navigate('/settings')}
                className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border-color)] cursor-pointer hover:ring-2 transition-all"
                style={{ '--tw-ring-color': 'rgba(var(--accent-rgb),0.4)' } as any}
              >
                <img src={avatar.url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/personas/svg?seed=${user?.email}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8" style={{ background: 'var(--bg-primary)' }}>
          <SafetyMonitor />
          <Outlet context={{ plan, status, isOwner: isAdminEmail(user?.email) }} />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex-shrink-0 flex border-t border-[var(--border-color)]" style={{ minHeight: 60, background: 'var(--bg-primary)' }}>
          {visibleNavItems.slice(0, 5).map((item) => {
            const to = item.to || item.submenu?.[0]?.to || '';
            const Icon = item.icon;
            const label = item.label;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[0.55rem] font-medium uppercase tracking-wide no-underline transition-colors ${
                    isActive
                      ? 'text-[var(--accent)] bg-[rgba(var(--accent-rgb),0.08)]'
                      : 'text-[var(--text-secondary)]'
                  }`
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
