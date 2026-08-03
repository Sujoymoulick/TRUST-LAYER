import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import TrustScoreCircle from '../components/TrustScoreCircle';
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
  ChevronRight,
  Star
} from 'lucide-react';
import { KineticTypographyLoader } from '../components/ui/loading-animation';
import { CircularTestimonials } from '../components/ui/circular-testimonials';
import { BlackHoleHeroSection } from '../components/ui/blackhole-hero-section';
import { ScrollPathBackground } from '../components/ui/scroll-path-background';
import PhoneMockupBasic from '../components/ui/phone-mockups-1';
import mainLogo from '../assets/crifolayerlogo-removebg.png';

const TESTIMONIALS = [
  {
    quote: "Crifolayer completely changed how I present my professional credibility online. One link, everything verified.",
    name: "Arjun Sharma",
    designation: "Full-Stack Developer",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  },
  {
    quote: "The trust score aggregation from GitHub and LinkedIn is a game-changer for hiring. We integrated their SDK in a day.",
    name: "Priya Menon",
    designation: "Engineering Manager, Groww",
    src: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop",
  },
  {
    quote: "Finally a portable identity layer that works with Web3 wallets. The zero-knowledge proofs are production-ready.",
    name: "Wei Zhang",
    designation: "DeFi Protocol Lead",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
  },
];

const PLATFORMS = [
  { name: 'GitHub', icon: <Shield size={20} /> },
  { name: 'LinkedIn', icon: <User size={20} /> },
  { name: 'Supabase', icon: <DbIcon size={20} /> },
  { name: 'Gemini AI', icon: <Cpu size={20} /> },
  { name: 'Ethereum', icon: <Zap size={20} /> },
  { name: 'Polygon', icon: <ShieldCheck size={20} /> },
  { name: 'Solana', icon: <Globe size={20} /> },
];

const FEATURES = [
  {
    icon: <Cpu size={22} />,
    title: 'Trust Analysis',
    desc: 'Advanced behavioral and risk modeling for true identity metrics.',
    accent: 'from-orange-500/10 to-amber-500/5',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: <DbIcon size={22} />,
    title: 'Supabase Backend',
    desc: 'PostgreSQL storage with enterprise-grade security and real-time sync.',
    accent: 'from-emerald-500/10 to-teal-500/5',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Zero-Knowledge Proofs',
    desc: 'Verify credentials without exposing sensitive personal data.',
    accent: 'from-orange-600/10 to-orange-500/5',
    iconColor: 'text-orange-600 dark:text-orange-300',
  },
  {
    icon: <Globe size={22} />,
    title: 'Web3 Native',
    desc: 'Ethereum, Polygon, and Solana wallet-linked identity verification.',
    accent: 'from-amber-500/10 to-orange-500/5',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];

/** Scroll-to-reveal wrapper using framer-motion */
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** True while the viewport is narrow. */
function useNarrow(query = '(max-width: 767px)') {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const sync = () => setNarrow(m.matches);
    sync();
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, [query]);
  return narrow;
}

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuest } = useGuest();
  const [loading, setLoading] = useState(true);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);
  const narrow = useNarrow();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  // As the user scrolls from 0 to 450px down, fade out and translate upwards:
  const heroOpacity = useTransform(scrollY, [0, 450], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 450], [1, 0.95]);
  const heroY = useTransform(scrollY, [0, 450], [0, -40]);

  // Force dark mode on the landing page, restore on leave
  useEffect(() => {
    const root = window.document.documentElement;
    const prev = root.classList.contains('light') ? 'light' : root.classList.contains('dark') ? 'dark' : null;

    // Use a small timeout to override the parent ThemeProvider's initial theme setting
    const timer = setTimeout(() => {
      root.classList.remove('light', 'dark');
      root.classList.add('dark');
    }, 0);

    // Store original CSS variable values
    const origAccent = root.style.getPropertyValue('--accent');
    const origAccentRgb = root.style.getPropertyValue('--accent-rgb');

    // Override accent to orange for landing page
    root.style.setProperty('--accent', '#f97316'); // orange-500
    root.style.setProperty('--accent-rgb', '249, 115, 22');

    return () => {
      clearTimeout(timer);
      root.classList.remove('dark');
      if (prev) root.classList.add(prev);

      // Restore original values
      if (origAccent) root.style.setProperty('--accent', origAccent);
      else root.style.removeProperty('--accent');
      if (origAccentRgb) root.style.setProperty('--accent-rgb', origAccentRgb);
      else root.style.removeProperty('--accent-rgb');
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setLoading(false); }, 5300);
    return () => clearTimeout(timer);
  }, []);

  // If a user lands here already authenticated (e.g. OAuth callback), send them to the dashboard
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        navigate('/dashboard', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGuest = () => { enterGuest(); navigate('/dashboard'); };
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTurnstileOpen(true);
  };

  if (loading) {
    return <KineticTypographyLoader />;
  }

  return (
    <div className="dark min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-x-hidden">

      {/* ── Subtle ambient gradient ── */}
      <div className="fixed inset-0 pointer-events-none mesh-orange-bg opacity-100" />

      {/* ── NAV ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-[var(--border-color)] backdrop-blur-xl bg-[var(--nav-bg)]">
        <div className="flex items-center gap-3">
          <img
            src={mainLogo}
            alt="Crifolayer Logo"
            className="h-14 w-auto"
          />
          <span className="hidden sm:inline font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">Crifolayer</span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium text-[var(--text-secondary)]">
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Ecosystem</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">API Docs</a>
          <Link to="/pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" onClick={handleLoginClick} className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Login</Link>
          <Link
            to="/login"
            onClick={handleLoginClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 12px rgba(var(--accent-rgb),0.3)' }}
          >
            Get Started <ChevronRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION with BlackHole ── */}
      <section ref={heroRef} className="relative min-h-[92svh] w-full md:min-h-[780px] overflow-hidden">
        <BlackHoleHeroSection
          focus={narrow ? [0.5, 0.76] : [0.72, 0.46]}
          scrim={narrow ? 'top' : 'left'}
          scrimStrength={0.92}
          distance={24}
          elevation={narrow ? -7 : -5.5}
          fov={narrow ? 58 : 42}
          glow={narrow ? 0.85 : 1}
          steps={narrow ? 200 : 300}
          resolution={narrow ? 0.6 : 0.7}
        >
          <div className="flex h-full min-h-[92svh] items-start px-6 pt-16 sm:px-10 md:min-h-[780px] md:items-center md:pt-0 lg:px-20">
            <motion.div 
              style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
              className="max-w-[36rem]"
            >

              {/* Status badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm mb-8"
              >
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full neon-pulse" />
                <span className="text-xs font-medium text-white/70 tracking-wide">Network Active · v1.0</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.6rem] sm:text-6xl lg:text-[4.5rem] font-light leading-[1.05] tracking-[-0.03em] text-white"
              >
                The Portable<br />
                <span className="glitch font-bold" data-text="Crifolayer" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f97316 60%, #ffedd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Crifolayer
                </span><br />
                For The Web.
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22 }}
                className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-white/55"
              >
                Aggregate your professional reputation from GitHub, LinkedIn, and Web3 into one verifiable, portable identity.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link
                  to="/login"
                  onClick={handleLoginClick}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 group"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}
                >
                  Start Building Trust
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <button
                  onClick={handleGuest}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/75 transition-all duration-300 hover:border-white/40 hover:text-white hover:bg-white/5"
                >
                  Try Sandbox
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="mt-10 flex items-center gap-3"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white/20 bg-gradient-to-br from-orange-500 to-white flex items-center justify-center text-[10px] text-orange-950 font-bold" style={{ zIndex: 4 - i }}>
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span><strong className="text-white/70">4.9</strong> · Trusted by 2,000+ developers</span>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </BlackHoleHeroSection>
        {/* Top and bottom gradient fades to blend the dark black hole canvas into the dark theme */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--bg-primary)] to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none z-20" />
      </section>

      {/* ── BACKGROUND PATH ANIMATION ── */}
      <ScrollPathBackground />

      {/* ── PLATFORMS MARQUEE ── */}
      <section className="relative z-20 border-y border-[var(--border-color)] bg-[var(--nav-bg)] py-10 overflow-hidden backdrop-blur-sm">
        <div className="absolute left-0 top-0 h-full w-20 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, var(--bg-primary), transparent)' }} />
        <div className="absolute right-0 top-0 h-full w-20 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, var(--bg-primary), transparent)' }} />
        <div style={{ display: 'flex', animation: 'marquee 30s linear infinite', width: 'max-content' }}>
          {[...PLATFORMS, ...PLATFORMS].map((p, idx) => (
            <div key={idx} className="flex items-center gap-3 mx-10 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-default group">
              <div className="p-2 rounded-lg border border-[var(--border-color)] group-hover:border-orange-300/40 transition-colors bg-[var(--bg-primary)]">
                {p.icon}
              </div>
              <span className="font-display text-2xl md:text-3xl font-bold tracking-tight">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="relative z-20 py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] mb-5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Platform Features</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                Built for the modern web
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] max-w-xl mx-auto text-sm leading-relaxed">
                Every layer of Crifolayer is designed with privacy, security, and developer experience at its core.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <RevealSection key={f.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                  <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${f.accent} mb-5 ${f.iconColor}`}>
                    {f.icon}
                  </div>
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)] mb-2">{f.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SCORE CIRCLE SHOWCASE SECTION ── */}
      <section className="relative z-20 py-24 px-6 md:px-12 bg-orange-500/5 border-y border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <RevealSection>
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] mb-5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Dynamic Scoring</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                Visualize credibility dynamically
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] text-sm leading-relaxed">
                Your reputation is live, portable, and mathematically verified. The dynamic Trust Circle represents the strength of your verified credentials across the digital ecosystem.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={0.15}>
            <div className="flex items-center justify-center p-8 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2rem] shadow-xl backdrop-blur-md">
              <TrustScoreCircle score={842} />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── PORTABLE MOBILE PROFILE SHOWCASE ── */}
      <section className="relative z-20 py-24 px-6 md:px-12 overflow-hidden border-b border-[var(--border-color)] bg-orange-500/5">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-16">
          <RevealSection delay={0.1}>
            <div className="flex items-center justify-center w-full">
              <PhoneMockupBasic />
            </div>
          </RevealSection>
          <RevealSection>
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Mobile-Ready</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                Your credentials, on the go
              </h2>
              <p className="mt-4 text-[var(--text-secondary)] text-sm leading-relaxed">
                Carry your verified professional identity in your pocket. Showcase your credentials dynamically on any mobile device or integrate our SDK for seamless cross-platform verification.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>


      {/* ── TRUST SCORE SHOWCASE ── */}
      <section className="relative z-20 py-24 px-6 md:px-12 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <RevealSection>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] mb-6">
                <ShieldCheck size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Reputation Engine</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                Your trust score,<br />
                <span style={{ color: 'var(--accent)' }}>provably yours</span>
              </h2>
              <p className="mt-5 text-[var(--text-secondary)] text-sm leading-relaxed max-w-md">
                Crifolayer aggregates signals from your entire digital footprint — GitHub commits, LinkedIn endorsements, on-chain activity — and synthesises them into a single, portable trust score.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { label: 'GitHub Activity', pct: 94 },
                  { label: 'LinkedIn Score', pct: 78 },
                  { label: 'Web3 Attestations', pct: 61 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      <span>{item.label}</span>
                      <span style={{ color: 'var(--accent)' }}>{item.pct}%</span>
                    </div>
                    <div className="progress-track">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>

          {/* Floating cards demo */}
          <RevealSection delay={0.2}>
            <div className="relative h-[420px]">
              {/* Trust Score Card */}
              <motion.div
                className="absolute top-8 right-0 w-64 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-xl p-6 z-30 shadow-xl"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex justify-between items-start mb-5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Network Rank</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 neon-pulse" />
                </div>
                <div className="text-center">
                  <h2 className="font-display text-5xl font-bold tracking-tight mb-3" style={{ color: 'var(--accent)' }}>842</h2>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: '84%' }}
                      transition={{ duration: 1.2, delay: 0.5 }}
                    />
                  </div>
                  <span className="inline-block mt-3 text-xs font-semibold" style={{ color: 'var(--accent)' }}>Verified Elite</span>
                </div>
              </motion.div>

              {/* Risk Status Card */}
              <motion.div
                className="absolute top-1/2 left-0 -translate-y-1/2 w-56 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-xl p-5 z-20 shadow-lg"
                animate={{ y: [-8, 6, -8] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-400/20">
                    <Lock className="text-orange-400" size={15} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Risk Profile</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  <div className="flex-1 h-2 rounded-full bg-orange-400" />
                  <div className="flex-1 h-2 rounded-full bg-[var(--border-color)]" />
                </div>
                <p className="mt-4 font-display text-lg font-bold text-[var(--text-primary)] tracking-tight">Institutional</p>
              </motion.div>

              {/* Ecosystem Links */}
              <motion.div
                className="absolute bottom-8 right-8 flex -space-x-3 z-40"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-14 h-14 rounded-full border-2 border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center font-display text-lg font-bold shadow-lg backdrop-blur-md" style={{ zIndex: 3 - i }}>
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', zIndex: 0 }}>
                  <ArrowRight size={20} className="text-white" />
                </div>
              </motion.div>

              {/* Ecosystem Tags */}
              <div className="absolute -bottom-4 left-0 flex gap-3">
                <div className="rounded-full px-3 py-1.5 border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-sm flex items-center gap-2 shadow-sm">
                  <Target size={12} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Lakshya Active</span>
                </div>
                <div className="rounded-full px-3 py-1.5 border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-sm flex items-center gap-2 shadow-sm">
                  <BookOpen size={12} className="text-emerald-400" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Adhyayan Dev</span>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="relative z-20 border-t border-[var(--border-color)] bg-[var(--bg-primary)] py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto w-full space-y-14">
          <RevealSection>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-white/5 mb-5">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Reviews</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
                What people say
              </h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Hear from global developers, critical reviewers, and enterprise integrators.
              </p>
            </div>
          </RevealSection>
          <div className="flex items-center justify-center">
            <div style={{ maxWidth: '1024px', width: '100%' }}>
              <CircularTestimonials
                testimonials={TESTIMONIALS}
                autoplay={true}
                colors={{
                  name: "var(--text-primary)",
                  designation: "var(--text-secondary)",
                  testimony: "var(--text-primary)",
                  arrowBackground: "var(--accent)",
                  arrowForeground: "#ffffff",
                  arrowHoverBackground: "var(--text-primary)",
                }}
                fontSizes={{
                  name: "26px",
                  designation: "16px",
                  quote: "18px",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-14 px-6 md:px-12 border-t border-[var(--border-color)] bg-zinc-950">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={mainLogo} alt="Crifolayer Logo" className="h-10 w-auto opacity-50" />
            <p className="text-xs text-zinc-500 font-medium">© 2026 Crifolayer Protocol</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Whitepaper</a>
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Github</a>
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Status</a>
          </div>
        </div>
      </footer>

      {/* ── TURNSTILE OVERLAY ── */}
      <AnimatePresence>
        {isTurnstileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-center items-center p-6"
            style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-10 shadow-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] mb-6">
                <ShieldCheck size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Security Check</span>
              </div>
              <h1 className="font-display text-2xl font-bold mb-2 tracking-tight text-[var(--text-primary)]">Security Verification</h1>
              <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
                Crifolayer is verifying your identity signature to prevent malicious traffic.
              </p>
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '3x00000000000000000000FF'}
                options={{ theme: 'dark' }}
                onSuccess={() => {
                  setTimeout(() => {
                    setIsTurnstileOpen(false);
                    navigate('/login');
                  }, 1200);
                }}
              />
              <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex flex-col gap-1 opacity-40">
                <p className="text-[9px] font-mono text-[var(--text-secondary)]">Ray ID: 9f76272db8a6a7aa</p>
                <p className="text-[9px] font-mono text-[var(--text-secondary)]">Performance by Cloudflare</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
