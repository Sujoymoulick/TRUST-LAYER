import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { useGuest } from '../context/GuestContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import mainLogo from '../assets/crifolayerlogo-removebg.png';
import { TurnstileWidget } from '../components/TurnstileWidget';

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ size = 20, pupilSize = 8, isBlinking = false, forceLookX, forceLookY }: EyeBallProps) => {
  return (
    <div className="relative flex items-center justify-center bg-white border border-slate-200 dark:border-zinc-800 rounded-full overflow-hidden transition-all duration-150"
      style={{ width: size, height: size, transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)' }}>
      <div className="absolute bg-black rounded-full transition-all duration-200 ease-out"
        style={{ width: pupilSize, height: pupilSize, transform: `translate(${forceLookX !== undefined ? forceLookX : 0}px, ${forceLookY !== undefined ? forceLookY : 0}px)` }} />
    </div>
  );
};

const Pupil = ({ size = 12, forceLookX = 0, forceLookY = 0 }) => (
  <div className="relative flex items-center justify-center bg-white border border-slate-200 dark:border-zinc-800 rounded-full w-8 h-8">
    <div className="bg-black rounded-full transition-all duration-200 ease-out"
      style={{ width: size, height: size, transform: `translate(${forceLookX}px, ${forceLookY}px)` }} />
  </div>
);

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
  </svg>
);

const TwitterIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
  </svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const UpworkIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
  </svg>
);

const FiverrIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.004 15.588a.995.995 0 1 0 .002-1.99.995.995 0 0 0-.002 1.99zm-.996-3.705h-.85c-.546 0-.84.41-.84 1.092v2.466h-1.61v-3.558h-.684c-.547 0-.84.41-.84 1.092v2.466h-1.61v-4.874h1.61v.74c.264-.574.626-.74 1.163-.74h1.972v.74c.264-.574.625-.74 1.162-.74h.527v1.316zm-6.786 1.501h-3.359c.088.546.43.858 1.006.858.43 0 .732-.175.83-.487l1.425.4c-.351.848-1.22 1.364-2.255 1.364-1.748 0-2.549-1.355-2.549-2.515 0-1.14.703-2.505 2.45-2.505 1.856 0 2.471 1.384 2.471 2.408 0 .224-.01.37-.02.477zm-1.562-.945c-.04-.42-.342-.81-.889-.81-.508 0-.81.225-.908.81h1.797zM7.508 15.44h1.416l1.767-4.874h-1.62l-.86 2.837-.878-2.837H5.72l1.787 4.874zm-6.6 0H2.51v-3.558h1.524v3.558h1.591v-4.874H2.51v-.302c0-.332.235-.536.606-.536h.918V8.412H2.85c-1.162 0-1.943.712-1.943 1.755v.4H0v1.316h.908v3.558z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { enterGuest, exitGuest } = useGuest();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const scheduleBlink = (setter: (v: boolean) => void) => {
      const timeout = setTimeout(() => {
        setter(true);
        setTimeout(() => { setter(false); scheduleBlink(setter); }, 150);
      }, Math.random() * 4000 + 3000);
      return timeout;
    };
    const t1 = scheduleBlink(setIsPurpleBlinking);
    const t2 = scheduleBlink(setIsBlackBlinking);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const interval = setInterval(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearInterval(interval);
    }
  }, [password, showPassword]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
    };
  };

  // Navigate once Supabase confirms the session — handles both email and OAuth flows
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === 'SIGNED_IN') {
        exitGuest();
        navigate('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, exitGuest]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // navigation is handled by onAuthStateChange above
      } else {
        if (!turnstileToken) {
          throw new Error("Please complete the security verification.");
        }

        // Verify token via edge function
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-turnstile', {
          body: { token: turnstileToken },
        });

        if (verifyError || !verifyData?.success) {
          setTurnstileToken(null); // Force re-verification
          throw new Error("Security check failed. Please try again.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { redirectTo: `${window.location.origin}/dashboard` }
        });
        if (error) throw error;
        setError("Check your email for the confirmation link!");
        setIsLoading(false);
        return;
      }
      // navigation handled by onAuthStateChange
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };



  const handleGuestLogin = () => {
    enterGuest();
    navigate('/dashboard');
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-body overflow-hidden">
      {/* Left Content Section */}
      <div className="relative hidden lg:flex flex-col justify-between bg-brutal-navy p-12 text-white">
        <div className="relative z-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={mainLogo} alt="Crifolayer Logo" className="h-14 w-auto object-contain" />
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            {/* Purple Character */}
            <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: '70px', width: '180px', height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px', backgroundColor: '#6C3FF5', borderRadius: '10px 10px 0 0', zIndex: 1, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` : `skewX(${purplePos.faceX/5}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{ left: (password.length > 0 && showPassword) ? `20px` : isLookingAtEachOther ? `55px` : `${45 + purplePos.faceX}px`, top: (password.length > 0 && showPassword) ? `35px` : isLookingAtEachOther ? `65px` : `${40 + purplePos.faceY}px` }}>
                <EyeBall size={18} pupilSize={7} isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined} forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* Black Character */}
            <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: '240px', width: '120px', height: '310px', backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : isLookingAtEachOther ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` : `skewX(${blackPos.faceX/5}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{ left: (password.length > 0 && showPassword) ? `10px` : isLookingAtEachOther ? `32px` : `${26 + blackPos.faceX}px`, top: (password.length > 0 && showPassword) ? `28px` : isLookingAtEachOther ? `12px` : `${32 + blackPos.faceY}px` }}>
                <EyeBall size={16} pupilSize={6} isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* Orange Character */}
            <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: '0px', width: '240px', height: '200px', zIndex: 3, backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0', transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.faceX/5}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-8 transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `50px` : `${82 + (orangePos.faceX || 0)}px`, top: (password.length > 0 && showPassword) ? `85px` : `${90 + (orangePos.faceY || 0)}px` }}>
                <Pupil size={12} forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow Character */}
            <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{ left: '310px', width: '140px', height: '230px', backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4, transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.faceX/5}deg)`, transformOrigin: 'bottom center' }}>
              <div className="absolute flex gap-6 transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `20px` : `${52 + (yellowPos.faceX || 0)}px`, top: (password.length > 0 && showPassword) ? `35px` : `${40 + (yellowPos.faceY || 0)}px` }}>
                <Pupil size={12} forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              <div className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out" style={{ left: (password.length > 0 && showPassword) ? `10px` : `${40 + (yellowPos.faceX || 0)}px`, top: (password.length > 0 && showPassword) ? `88px` : `${88 + (yellowPos.faceY || 0)}px` }} />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-white/50 font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="flex items-center justify-center p-8 bg-white border-t-4 lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800">
        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-4xl mb-2">
                  {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                  {isLogin ? "Verify your identity on the Crifolayer" : "Start your journey with Crifolayer"}
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border border-slate-200 dark:border-zinc-800 p-3 mb-6 font-bold text-xs uppercase text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-xs uppercase">Email</Label>
                  <Input id="email" type="email" placeholder="anna@gmail.com" value={email} autoComplete="off" onChange={(e) => setEmail(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} required className="brutal-input" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold text-xs uppercase">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} required className="brutal-input pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black transition-colors" >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" className="border border-slate-200 dark:border-zinc-800 data-[state=checked]:bg-brutal-pink" />
                      <Label htmlFor="remember" className="text-sm font-bold cursor-pointer" > Remember for 30 days </Label>
                    </div>
                    <a href="#" className="text-sm font-bold underline" > Forgot password? </a>
                  </div>
                )}

                {!isLogin && (
                  <TurnstileWidget 
                    onVerify={(token) => setTurnstileToken(token)}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                  />
                )}

                <Button type="submit" className="brutal-btn w-full h-14 bg-brutal-blue text-white text-lg group" disabled={isLoading || (!isLogin && !turnstileToken)} >
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                    <>
                      {isLogin ? "SIGN IN" : "SIGN UP"}
                      <Sparkles className="ml-2 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-4">
                  <div className="h-0.5 flex-1 bg-black opacity-10" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or Continue With</span>
                  <div className="h-0.5 flex-1 bg-black opacity-10" />
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="brutal-btn bg-white text-black w-full gap-3" type="button" onClick={() => handleSocialLogin('google')} >
                    <GoogleIcon /> Google
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="brutal-btn bg-black text-white w-full gap-3" type="button" onClick={() => handleSocialLogin('github')} >
                      <GithubIcon /> GitHub
                    </Button>
                    <Button variant="outline" className="brutal-btn bg-[#0077b5] text-white w-full gap-3" type="button" onClick={() => handleSocialLogin('linkedin_oidc')} >
                      <LinkedinIcon /> LinkedIn
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="brutal-btn bg-[#1da1f2] text-white w-full gap-3" type="button" onClick={() => handleSocialLogin('twitter')} >
                      <TwitterIcon /> Twitter
                    </Button>
                    <Button variant="outline" className="brutal-btn bg-[#1877f2] text-white w-full gap-3" type="button" onClick={() => handleSocialLogin('facebook')} >
                      <FacebookIcon /> Facebook
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="brutal-btn bg-[#008323] text-white w-full gap-3" type="button" onClick={handleGuestLogin} >
                      <UpworkIcon /> Upwork
                    </Button>
                    <Button variant="outline" className="brutal-btn bg-[#1dbf73] text-white w-full gap-3" type="button" onClick={handleGuestLogin} >
                      <FiverrIcon /> Fiverr
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-zinc-800 border-dashed flex flex-col gap-4">
            <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest hover:bg-gray-100" onClick={() => setIsLogin(!isLogin)} >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign In"}
            </Button>
            <button className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors" onClick={handleGuestLogin} >
              Continue as Guest (Read Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
