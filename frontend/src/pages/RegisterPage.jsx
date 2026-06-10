import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Briefcase, CheckCircle2, AlertCircle, LayoutDashboard, 
  LineChart, Calendar, FileText, Globe 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorAlert from '../components/feedback/ErrorAlert.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState(null);
  const [googleAuthError, setGoogleAuthError] = useState(null);

  // Statistics count up animation simulation
  const [stats, setStats] = useState({ companies: 120, metrics: 92 });
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        companies: prev.companies + Math.floor(Math.random() * 2),
        metrics: prev.metrics + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    setGoogleAuthError(null);
    
    // Call registration
    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password
    });

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

  const handleGoogleSignup = (e) => {
    e.preventDefault();
    setGoogleAuthError("Google Sign-up is not enabled for this workspace.");
    setTimeout(() => setGoogleAuthError(null), 4000);
  };

  const benefits = [
    "Never lose track of applications",
    "Stay on top of 24h interview reminders",
    "Organize company contacts & CRM info",
    "Analyze conversion rates & metrics",
    "Replace fragile spreadsheets forever"
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#09090b] text-text font-sans selection:bg-primary/30 overflow-x-hidden">
      
      {/* LEFT SIDE: Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-12 relative overflow-hidden bg-zinc-950 border-r border-border/60">
        {/* Glow panels */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBWMDBNMCA0MEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikpIiBzdHJva2Utd2lkdGg9IjEiLz4KPHBhdGggZD0iTTQwIDQwVjAwTTQwIDBIMCImZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-70 pointer-events-none" />

        {/* Logo Header */}
        <Link to="/" className="flex items-center gap-2.5 z-10 group self-start">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-glass flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Briefcase className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text">Obsidian</span>
        </Link>

        {/* Brand Core info */}
        <div className="my-auto py-8 relative z-10 flex flex-col gap-6">
          <div className="space-y-3 max-w-lg">
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Take Control of Your <br />
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                Job Search Journey.
              </span>
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Track applications, manage interviews, organize resumes, and measure your progress.
            </p>
          </div>

          {/* Benefits Bullet Points */}
          <div className="space-y-3.5 my-3">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ x: -15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex items-center gap-3 text-sm font-medium text-text/90"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Visual Showcase map */}
          <div className="grid grid-cols-2 gap-3 mt-4 max-w-md">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">Kanban Board</span>
                <span className="text-[10px] text-text-muted">Interactive pipelines</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-center gap-3">
              <LineChart className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">Analytics</span>
                <span className="text-[10px] text-text-muted">Metrics & digests</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">Calendar</span>
                <span className="text-[10px] text-text-muted">Interview dates</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-white">Resume Vault</span>
                <span className="text-[10px] text-text-muted">Manage templates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info: stats and trust */}
        <div className="z-10 border-t border-border/50 pt-6 flex justify-between gap-6">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Database Capacity</span>
            <span className="text-sm font-bold text-white">Enterprise Scaled</span>
          </div>
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Obsidian CRM</span>
            <span className="text-sm font-bold text-emerald-400">Zero Spreadsheets Needed</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Signup Form */}
      <div className="col-span-12 lg:col-span-6 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-background/40">
        {/* Glow panel for mobile */}
        <div className="absolute top-[40%] right-[10%] w-[50%] h-[50%] bg-primary/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen lg:hidden" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          
          {/* Logo header for mobile only */}
          <div className="flex flex-col items-center text-center lg:hidden mb-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-glass flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Obsidian</h1>
            <p className="text-text-muted text-sm">Join Obsidian JobTracker today</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-xs text-text-muted">Sign up today and replace spreadsheets forever</p>
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
                  label="Full Name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full py-2.5 text-sm font-medium mt-4 flex justify-center items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-text-muted text-xs">or continue with</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              className="w-full py-2 px-4 rounded-lg border border-border bg-background hover:bg-white/5 text-sm font-medium text-text flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {/* Google SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          <p className="text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline transition">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
      
    </div>
  );
}

export default RegisterPage;
