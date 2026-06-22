import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Mail, Lock, ArrowRight, AlertCircle, 
  CheckCircle2, LayoutDashboard, LineChart, Star, 
  Calendar, Check, User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const [googleAuthError, setGoogleAuthError] = useState(null);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);


  // Product showcase stage loop (Applied -> Assessment -> Interview -> Offer)
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    setGoogleAuthError(null);
    const result = await login(data);

    if (result.success) {
      navigate('/dashboard');
    } else {
      const errorData = result.error;
      if (errorData.message) {
        setError(errorData.message);
      }
      if (errorData.errors) {
        Object.keys(errorData.errors).forEach((field) => {
          setFormError(field, {
            type: 'server',
            message: errorData.errors[field],
          });
        });
      }
    }
  };

  const handleGoogleLogin = () => {
    const rememberMe = document.getElementById('remember-me')?.checked;
    sessionStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    window.location.href = `${apiBaseUrl}/api/auth/google`;
  };

  return (
    <div className="dark min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#09090b] text-text font-sans selection:bg-primary/30 overflow-x-hidden">
      
      {/* LEFT SIDE: Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-zinc-950 border-r border-border/60">
        {/* Glow panels */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBWMDBNMCA0MEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikpIiBzdHJva2Utd2lkdGg9IjEiLz4KPHBhdGggZD0iTTQwIDQwVjAwTTQwIDBIMCImZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-70 pointer-events-none" />

        {/* Logo Header */}
        <Link to="/" className="flex items-center gap-2.5 z-10 group self-start">
          <div className="w-9.5 h-9.5 rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-glass flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text">
            Snap<span className="text-indigo-400">Job</span>
          </span>
        </Link>

        {/* Product Showcase */}
        <div className="my-auto py-6 relative z-10 flex flex-col gap-8">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Track every application. <br />
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                Land your next opportunity.
              </span>
            </h2>
            <p className="text-zinc-300 text-sm xl:text-base max-w-lg leading-relaxed">
              Replace fragile spreadsheets with an automated pipeline, interview schedules, linked resumes, and interactive workflows.
            </p>
          </div>

          {/* Interactive Simulation Dashboard Mockup */}
          <div className="bg-[#121214]/60 border border-white/5 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative w-full max-w-2xl overflow-hidden">
            {/* Visual Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.04]">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live Tracker Pipeline
              </span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'Applied', bg: 'border-zinc-500/10' },
                { name: 'Assessment', bg: 'border-indigo-500/10' },
                { name: 'Interview', bg: 'border-amber-500/10' },
                { name: 'Offer', bg: 'border-emerald-500/10' }
              ].map((col, idx) => (
                <div key={idx} className="flex flex-col gap-3 min-h-[140px] relative">
                  <div className="text-[10px] xl:text-xs font-bold text-zinc-500 uppercase tracking-widest text-center truncate">
                    {col.name}
                  </div>
                  <div className={`flex-1 rounded-xl border border-dashed ${col.bg} p-2 bg-zinc-950/20 flex flex-col items-center justify-start relative overflow-hidden`}>
                    
                    {/* Simulated Job Card */}
                    {activeStage === idx && (
                      <motion.div
                        layoutId="mock-job-card"
                        className="w-full bg-[#1c1c20] border border-white/10 rounded-lg p-3 shadow-lg flex flex-col gap-2 relative z-10 cursor-default"
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center font-bold text-[9px] text-white">S</div>
                          <span className="text-[9px] font-bold text-white truncate">Stripe</span>
                        </div>
                        <h4 className="text-[10px] font-bold text-zinc-300 truncate leading-snug">Senior Frontend</h4>
                        
                        {/* Dynamic Status Badges */}
                        {activeStage === 0 && <span className="text-[8px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 self-start">Applied</span>}
                        {activeStage === 1 && <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 self-start">Assessment</span>}
                        {activeStage === 2 && <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 self-start">Interview</span>}
                        {activeStage === 3 && (
                          <motion.span 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 self-start"
                          >
                            $145k + Equity
                          </motion.span>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notification alert cards pop-ups */}
            <AnimatePresence mode="wait">
              {activeStage === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  className="absolute bottom-4 left-6 right-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 shadow-xl backdrop-blur-md"
                >
                  <Calendar className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-white leading-normal">System Design Interview Scheduled</p>
                    <p className="text-[8px] text-zinc-400">Stripe • Today at 3:00 PM</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                </motion.div>
              )}
              {activeStage === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  className="absolute bottom-4 left-6 right-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 shadow-xl backdrop-blur-md"
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-white leading-normal">Offer Letter Generated! 🍾</p>
                    <p className="text-[8px] text-zinc-400">Stripe • $145,000 Base Salary + Equity</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-400 animate-bounce">+$145k</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Success Journey timeline nodes */}
          <div className="flex items-center justify-between max-w-xl mx-auto w-full px-6 py-2">
            {[
              { label: 'Applied', active: activeStage >= 0 },
              { label: 'Assessment', active: activeStage >= 1 },
              { label: 'Interview', active: activeStage >= 2 },
              { label: 'Offer', active: activeStage >= 3 }
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-300 ${node.active ? 'border-primary bg-primary shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'border-zinc-800 bg-zinc-950'}`}>
                  {node.active && <Check className="w-2 h-2 text-white" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline transition-colors duration-300 ${node.active ? 'text-zinc-300' : 'text-zinc-650'}`}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info: Social Proof & Testimonial */}
        <div className="z-10 border-t border-border/50 pt-6 space-y-6">
          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-3.5 backdrop-blur-sm">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs xl:text-sm italic text-zinc-400 leading-relaxed">
                "Finally stopped using spreadsheets to manage my job search. Snap Job kept me organized, sent automated follow-up reminders, and helped me land my Software Engineer role."
              </p>
              <span className="block text-[10px] font-bold text-zinc-300 uppercase tracking-widest mt-2">— Software Engineer</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex justify-between gap-6 text-center max-w-xl">
            <div className="flex-1">
              <span className="block text-lg xl:text-xl font-extrabold text-white">
                {activeStage >= 1 ? '8,247' : '8,246'}+
              </span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Applications Tracked</span>
            </div>
            <div className="flex-1 border-x border-white/[0.04]">
              <span className="block text-lg xl:text-xl font-extrabold text-primary">
                {activeStage >= 2 ? '1,985' : '1,984'}+
              </span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Interviews Managed</span>
            </div>
            <div className="flex-1">
              <motion.span 
                animate={activeStage === 3 ? { scale: [1, 1.1, 1] } : {}}
                className="block text-lg xl:text-xl font-extrabold text-emerald-400"
              >
                {activeStage === 3 ? '647' : '646'}+
              </motion.span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Offers Received</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="col-span-12 lg:col-span-5 flex flex-col justify-center items-center p-4 sm:p-12 xl:p-16 relative bg-background/40">
        {/* Glow panel for mobile */}
        <div className="absolute top-[40%] right-[10%] w-[50%] h-[50%] bg-primary/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen lg:hidden" />

        <div className="w-full max-w-[460px] space-y-7 relative z-10">
          
          {/* Logo header for mobile only */}
          <div className="flex flex-col items-center text-center lg:hidden mb-6 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-glass flex items-center justify-center">
              <Briefcase className="w-5.5 h-5.5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-1.5">
              Snap<span className="text-indigo-400">Job</span>
            </h1>
            <p className="text-zinc-200 text-sm font-semibold">Sign in to track your applications</p>
          </div>

          <div className="bg-[#121214]/65 border border-white/10 backdrop-blur-2xl p-5 sm:p-10 rounded-2xl sm:rounded-[2rem] shadow-2xl space-y-7 relative overflow-hidden">
            {/* Glow accent inside the card */}
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-primary/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="text-center space-y-1.5 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
              <p className="text-sm text-zinc-300 font-semibold">Enter your email and password to log in</p>
            </div>

            {error && <ErrorAlert message={error} />}
            {googleAuthError && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{googleAuthError}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-zinc-200">Password</label>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset link is disabled for this workspace."); }} className="text-xs text-primary hover:text-indigo-400 hover:underline font-semibold transition-colors">
                      Forgot Password?
                    </a>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full h-11 bg-zinc-950/40 border ${errors.password?.message ? 'border-rose-500' : 'border-white/10 hover:border-white/20'} rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all`}
                    {...register('password')}
                  />
                  {errors.password?.message && (
                    <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  className="rounded bg-zinc-950 border-white/10 text-primary focus:ring-primary/50 w-4 h-4 cursor-pointer"
                  {...register('rememberMe')}
                />
                <label htmlFor="remember-me" className="text-xs sm:text-sm text-zinc-300 font-semibold select-none cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl text-sm font-bold mt-2 flex justify-center items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-zinc-400 font-semibold text-xs uppercase tracking-wider">or continue with</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 text-base font-bold text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {/* Google SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          <p className="text-center text-sm text-zinc-300 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-extrabold text-indigo-400 hover:text-indigo-300 hover:underline transition">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
      
    </div>
  );
}

export default LoginPage;
