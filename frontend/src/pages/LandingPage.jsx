import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ChevronRight, Briefcase, Calendar, Building2, 
  LineChart, FileText, CheckCircle2, XCircle, Search,
  AlertCircle, LayoutDashboard, ArrowRight, Table,
  Target, Zap, Activity, Clock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// --- Shared Animation Variants ---
const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.15 }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }
};

// --- Shared Components ---
const SectionBadge = ({ text, color = "primary" }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-${color}/10 border border-${color}/20 text-sm font-bold text-${color} uppercase tracking-wider mb-6`}>
    <div className={`w-1.5 h-1.5 rounded-full bg-${color} animate-pulse`} />
    {text}
  </span>
);

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeShowcase, setActiveShowcase] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showcaseTabs = [
    { id: 0, title: "Kanban Pipeline", icon: LayoutDashboard },
    { id: 1, title: "Analytics Engine", icon: LineChart },
    { id: 2, title: "Resume Vault", icon: FileText },
    { id: 3, title: "Company CRM", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background text-text selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* --- Header --- */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border py-4 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 z-50 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 shadow-glass flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text">Obsidian</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated hover:bg-surface border border-border text-sm font-medium text-text transition-all hover:scale-105 active:scale-95">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-text-muted hover:text-text transition-colors">Log in</Link>
                <Link to="/register" className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Start Free <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden z-50 p-2 text-text-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-2xl md:hidden overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="w-full py-3 rounded-xl bg-primary text-center font-medium text-white">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="w-full py-3 rounded-xl border border-border text-center font-medium text-text">Log in</Link>
                    <Link to="/register" className="w-full py-3 rounded-xl bg-primary text-center font-medium text-white">Start Free</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* --- 1. Hero Section --- */}
        <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
          {/* Dynamic Background */}
          <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBWMDBNMCA0MEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNNDAgNDBWMDBNNDAgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <SectionBadge text="Job Search OS v2.0" color="primary" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-text leading-[1.05] mb-8"
              >
                Turn Your Job Search Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">Trackable Pipeline.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                Stop losing track of applications in messy spreadsheets. Organize interviews, store resumes, and visualize your progress with a CRM built for serious job seekers.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover shadow-[0_0_30px_rgba(79,70,229,0.4)] text-white font-bold text-lg transition-all hover:-translate-y-1">
                  Start Tracking Free <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#showcase" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-surface-elevated hover:bg-surface-elevated hover:bg-surface border border-border text-text font-bold text-lg transition-all backdrop-blur-sm">
                  View Demo
                </a>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.8 }}
                className="mt-6 text-sm text-text-muted font-medium"
              >
                Join 10,000+ students and engineers landing offers.
              </motion.p>
            </div>

            {/* Dashboard Hero Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 1, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mt-20 relative max-w-6xl mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-20 h-[120%] -bottom-10" />
              <div className="relative rounded-2xl md:rounded-[2rem] border border-border bg-background/80 backdrop-blur-2xl p-2 md:p-4 shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                {/* Mock UI Structure */}
                <div className="rounded-xl md:rounded-2xl overflow-hidden border border-border bg-surface flex h-[400px] md:h-[600px]">
                  {/* Sidebar Mock */}
                  <div className="w-16 md:w-64 border-r border-border p-4 hidden sm:flex flex-col gap-4">
                    <div className="h-8 w-8 md:w-32 bg-surface-elevated hover:bg-surface rounded-lg mb-4" />
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-8 rounded-lg ${i===1 ? 'bg-primary/20' : 'bg-surface-elevated'}`} />)}
                  </div>
                  {/* Content Mock */}
                  <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <div className="h-8 w-48 bg-surface-elevated hover:bg-surface rounded-lg" />
                      <div className="h-10 w-32 bg-primary/20 rounded-lg hidden md:block" />
                    </div>
                    {/* KPI Mock */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-elevated rounded-xl border border-border" />)}
                    </div>
                    {/* Chart Mock */}
                    <div className="flex-1 bg-surface-elevated rounded-xl border border-border relative overflow-hidden">
                      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-primary/20 to-transparent" />
                      <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L0,80 Q25,90 50,60 T100,40 L100,100 Z" fill="rgba(79,70,229,0.2)" />
                        <path d="M0,80 Q25,90 50,60 T100,40" fill="none" stroke="#4f46e5" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- 2. Problem Section --- */}
        <section id="problems" className="py-32 relative border-t border-border">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div {...fadeIn} className="text-center mb-20 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-text">Job searching shouldn't feel chaotic.</h2>
              <p className="text-xl text-text-muted">You're competing against hundreds of candidates. Using scattered notes and broken spreadsheets is setting yourself up for failure.</p>
            </motion.div>

            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Table, title: "Spreadsheet Hell", desc: "You applied to 100 jobs, but forgot which resume you used and when you're supposed to follow up." },
                { icon: Clock, title: "Missed Interviews", desc: "You lost the recruiter's email in your inbox and completely missed the technical screen." },
                { icon: Activity, title: "Zero Visibility", desc: "You have no idea if your new resume is actually improving your interview conversion rate." }
              ].map((prob, i) => (
                <motion.div key={i} variants={staggerItem} className="bg-surface border border-border rounded-3xl p-8 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <prob.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-text mb-4">{prob.title}</h3>
                  <p className="text-text-muted leading-relaxed text-lg">{prob.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* --- 3. Problem -> Solution Side-by-Side --- */}
        <section className="py-32 bg-white/[0.02] border-y border-border relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2 bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div {...fadeIn} className="mb-20">
              <SectionBadge text="The Antidote" color="emerald-500" />
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-6">Replace chaos with absolute control.</h2>
            </motion.div>

            <div className="space-y-12">
              {[
                { prob: "Scattered data across tabs", sol: "One centralized Kanban board for all applications." },
                { prob: "Forgetting which resume you sent", sol: "Resume Vault linking specific files to specific jobs." },
                { prob: "Missing crucial follow-ups", sol: "Automated reminders and integrated interview calendars." },
                { prob: "Guessing what's working", sol: "Real-time analytics engine calculating your conversion rates." }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} 
                  whileInView={{ opacity: 1, x: 0 }} 
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col md:flex-row items-center gap-6 md:gap-12 p-6 md:p-8 rounded-3xl bg-surface border border-border"
                >
                  <div className="flex-1 flex items-start gap-4 opacity-60">
                    <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                    <p className="text-xl font-medium line-through decoration-rose-500/50">{item.prob}</p>
                  </div>
                  <div className="hidden md:block w-px h-16 bg-surface-elevated hover:bg-surface" />
                  <div className="flex-1 flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-2xl font-bold text-text">{item.sol}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 4. Interactive Product Showcase --- */}
        <section id="showcase" className="py-32 relative">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-6">Designed for velocity.</h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto">A premium workspace that actually makes you want to apply for jobs.</p>
            </motion.div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Tab Nav */}
              <div className="lg:col-span-4 space-y-2">
                {showcaseTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveShowcase(tab.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all ${activeShowcase === tab.id ? 'bg-surface-elevated hover:bg-surface border border-border shadow-lg scale-105 z-10 relative' : 'bg-transparent border border-transparent hover:bg-surface-elevated text-text-muted hover:text-text'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeShowcase === tab.id ? 'bg-primary text-text shadow-glow' : 'bg-surface border border-border'}`}>
                      <tab.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg">{tab.title}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content Window */}
              <div className="lg:col-span-8">
                <div className="rounded-3xl border border-border bg-surface shadow-2xl h-[500px] overflow-hidden relative">
                  <div className="h-12 border-b border-border flex items-center px-4 gap-2 bg-surface-elevated">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  
                  <div className="p-8 h-full relative bg-background">
                    <AnimatePresence mode="wait">
                      {activeShowcase === 0 && (
                        <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex gap-4">
                          {['Applied', 'Screening', 'Interview'].map((col, i) => (
                            <div key={col} className="flex-1 bg-surface-elevated rounded-xl border border-border p-4 flex flex-col gap-3">
                              <span className="text-sm font-bold text-text-muted">{col}</span>
                              {[1, 2, 3].map(card => (
                                <div key={card} className={`h-24 bg-surface border border-border rounded-lg p-3 ${i===0 && card===1 ? 'border-primary shadow-[0_0_15px_rgba(79,70,229,0.2)]' : ''}`}>
                                  <div className="h-3 w-16 bg-surface-elevated hover:bg-surface rounded mb-2" />
                                  <div className="h-4 w-24 bg-white/20 rounded mb-4" />
                                  <div className="flex justify-between">
                                    <div className="h-6 w-16 bg-primary/20 rounded-full" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeShowcase === 1 && (
                        <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col gap-6">
                          <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface border border-border rounded-xl" />)}
                          </div>
                          <div className="flex-1 bg-surface border border-border rounded-xl relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                            <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                              <path d="M0,100 L0,70 Q25,80 50,40 T100,20 L100,100 Z" fill="rgba(16,185,129,0.2)" />
                              <path d="M0,70 Q25,80 50,40 T100,20" fill="none" stroke="#10b981" strokeWidth="2" />
                            </svg>
                          </div>
                        </motion.div>
                      )}

                      {activeShowcase === 2 && (
                        <motion.div key="resumes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full grid grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-surface border border-border rounded-xl p-5 flex items-start gap-4">
                              <div className="w-12 h-16 bg-blue-500/20 rounded shrink-0 border border-blue-500/30" />
                              <div className="space-y-2 w-full">
                                <div className="h-4 w-3/4 bg-white/20 rounded" />
                                <div className="h-3 w-1/2 bg-surface-elevated hover:bg-surface rounded" />
                                <div className="h-6 w-16 bg-surface-elevated rounded mt-4" />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {activeShowcase === 3 && (
                        <motion.div key="crm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                          <div className="bg-surface border border-border rounded-xl h-full p-1 divide-y divide-white/5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-surface-elevated hover:bg-surface rounded-lg" />
                                  <div>
                                    <div className="h-4 w-32 bg-white/20 rounded mb-2" />
                                    <div className="h-3 w-20 bg-surface-elevated hover:bg-surface rounded" />
                                  </div>
                                </div>
                                <div className="h-8 w-24 bg-surface-elevated rounded-lg" />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 5. Why Not Excel? (Comparison) --- */}
        <section id="compare" className="py-32 bg-white/[0.02] border-y border-border">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-6">Excel is for accountants.</h2>
              <p className="text-xl text-text-muted">See why top engineers switch to Obsidian CRM.</p>
            </motion.div>

            <motion.div {...fadeIn} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-3 border-b border-border bg-surface-elevated">
                <div className="p-6"></div>
                <div className="p-6 text-center border-l border-border">
                  <span className="text-lg font-bold text-text-muted">Spreadsheets</span>
                </div>
                <div className="p-6 text-center border-l border-border bg-primary/10">
                  <span className="text-xl font-bold text-text flex items-center justify-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" /> Obsidian CRM
                  </span>
                </div>
              </div>
              
              {[
                { feature: "Visual Pipeline Management", xl: false, crm: true },
                { feature: "Automated Conversion Analytics", xl: false, crm: true },
                { feature: "Integrated Resume Vault", xl: false, crm: true },
                { feature: "Interview Calendar Sync", xl: false, crm: true },
                { feature: "Data Entry", xl: "Manual & Tedious", crm: "Fast & Validated" },
                { feature: "Motivation Level", xl: "Depressing", crm: "Gamified" }
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-3 border-b border-border ${i%2===0 ? 'bg-background' : 'bg-[#0c0c0e]'}`}>
                  <div className="p-5 md:p-6 text-sm md:text-base font-medium text-text flex items-center">{row.feature}</div>
                  <div className="p-5 md:p-6 text-center border-l border-border flex items-center justify-center text-text-muted">
                    {typeof row.xl === 'boolean' ? (row.xl ? <CheckCircle2 className="w-5 h-5 mx-auto text-text-muted" /> : <XCircle className="w-5 h-5 mx-auto opacity-30" />) : row.xl}
                  </div>
                  <div className="p-5 md:p-6 text-center border-l border-primary/20 bg-primary/[0.02] flex items-center justify-center font-bold text-text">
                    {typeof row.crm === 'boolean' ? (row.crm ? <CheckCircle2 className="w-6 h-6 mx-auto text-primary" /> : <XCircle className="w-6 h-6 mx-auto text-rose-500" />) : <span className="text-primary">{row.crm}</span>}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* --- 6. Analytics Section --- */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute left-[-10%] top-1/2 -translate-y-1/2 w-[40%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div {...fadeIn}>
                <SectionBadge text="Deep Insights" color="blue-500" />
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-6 leading-tight">Stop guessing.<br/>Start measuring.</h2>
                <p className="text-xl text-text-muted mb-8">
                  Are you failing at the resume screen or the technical interview? Obsidian's built-in analytics engine automatically calculates your funnel metrics so you know exactly what to fix.
                </p>
                <ul className="space-y-4 mb-10">
                  {['Application to Interview Rate', 'Interview to Offer Rate', 'Average Days to Response', 'Rejection Trends'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg text-text font-medium">
                      <Target className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              {/* Fake Analytics Chart */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-2xl"
              >
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <p className="text-text-muted font-medium mb-1">Interview Conversion</p>
                    <h3 className="text-4xl font-bold text-text">24.5%</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-full text-sm">+5.2% this week</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{name: 'Applied', v: 100}, {name: 'Screening', v: 45}, {name: 'Interview', v: 24}, {name: 'Offer', v: 4}]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                      <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                        <Cell fill="#3b82f6" />
                        <Cell fill="#6366f1" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- 7. How It Works (Visual Timeline) --- */}
        <section className="py-32 bg-white/[0.02] border-y border-border">
          <div className="container mx-auto px-6 max-w-5xl text-center">
            <motion.div {...fadeIn}>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-20">The Workflow.</h2>
            </motion.div>

            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-surface-elevated -translate-y-1/2" />
              <div className="hidden md:block absolute top-1/2 left-0 w-1/2 h-1 bg-gradient-to-r from-primary to-emerald-500 -translate-y-1/2 z-0" />

              <div className="grid md:grid-cols-4 gap-12 md:gap-6 relative z-10">
                {[
                  { step: "01", title: "Add Job", desc: "Log details & URLs." },
                  { step: "02", title: "Track Status", desc: "Drag across Kanban." },
                  { step: "03", title: "Prepare", desc: "Set reminders & notes." },
                  { step: "04", title: "Get Hired", desc: "Accept the best offer." }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mb-6 ${i < 2 ? 'bg-primary text-text shadow-glow' : 'bg-surface border border-border text-text'}`}>
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">{item.title}</h3>
                    <p className="text-text-muted">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- 8. Benefits (Outcomes) --- */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-6xl text-center">
            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Never Forget", desc: "Stop waking up in a panic wondering if you emailed that recruiter back.", icon: Zap, color: "text-amber-500" },
                { title: "Stay Interview Ready", desc: "Always have the exact resume version and notes you used for the specific application.", icon: Target, color: "text-rose-500" },
                { title: "Know What Works", desc: "Data doesn't lie. See exactly which roles and companies yield the highest response rates.", icon: Activity, color: "text-emerald-500" }
              ].map((ben, i) => (
                <motion.div key={i} variants={staggerItem} className="p-10 rounded-[2rem] bg-surface border border-border">
                  <ben.icon className={`w-10 h-10 mx-auto mb-6 ${ben.color}`} />
                  <h3 className="text-2xl font-bold text-text mb-4">{ben.title}</h3>
                  <p className="text-lg text-text-muted">{ben.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* --- 9. Social Proof --- */}
        <section className="py-32 bg-white/[0.02] border-y border-border">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div {...fadeIn} className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-6">Built for those who execute.</h2>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Sarah C.", role: "New Grad SWE @ Google", quote: "I applied to 140 places. Without Obsidian, I would have dropped the ball on half my interviews. The Kanban board is a lifesaver.", img: "S" },
                { name: "Marcus J.", role: "Product Manager", quote: "The analytics showed me I was failing at the HR screen. I adjusted my pitch, and my offer rate skyrocketed next month.", img: "M" },
                { name: "Elena R.", role: "UX Design Intern", quote: "Being able to attach specific resume versions to specific applications solved my biggest headache. Highly recommend.", img: "E" }
              ].map((test, i) => (
                <motion.div key={i} {...fadeIn} className="p-8 rounded-3xl bg-background border border-border hover:border-primary/50 transition-colors relative flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-6">
                      {[1,2,3,4,5].map(s => <svg key={s} className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                    </div>
                    <p className="text-lg text-text leading-relaxed mb-8">"{test.quote}"</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-border pt-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/50 to-emerald-500/50 flex items-center justify-center text-text font-bold text-lg">
                      {test.img}
                    </div>
                    <div>
                      <p className="font-bold text-text">{test.name}</p>
                      <p className="text-sm text-primary font-medium">{test.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 10. FAQ Redesign --- */}
        <section id="faq" className="py-32">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-12 gap-16">
              <div className="md:col-span-5">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-6">Questions? <br/>We've got answers.</h2>
                <p className="text-xl text-text-muted mb-10">Everything you need to know about the product and billing.</p>
                
                <div className="p-8 rounded-3xl bg-primary/10 border border-primary/20">
                  <h3 className="text-xl font-bold text-text mb-2">Still have questions?</h3>
                  <p className="text-text-muted mb-6">Can't find the answer you're looking for? Please chat to our friendly team.</p>
                  <button className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                    Get in touch
                  </button>
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                {[
                  { q: "Is it actually free?", a: "Yes. Core tracking is 100% free forever. Job hunting is stressful enough without paying for software." },
                  { q: "Can I store my resumes here?", a: "Absolutely. The Resume Vault lets you upload PDFs and link specific versions to the exact applications you used them for." },
                  { q: "What about my data?", a: "Your data is yours. Export everything to CSV with one click from the settings page. We use industry-standard encryption." },
                  { q: "Does it sync with my calendar?", a: "Currently we provide an internal calendar and reminders. Native Google Calendar sync is coming in v2.1." }
                ].map((faq, i) => (
                  <div key={i} className="border border-border rounded-2xl bg-surface overflow-hidden">
                    <button 
                      className="w-full px-8 py-6 flex items-center justify-between font-bold text-lg text-left text-text hover:bg-surface-elevated transition-colors"
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    >
                      {faq.q}
                      <ChevronRight className={`w-5 h-5 text-text-muted transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-8 pb-6 text-text-muted text-lg leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- 11. Final CTA --- */}
        <section className="py-32 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-primary to-emerald-500 blur-[150px] opacity-30 rounded-full pointer-events-none mix-blend-screen" />
          
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-5xl md:text-7xl font-extrabold text-text mb-8 tracking-tight leading-tight"
            >
              Ready to Take Control?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-text-muted mb-12"
            >
              Join the thousands of engineers and students organizing their job search and landing better offers.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-white text-black font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.4)]">
                Get Started Free <ArrowRight className="w-6 h-6" />
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl border border-white/20 text-text font-bold text-xl hover:bg-surface-elevated transition-all">
                View Dashboard
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- 12. Footer --- */}
      <footer className="bg-background border-t border-border pt-20 pb-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2 lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-text">Obsidian CRM</span>
              </Link>
              <p className="text-text-muted max-w-xs leading-relaxed">
                The modern standard for job application tracking. Built by engineers, for engineers.
              </p>
            </div>
            
            <div>
              <h4 className="text-text font-bold mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-4 text-text-muted">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#showcase" className="hover:text-primary transition-colors">Preview</a></li>
                <li><a href="#compare" className="hover:text-primary transition-colors">Vs Excel</a></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-text font-bold mb-6 uppercase tracking-wider text-sm">Resources</h4>
              <ul className="space-y-4 text-text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-text font-bold mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4 text-text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © {new Date().getFullYear()} Obsidian CRM. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center hover:bg-surface-elevated hover:bg-surface text-text-muted hover:text-text transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
