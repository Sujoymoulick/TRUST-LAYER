import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuest } from '../context/GuestContext';
import { Turnstile } from '@marsidev/react-turnstile';
import { Component as RocketLoader } from '../components/ui/rocket-loader';
import mainLogo from '../assets/Trust-layer.png';

export default function Landing() {
  const navigate = useNavigate();
  const { enterGuest } = useGuest();
  const [loading, setLoading] = useState(true);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleGuest = () => { enterGuest(); navigate('/dashboard'); };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTurnstileOpen(true);
  };

  if (loading) {
    return <RocketLoader />;
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Public Sans', sans-serif" }}>

      {/* NAV */}
      <nav className="flex items-center justify-between px-5 md:px-12 py-4 border-b-[3px] border-black bg-white">
        <span className="flex items-center">
          <img src={mainLogo} alt="TrustLayer Logo" className="h-8 w-auto object-contain" />
        </span>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8 font-bold text-sm">
          <a href="#" className="hover:underline">Products</a>
          <a href="#" className="hover:underline">Connect</a>
          <a href="#" className="hover:underline">Analyze</a>
          <Link to="/pricing" className="hover:underline">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" onClick={handleLoginClick} className="hidden sm:block font-bold text-sm underline">Login</Link>
          <Link to="/login" onClick={handleLoginClick} className="brutal-btn text-sm px-4 py-2" style={{ minHeight: 'auto' }}>Sign Up</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto px-5 md:px-12 py-12 md:py-20">
        <div>
          <div className="brutal-badge mb-5" style={{ background: '#FFE600' }}>Now in Beta</div>
          <h1 style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 'clamp(2.4rem, 8vw, 5rem)',
            lineHeight: 0.9, textTransform: 'uppercase',
            letterSpacing: '-0.03em', marginBottom: 24,
          }}>
            Revolutionize<br />Trust With<br />TrustLayer.
          </h1>
          <p className="text-lg font-semibold leading-relaxed mb-8 max-w-md" style={{ color: '#333' }}>
            Secure. Connect. Analyze. Build your global reputation and carry your trust everywhere.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/login" onClick={handleLoginClick} className="brutal-btn text-base px-8 py-4" style={{ background: '#FFE600', boxShadow: '6px 6px 0px #000' }}>
              Get Started Free
            </Link>
            <button onClick={handleGuest} className="brutal-btn text-base px-8 py-4" style={{ background: '#fff' }}>
              👁 Explore as Guest
            </button>
          </div>
        </div>

        {/* Floating Preview Cards — hidden on mobile to reduce clutter */}
        <div className="relative hidden lg:block" style={{ height: 480 }}>
          <div className="brutal-card absolute" style={{ top: 0, right: 20, width: 220, transform: 'rotate(4deg)', boxShadow: '8px 8px 0px #000', zIndex: 3, textAlign: 'center' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8, color: '#666' }}>Your Trust Score</p>
            <div style={{ fontSize: '3.5rem', fontFamily: "'Archivo Black', sans-serif", lineHeight: 1 }}>965</div>
            <div className="progress-track my-3"><div className="progress-fill" style={{ width: '96%' }} /></div>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#00B300', textTransform: 'uppercase' }}>Excellent</span>
          </div>

          <div className="brutal-card absolute" style={{ top: 200, left: 0, width: 190, transform: 'rotate(-5deg)', boxShadow: '8px 8px 0px #000', zIndex: 2 }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>Risk Status</p>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 h-6 border-2 border-black" style={{ background: '#00FF00' }} />
              <div className="flex-1 h-6 border-2 border-black" style={{ background: '#FFE600' }} />
              <div className="flex-1 h-6 border-2 border-black bg-white" />
            </div>
            <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '0.8rem' }}>SAFE</span>
          </div>

          <div className="brutal-card absolute" style={{ bottom: 40, right: 0, width: 240, transform: 'rotate(2deg)', boxShadow: '8px 8px 0px #000', zIndex: 4 }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 10 }}>Connected Profiles</p>
            <div className="flex gap-2">
              {['A','B','C'].map(l => (
                <div key={l} className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center font-black" style={{ background: '#f0f0f0' }}>{l}</div>
              ))}
              <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center font-black" style={{ background: '#0057FF', color: '#fff' }}>+</div>
            </div>
          </div>
        </div>

        {/* Mobile-only simple stats strip */}
        <div className="lg:hidden grid grid-cols-3 gap-4">
          {[{ n: '50K+', l: 'Users' }, { n: '99.9%', l: 'Uptime' }, { n: '12', l: 'Platforms' }].map(s => (
            <div key={s.l} className="brutal-card text-center p-4">
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '1.4rem' }}>{s.n}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER STRIP */}
      <div className="flex flex-wrap items-center justify-center gap-8 px-5 py-5 border-t-[3px] border-black font-black text-sm uppercase tracking-widest" style={{ background: '#FFE600' }}>
        {['Freelancers', 'Enterprises', 'Developers', 'Marketplaces'].map(t => <span key={t}>{t}</span>)}
      </div>

      {/* TURNSTILE FULLSCREEN OVERLAY */}
      {isTurnstileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white font-sans overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto px-6 md:px-12 py-12 w-full mt-[-10vh]">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">www.trustlayer.com</h1>
            <h2 className="text-xl md:text-2xl font-semibold mb-4 tracking-tight">Performing security verification</h2>
            <p className="text-gray-300 text-sm md:text-base mb-8 max-w-3xl leading-relaxed">
              This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.
            </p>
            <div className="mb-8 flex items-center justify-start">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                options={{ theme: 'dark' }}
                onSuccess={() => {
                  setIsTurnstileOpen(false);
                  navigate('/login');
                }}
              />
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto w-full px-6 md:px-12 pb-8">
            <div className="border-t border-[#333] pt-6 flex flex-col items-center text-xs text-gray-400 gap-1">
              <p>Ray ID: <span className="font-mono font-bold">9f76272db8a6a7aa</span></p>
              <p>
                Performance and Security by <a href="https://www.cloudflare.com" target="_blank" rel="noreferrer" className="underline hover:text-white transition-colors">Cloudflare</a> <span className="mx-1">|</span> <a href="#" className="underline hover:text-white transition-colors">Privacy</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
