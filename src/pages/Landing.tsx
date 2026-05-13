import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuest } from '../context/GuestContext';
import { useTheme } from '../context/ThemeContext';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Globe, 
  Shield, 
  User, 
  Cpu, 
  Database as DbIcon, 
  Zap, 
  Lock,
  ArrowRight,
  Target,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import { Component as RocketLoader } from '../components/ui/rocket-loader';
import mainLogo from '../assets/Trust-layer.png';

const PLATFORMS = [
  { name: 'GitHub', icon: <Shield size={20} /> },
  { name: 'LinkedIn', icon: <User size={20} /> },
  { name: 'Supabase', icon: <DbIcon size={20} /> },
  { name: 'Gemini AI', icon: <Cpu size={20} /> },
  { name: 'Ethereum', icon: <Zap size={20} /> },
  { name: 'Polygon', icon: <ShieldCheck size={20} /> },
  { name: 'Solana', icon: <Globe size={20} /> },
];

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuest } = useGuest();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGuest = () => { enterGuest(); navigate('/dashboard'); };
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTurnstileOpen(true);
  };

  if (loading) return <RocketLoader />;

  const floatTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  } as const;

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden selection:bg-neon-green selection:text-black`}>
      {/* Mesh Gradient Background */}
      <div className={`fixed inset-0 pointer-events-none mesh-gradient-bg ${theme === 'dark' ? 'opacity-30' : 'opacity-10'}`} />

      {/* NAV */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6 border-b-2 border-[var(--border-color)] backdrop-blur-xl bg-[var(--nav-bg)]">
        <div className="flex items-center gap-3">
          <img 
            src={mainLogo} 
            alt="Pramaaan Logo" 
            className={`h-10 w-auto transition-all duration-300 ${theme === 'dark' ? 'invert brightness-150' : ''}`} 
          />
          <span className="hidden sm:inline font-display text-xl tracking-tighter uppercase italic font-black">Pramaaan</span>
        </div>

        <div className="hidden md:flex gap-10 font-bold text-[12px] uppercase tracking-[0.2em] text-[var(--text-primary)]">
          <a href="#" className="hover:text-neon-orange transition-colors">Ecosystem</a>
          <a href="#" className="hover:text-neon-orange transition-colors">API docs</a>
          <Link to="/pricing" className="hover:text-neon-orange transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 border-2 border-[var(--border-color)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Link to="/login" onClick={handleLoginClick} className="hidden sm:block text-xs font-black uppercase tracking-widest hover:text-neon-orange">Login</Link>
          <Link to="/login" onClick={handleLoginClick} className="brutal-btn !bg-neon-orange !text-black !py-2 !px-6 !text-xs !shadow-[4px_4px_0px_var(--border-color)]">Sign Up</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 grid lg:grid-cols-12 gap-16 items-center">
        
        {/* LEFT COLUMN: Content */}
        <div className="lg:col-span-7 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-orange/10 border border-neon-orange/30 rounded-full mb-6">
              <div className="w-2 h-2 bg-neon-orange rounded-full neon-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-orange">Network Active v1.0</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter uppercase italic">
              The Portable<br />
              <span className="text-neon-orange">Pramaaan</span><br />
              For The Web.
            </h1>
            
            <p className="mt-8 text-lg md:text-xl text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed">
              Aggregate your professional reputation from GitHub, LinkedIn, and Web3 into one verifiable identity.
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              to="/login" 
              onClick={handleLoginClick} 
              className="group relative brutal-btn !bg-brutal-yellow !text-black !px-10 !py-5 !text-lg !shadow-[8px_8px_0px_var(--color-neon-orange)] hover:-translate-y-1 active:translate-y-0 transition-transform"
            >
              Start Building Trust
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button 
              onClick={handleGuest} 
              className="brutal-btn !bg-transparent !text-[var(--text-primary)] !border-[var(--border-color)] !px-10 !py-5 !text-lg !shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:!bg-[var(--text-primary)]/5"
            >
              Try Sandbox
            </button>
          </motion.div>

          {/* Integration Features */}
          <div className="grid grid-cols-2 gap-8 pt-12 border-t border-[var(--border-color)]">
            <div className="flex gap-4">
              <div className="p-3 bg-neon-orange/10 border border-neon-orange/20 h-fit">
                <Cpu className="text-neon-orange" size={24} />
              </div>
              <div>
                <h4 className="font-display text-sm tracking-tight mb-1 text-[var(--text-primary)]">Trust Analysis</h4>
                <p className="text-[11px] text-gray-500 uppercase font-black leading-tight">Advanced behavioral and risk modeling for true identity metrics.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="p-3 bg-brutal-blue/10 border border-brutal-blue/20 h-fit">
                <DbIcon className="text-brutal-blue" size={24} />
              </div>
              <div>
                <h4 className="font-display text-sm tracking-tight mb-1 text-[var(--text-primary)]">Supabase Backend</h4>
                <p className="text-[11px] text-gray-500 uppercase font-black leading-tight">PostgreSQL storage with enterprise-grade security and real-time sync.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Antigravity Components */}
        <div className="lg:col-span-5 relative h-[600px]">
          
          {/* Trust Score Card */}
          <motion.div 
            className="absolute top-10 right-0 w-64 glass-brutalism p-6 z-30"
            animate={{ y: [0, -15, 0] }}
            transition={{ ...floatTransition, delay: 0 } as any}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] italic">Network Rank</span>
              <div className="w-2 h-2 rounded-full bg-neon-orange neon-pulse" />
            </div>
            <div className="text-center">
              <h2 className="font-display text-6xl tracking-tighter mb-2 italic">842</h2>
              <div className="h-1.5 w-full bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-neon-orange shadow-[0_0_15px_#FF5F00]"
                  initial={{ width: 0 }}
                  animate={{ width: "84%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className="inline-block mt-4 text-[10px] font-black uppercase tracking-widest text-neon-orange">Verified Elite</span>
            </div>
          </motion.div>

          {/* Risk Status Card */}
          <motion.div 
            className="absolute top-1/2 left-0 -translate-y-1/2 w-56 glass-brutalism p-5 z-20"
            animate={{ y: [-10, 5, -10] }}
            transition={{ ...floatTransition, delay: 0.5 } as any}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brutal-pink/20 border border-brutal-pink/30">
                <Lock className="text-brutal-pink" size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Risk Profile</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-3 bg-neon-orange" />
              <div className="flex-1 h-3 bg-brutal-yellow" />
              <div className="flex-1 h-3 bg-[var(--text-primary)]/10" />
            </div>
            <p className="mt-4 font-display text-xl tracking-tighter uppercase italic">Institutional</p>
          </motion.div>

          {/* Profile Bubbles */}
          <motion.div 
            className="absolute bottom-10 right-10 flex -space-x-4 z-40"
            animate={{ y: [0, 10, 0] }}
            transition={{ ...floatTransition, delay: 1 } as any}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-center font-display text-xl shadow-xl backdrop-blur-md">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="w-16 h-16 rounded-full border-4 border-[var(--border-color)] bg-neon-orange flex items-center justify-center text-black shadow-xl">
              <ArrowRight size={24} />
            </div>
          </motion.div>

          {/* Ecosystem Links */}
          <div className="absolute -bottom-10 left-0 flex gap-4">
            <div className="glass-brutalism py-2 px-4 flex items-center gap-2 border-[var(--glass-border)] !shadow-[4px_4px_0px_#FF5F00]">
              <Target size={14} className="text-neon-orange" />
              <span className="text-[10px] font-black uppercase tracking-widest">Lakshya Active</span>
            </div>
            <div className="glass-brutalism py-2 px-4 flex items-center gap-2 border-[var(--glass-border)] !shadow-[4px_4px_0px_#0057FF]">
              <BookOpen size={14} className="text-brutal-blue" />
              <span className="text-[10px] font-black uppercase tracking-widest">Adhyayan Dev</span>
            </div>
          </div>
        </div>
      </main>

      {/* MARQUEE SECTION */}
      <section className="relative z-20 border-y-2 border-[var(--border-color)] bg-[var(--nav-bg)] py-12 overflow-hidden backdrop-blur-sm">
        {/* @ts-ignore */}
        <marquee direction="left" scrollamount="15">
          <div className="flex items-center">
            {PLATFORMS.map((p, idx) => (
              <div key={idx} className="flex items-center gap-6 mx-16 text-[var(--text-primary)] hover:text-neon-orange transition-colors cursor-default group">
                <div className="p-3 border-2 border-[var(--border-color)] rounded-xl group-hover:border-neon-orange transition-colors bg-[var(--bg-primary)]">
                  {p.icon}
                </div>
                <span className="font-display text-4xl md:text-5xl uppercase italic font-black tracking-tighter">{p.name}</span>
              </div>
            ))}
          </div>
        {/* @ts-ignore */}
        </marquee>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 py-16 px-6 md:px-12 border-t border-[var(--border-color)] ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <img src={mainLogo} alt="Pramaaan Logo" className={`h-8 w-auto ${theme === 'dark' ? 'opacity-50' : 'opacity-20'}`} />
             <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">© 2026 Pramaaan Protocol</p>
          </div>
          <div className="flex gap-10">
            <a href="#" className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Whitepaper</a>
            <a href="#" className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Github</a>
            <a href="#" className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Status</a>
          </div>
        </div>
      </footer>

      {/* TURNSTILE OVERLAY */}
      <AnimatePresence>
        {isTurnstileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-[var(--bg-primary)] p-6"
          >
            <div className="max-w-xl w-full glass-brutalism p-12 !shadow-[20px_20px_0px_var(--border-color)]">
              <h1 className="font-display text-2xl mb-2 tracking-tight italic">SECURITY VERIFICATION</h1>
              <p className="text-[var(--text-secondary)] text-sm mb-10 leading-relaxed uppercase font-black">
                Pramaaan Network is verifying your identity signature to prevent malicious traffic.
              </p>
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '3x00000000000000000000FF'}
                options={{ theme: theme === 'dark' ? 'dark' : 'light' }}
                onSuccess={() => {
                  setTimeout(() => {
                    setIsTurnstileOpen(false);
                    navigate('/login');
                  }, 1200);
                }}
              />
              <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col gap-2 opacity-40">
                <p className="text-[9px] font-black uppercase tracking-widest">Ray ID: 9f76272db8a6a7aa</p>
                <p className="text-[9px] font-black uppercase tracking-widest">Performance by Cloudflare</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
