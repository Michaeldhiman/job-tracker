import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';
import { 
  Menu, X, ChevronRight, Briefcase, Calendar, Building2, 
  LineChart, FileText, CheckCircle2, XCircle, Search,
  AlertCircle, LayoutDashboard, ArrowRight, Table,
  Target, Zap, Activity, Clock, Plus, Upload, Check, Bell
} from 'lucide-react';
import { 
  BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer 
} from 'recharts';

// --- THREE.JS WebGL BACKGROUND ---
function WebGLBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 7;
    camera.position.y = 3;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Grid details - reduce grid count on mobile to lower vertex calculation overhead
    const count = isMobile ? 30 : 55;
    const spacing = isMobile ? 0.6 : 0.35;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * count * 3);
    const colors = new Float32Array(count * count * 3);

    let idx = 0;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const x = (i - count / 2) * spacing;
        const z = (j - count / 2) * spacing;
        positions[idx] = x;
        positions[idx + 1] = 0;
        positions[idx + 2] = z;

        // Gradient from Indigo to Emerald/Teal
        const ratio = i / count;
        colors[idx] = 0.31 * (1 - ratio) + 0.06 * ratio;
        colors[idx + 1] = 0.27 * (1 - ratio) + 0.72 * ratio;
        colors[idx + 2] = 0.9 * (1 - ratio) + 0.5 * ratio;

        idx += 3;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture (smooth circle)
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: isMobile ? 0.22 : 0.12, // Scale particle size slightly larger on mobile to maintain coverage density
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      map: texture,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse interactive shift
    let targetMouseX = 0;
    let targetMouseY = 0;
    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Mobile touch shift - passive listener to avoid blocking natural page scrolling
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetMouseX = (touch.clientX / window.innerWidth - 0.5) * 2;
        targetMouseY = (touch.clientY / window.innerHeight - 0.5) * 2;
      }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      const time = clock.getElapsedTime();
      const posAttr = geometry.attributes.position;
      const countTotal = count * count;

      for (let i = 0; i < countTotal; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        const y = Math.sin(x * 0.4 + time * 1.3) * Math.cos(z * 0.4 + time * 1.3) * 0.45;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      // Smooth camera interpolation
      if (isMobile) {
        // Automatic slow panning loop on mobile combined with passive touch shifts
        const idleX = Math.sin(time * 0.35) * 1.2;
        const idleY = Math.cos(time * 0.25) * 0.4 + 3.0;

        const targetX = targetMouseX !== 0 ? targetMouseX * 1.2 : idleX;
        const targetY = targetMouseY !== 0 ? targetMouseY * 0.8 + 3.0 : idleY;

        camera.position.x += (targetX - camera.position.x) * 0.03;
        camera.position.y += (targetY - camera.position.y) * 0.03;
      } else {
        camera.position.x += (targetMouseX * 1.5 - camera.position.x) * 0.05;
        camera.position.y += (targetMouseY * 1.0 + 3 - camera.position.y) * 0.05;
      }
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-50" />;
}

// --- MAGNETIC BUTTON COMPONENT ---
function MagneticButton({ children, className = '', ...props }) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    setPosition({ x: distanceX * 0.22, y: distanceY * 0.22 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// --- 3D CARD TILT & RADIAL GLOW ---
function Card3DTilt({ children, className = '', glowColor = 'rgba(99, 102, 241, 0.12)', ...props }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    // Skip tilt on touch devices for smoother scrolling
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    const normalizedX = (mouseX / width) - 0.5;
    const normalizedY = (mouseY / height) - 0.5;

    // Rotate limit: 10deg
    setRotateX(-normalizedY * 10);
    setRotateY(normalizedX * 10);

    setGlowPos({ x: mouseX, y: mouseY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY, scale: isHovered ? 1.01 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {isHovered && (
        <div
          className="absolute pointer-events-none rounded-full blur-[80px] transition-opacity duration-300"
          style={{
            width: '240px',
            height: '240px',
            left: `${glowPos.x - 120}px`,
            top: `${glowPos.y - 120}px`,
            background: `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
      )}
      <div style={{ transform: 'translateZ(8px)' }}>
        {children}
      </div>
    </motion.div>
  );
}

// --- ANIMATED COUNTER COMPONENT ---
function AnimatedCounter({ value, duration = 1.6 }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const end = parseInt(value.replace(/,/g, '').replace(/\+/g, ''), 10);
    if (isNaN(end)) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <span ref={elementRef}>
      {count.toLocaleString()}
      {value.includes('+') && '+'}
    </span>
  );
}

// --- MAIN LANDING PAGE ---
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mouse trail spotlight glow coordinates
  const [mouseSpotlight, setMouseSpotlight] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const handleScroll = () => setIsScrolled(window.scrollY > 25);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleMouseMoveSpotlight = (e) => {
      setMouseSpotlight({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMoveSpotlight);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMoveSpotlight);
    };
  }, []);

  // Scroll target reference for chaos stacking
  const problemsRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: problemsRef,
    offset: ["start end", "end start"]
  });

  // Transform coordinates for problem-to-solution stack
  const desktopCard1X = useTransform(scrollYProgress, [0, 0.4, 0.75], [-180, -40, 0]);
  const mobileCard1X = useTransform(scrollYProgress, [0, 0.4, 0.75], [-20, -5, 0]);
  const chaosCard1X = isMobile ? mobileCard1X : desktopCard1X;

  const desktopCard1Y = useTransform(scrollYProgress, [0, 0.4, 0.75], [50, 10, 0]);
  const mobileCard1Y = useTransform(scrollYProgress, [0, 0.4, 0.75], [15, 5, 0]);
  const chaosCard1Y = isMobile ? mobileCard1Y : desktopCard1Y;

  const chaosCard1Rotate = useTransform(scrollYProgress, [0, 0.4, 0.75], [-12, -6, 0]);

  const desktopCard2X = useTransform(scrollYProgress, [0, 0.4, 0.75], [190, 60, 0]);
  const mobileCard2X = useTransform(scrollYProgress, [0, 0.4, 0.75], [20, 5, 0]);
  const chaosCard2X = isMobile ? mobileCard2X : desktopCard2X;

  const desktopCard2Y = useTransform(scrollYProgress, [0, 0.4, 0.75], [-40, -10, 0]);
  const mobileCard2Y = useTransform(scrollYProgress, [0, 0.4, 0.75], [-15, -5, 0]);
  const chaosCard2Y = isMobile ? mobileCard2Y : desktopCard2Y;

  const chaosCard2Rotate = useTransform(scrollYProgress, [0, 0.4, 0.75], [14, 7, 0]);

  const desktopCard3X = useTransform(scrollYProgress, [0, 0.4, 0.75], [-80, -20, 0]);
  const mobileCard3X = useTransform(scrollYProgress, [0, 0.4, 0.75], [-15, -5, 0]);
  const chaosCard3X = isMobile ? mobileCard3X : desktopCard3X;

  const desktopCard3Y = useTransform(scrollYProgress, [0, 0.4, 0.75], [-160, -50, 0]);
  const mobileCard3Y = useTransform(scrollYProgress, [0, 0.4, 0.75], [-25, -10, 0]);
  const chaosCard3Y = isMobile ? mobileCard3Y : desktopCard3Y;

  const chaosCard3Rotate = useTransform(scrollYProgress, [0, 0.4, 0.75], [8, 3, 0]);

  const alignBorderColor = useTransform(
    scrollYProgress,
    [0.6, 0.8],
    ['rgba(255, 255, 255, 0.08)', 'rgba(79, 70, 229, 0.4)']
  );

  const showcaseTabs = [
    { id: 0, title: "Kanban Pipeline", icon: LayoutDashboard },
    { id: 1, title: "Analytics Engine", icon: LineChart },
    { id: 2, title: "Resume Vault", icon: FileText },
    { id: 3, title: "Calendar Scheduler", icon: Calendar },
  ];

  // Showcase Demos State Animation Trigger Loops
  const [kanbanStage, setKanbanStage] = useState(0); // 0 = Applied, 1 = Screening, 2 = Interview
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const [calendarSecondsLeft, setCalendarSecondsLeft] = useState(10);
  const [calendarShowAlert, setCalendarShowAlert] = useState(false);
  const [heroStage, setHeroStage] = useState(0); // 0 = Applied, 1 = Screening, 2 = Interview, 3 = Offer

  useEffect(() => {
    // Hero simulation loop: Applied -> Screening -> Interview -> Offer
    const heroInterval = setInterval(() => {
      setHeroStage((prev) => (prev + 1) % 4);
    }, 3500);

    // Kanban loop
    const kanbanInterval = setInterval(() => {
      setKanbanStage((prev) => (prev + 1) % 3);
    }, 3800);

    // Resume upload simulator loop
    const resumeInterval = setInterval(() => {
      setResumeUploadProgress(0);
      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 10;
        setResumeUploadProgress(progress);
        if (progress >= 100) clearInterval(progressTimer);
      }, 150);
    }, 6000);

    // Calendar count down loop
    const calendarInterval = setInterval(() => {
      setCalendarSecondsLeft((prev) => {
        if (prev <= 1) {
          setCalendarShowAlert(true);
          setTimeout(() => {
            setCalendarShowAlert(false);
            setCalendarSecondsLeft(10);
          }, 4500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(heroInterval);
      clearInterval(kanbanInterval);
      clearInterval(resumeInterval);
      clearInterval(calendarInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e3e1ec] font-sans overflow-x-hidden selection:bg-primary/30">
      {/* Spotlight Trail Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-30 opacity-[0.05] bg-[radial-gradient(circle_350px_at_var(--x)_var(--y),#4f46e5_0%,transparent_100%)] hidden md:block"
        style={{
          '--x': `${mouseSpotlight.x}px`,
          '--y': `${mouseSpotlight.y}px`
        }}
      />

      {/* Modern Top Gradient Mesh Grid background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0)_80%,#09090b_100%)] pointer-events-none overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15)_0%,rgba(16,185,129,0.02)_50%,transparent_100%)]" />
        <div className="absolute top-[300px] left-1/4 w-[350px] h-[350px] bg-indigo-500/10 blur-[130px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute top-[100px] right-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[150px] rounded-full animate-pulse pointer-events-none" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.06] py-3.5 shadow-2xl' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 z-50 group whitespace-nowrap shrink-0">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-glass flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
              <Briefcase className="w-4.5 h-4.5 text-white shrink-0" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0">
              Snap
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary border border-primary/20 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] whitespace-nowrap shrink-0">Job</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-x-4 lg:gap-x-8 text-sm font-medium text-zinc-400 shrink-0">
            <a href="#problems" className="hover:text-white transition-colors whitespace-nowrap">How It Works</a>
            <a href="#showcase" className="hover:text-white transition-colors whitespace-nowrap">Features</a>
            <a href="#compare" className="hover:text-white transition-colors whitespace-nowrap">Excel vs Snap Job</a>
            <a href="#faq" className="hover:text-white transition-colors whitespace-nowrap">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-x-2 lg:gap-x-4 shrink-0">
            {isAuthenticated ? (
              <MagneticButton>
                <Link to="/dashboard" className="px-3.5 py-2 lg:px-5 lg:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs lg:text-sm font-medium text-white transition-all whitespace-nowrap">
                  Dashboard
                </Link>
              </MagneticButton>
            ) : (
              <>
                <MagneticButton>
                  <Link to="/login" className="px-3.5 py-2 lg:px-5 lg:py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-xs lg:text-sm font-semibold text-zinc-200 hover:text-white transition-all duration-300 backdrop-blur-md whitespace-nowrap">
                    Log in
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link to="/register" className="px-3.5 py-2 lg:px-5 lg:py-2.5 rounded-xl bg-primary hover:bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.35)] text-xs lg:text-sm font-bold text-white transition-all flex items-center gap-1.5 border-t border-white/15 whitespace-nowrap">
                    Start Free <ChevronRight className="w-4 h-4" />
                  </Link>
                </MagneticButton>
              </>
            )}
          </div>

          <button className="md:hidden z-50 p-2 text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-full left-0 right-0 bg-[#09090b] border-b border-white/[0.06] shadow-2xl md:hidden overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                <a href="#problems" className="text-sm font-medium text-zinc-300 py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#showcase" className="text-sm font-medium text-zinc-300 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#compare" className="text-sm font-medium text-zinc-300 py-2" onClick={() => setMobileMenuOpen(false)}>Excel vs Snap Job</a>
                <a href="#faq" className="text-sm font-medium text-zinc-300 py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <div className="h-px bg-white/5 my-2" />
                {isAuthenticated ? (
                  <Link to="/dashboard" className="w-full py-3 rounded-xl bg-primary text-center font-bold text-white shadow-lg" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="w-full py-3 rounded-xl border border-white/10 text-center font-semibold text-zinc-300" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                    <Link to="/register" className="w-full py-3 rounded-xl bg-primary text-center font-bold text-white shadow-lg" onClick={() => setMobileMenuOpen(false)}>Start Free</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* --- HERO SECTION --- */}
        <section className="relative min-h-[85vh] lg:min-h-screen flex items-center pt-24 pb-8 md:pt-28 md:pb-12 overflow-hidden">
          {/* Three.js interactive wave canvas in the background */}
          <WebGLBackground />

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-6 md:mb-10">
              {/* Top Tagline Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider sm:tracking-widest mb-3 md:mb-5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Next-Gen Job Application CRM
              </motion.div>

              {/* Massive Header */}
              <motion.h1 
                initial={{ opacity: 0, y: 25 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-3 md:mb-5"
              >
                Turn Your Job Search <br className="hidden md:inline" />
                Into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-emerald-500">Automated Funnel.</span>
              </motion.h1>

              {/* Sleek Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 25 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-zinc-400 mb-4 md:mb-6 max-w-2.5xl mx-auto leading-relaxed"
              >
                Ditch messy spreadsheets. Organize applications, track interviews, and analyze your conversion rates in one visual, automated pipeline.
              </motion.p>

              {/* CTAs & Trust Social Proof */}
              <div className="flex flex-col items-center gap-5 mt-5">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 max-w-md mx-auto sm:max-w-none w-full sm:w-auto"
                >
                  <MagneticButton className="w-full sm:w-auto">
                    <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#09090b] font-bold text-base hover:bg-zinc-200 transition-all shadow-[0_0_35px_rgba(255,255,255,0.25)] border-t border-white/20">
                      Get Started Free <ArrowRight className="w-4.5 h-4.5" />
                    </Link>
                  </MagneticButton>
                  <MagneticButton className="w-full sm:w-auto">
                    <a href="#problems" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-base transition-all backdrop-blur-md">
                      See How It Works
                    </a>
                  </MagneticButton>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center gap-2.5 text-center sm:text-left text-[11px] sm:text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 sm:py-2 rounded-2xl sm:rounded-full backdrop-blur-md max-w-sm sm:max-w-none"
                >
                  <div className="flex -space-x-1.5 shrink-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/80 border border-[#09090b] flex items-center justify-center text-[8px] font-bold text-white">S</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-500/80 border border-[#09090b] flex items-center justify-center text-[8px] font-bold text-white">M</span>
                    <span className="w-5 h-5 rounded-full bg-purple-500/80 border border-[#09090b] flex items-center justify-center text-[8px] font-bold text-white">E</span>
                  </div>
                  <span className="leading-normal">Empowering 10,000+ candidates landing offers at top startups.</span>
                </motion.div>
              </div>
            </div>

            {/* Hero Interactive 3D Mockup Container */}
            <motion.div 
              initial={{ opacity: 0, y: 80 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5.5xl mx-auto mt-4 sm:mt-6 relative"
            >
              {/* Ambient bottom shadow gradient mask */}
              <div className="absolute inset-x-0 bottom-[-5px] h-[100px] bg-gradient-to-t from-[#09090b] to-transparent z-20 pointer-events-none" />

              <Card3DTilt className="rounded-2xl border border-white/10 bg-[#121214]/65 backdrop-blur-2xl p-2 sm:p-3 shadow-2xl">
                {/* Mockup Title bar */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500/80 shrink-0" />
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500/80 shrink-0" />
                    <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500/80 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] text-zinc-500 font-mono ml-2 sm:ml-4 truncate max-w-[140px] sm:max-w-none">snapjob.io/dashboard/funnel</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <div className="w-4 h-4 rounded-full bg-white/5" />
                  </div>
                </div>

                {/* Dashboard layout content mockup */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-[#09090b]/80 min-h-[380px] sm:h-[500px] overflow-hidden rounded-b-xl">
                  {/* Left Sidebar mockup */}
                  <div className="col-span-3 border-r border-white/5 p-2 hidden md:flex flex-col gap-3.5">
                    <div className="h-7 w-36 bg-white/5 rounded-lg border border-white/5 mb-3" />
                    {['Board Pipeline', 'Analytics Funnel', 'Interview Calendar', 'Resume Matching', 'Company Contacts', 'Preferences'].map((tab, i) => (
                      <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${i === 0 ? 'bg-primary/10 text-indigo-400 border border-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <div className="w-3.5 h-3.5 rounded bg-white/5" />
                        {tab}
                      </div>
                    ))}
                  </div>

                  {/* Right Dashboard Area mockup */}
                  <div className="col-span-12 md:col-span-9 p-2 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Workspace</span>
                        <h4 className="text-base sm:text-lg font-bold text-white">Active Applications</h4>
                      </div>
                      <div className="px-3 py-1.5 sm:px-3.5 bg-primary rounded-lg text-xs font-bold text-white shadow-lg flex items-center gap-1 cursor-default self-start sm:self-auto">
                        <Plus className="w-3.5 h-3.5" /> Add Application
                      </div>
                    </div>

                     {/* KPI widgets mockup */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3.5">
                      {[
                        { 
                          title: 'Total Applications', 
                          value: heroStage >= 1 ? '124' : '123', 
                          change: heroStage >= 1 ? '+1 New' : 'Latest', 
                          color: heroStage >= 1 ? 'text-primary' : 'text-zinc-500' 
                        },
                        { 
                          title: 'Interviews Scheduled', 
                          value: heroStage >= 2 ? '13 Active' : '12 Active', 
                          change: heroStage >= 2 ? '+1 Scheduled' : 'Current', 
                          color: heroStage >= 2 ? 'text-amber-500' : 'text-zinc-500' 
                        },
                        { 
                          title: 'Offers Received', 
                          value: heroStage === 3 ? '4 Offers' : '3 Offers', 
                          change: heroStage === 3 ? 'NEW OFFER!' : 'Top 5%', 
                          color: heroStage === 3 ? 'text-emerald-400 font-extrabold scale-105 transition-transform' : 'text-indigo-400' 
                        }
                      ].map((kpi, i) => (
                        <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
                          <span className="text-[10px] text-zinc-500 font-semibold">{kpi.title}</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-lg font-bold text-white">{kpi.value}</span>
                            <span className={`text-[10px] font-bold ${kpi.color}`}>{kpi.change}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Central columns grid mockup */}
                    <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      {/* Column 1: Applied */}
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2 relative">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 border-b border-white/5 pb-1">
                          <span>Applied</span>
                          <span className="px-1 bg-white/5 rounded text-[9px] text-zinc-500">
                            {heroStage >= 1 ? '1' : '2'}
                          </span>
                        </div>
                        {/* Static card */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-indigo-400">Linear</span>
                          <span className="text-[11px] font-bold text-white leading-tight">Product Engineer</span>
                        </div>
                        {/* Simulated Card in Applied stage */}
                        {heroStage === 0 && (
                          <motion.div 
                            layoutId="hero-job-card"
                            className="bg-[#121214] border border-primary/30 shadow-[0_0_12px_rgba(79,70,229,0.15)] rounded-lg p-2 flex flex-col gap-1 z-10"
                            transition={{ type: "spring", stiffness: 100, damping: 13 }}
                          >
                            <span className="text-[9px] font-bold text-primary">Stripe</span>
                            <span className="text-[11px] font-bold text-white leading-tight animate-pulse">Frontend Developer</span>
                            <span className="text-[8px] text-zinc-500">Applied June 11</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Column 2: Screening */}
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2 relative">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 border-b border-white/5 pb-1">
                          <span>Screening</span>
                          <span className="px-1 bg-white/5 rounded text-[9px] text-zinc-500">
                            {heroStage === 1 ? '1' : '0'}
                          </span>
                        </div>
                        {/* Simulated Card in Screening stage */}
                        {heroStage === 1 && (
                          <motion.div 
                            layoutId="hero-job-card"
                            className="bg-[#121214] border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] rounded-lg p-2 flex flex-col gap-1 z-10"
                            transition={{ type: "spring", stiffness: 100, damping: 13 }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-amber-500">Stripe</span>
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded font-bold animate-pulse">Screening</span>
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">Frontend Developer</span>
                            <span className="text-[8px] text-zinc-400">Resume parsed</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Column 3: Interviewing */}
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2 relative">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 border-b border-white/5 pb-1">
                          <span>Interviewing</span>
                          <span className="px-1 bg-white/5 rounded text-[9px] text-zinc-500">
                            {heroStage === 2 ? '1' : '0'}
                          </span>
                        </div>
                        {/* Simulated Card in Interview stage */}
                        {heroStage === 2 && (
                          <motion.div 
                            layoutId="hero-job-card"
                            className="bg-[#121214] border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)] rounded-lg p-2 flex flex-col gap-1 z-10"
                            transition={{ type: "spring", stiffness: 100, damping: 13 }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-purple-400">Stripe</span>
                              <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1 py-0.5 rounded font-bold animate-pulse">Technical</span>
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">Frontend Developer</span>
                            <span className="text-[8px] text-zinc-300">Today at 4:30 PM</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Column 4: Offers */}
                      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2 relative">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 border-b border-white/5 pb-1">
                          <span>Offers</span>
                          <span className="px-1 bg-white/5 rounded text-[9px] text-zinc-500">
                            {heroStage === 3 ? '2' : '1'}
                          </span>
                        </div>
                        {/* Static card */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-emerald-400">Vercel</span>
                          <span className="text-[11px] font-bold text-white leading-tight">Solutions Engineer</span>
                        </div>
                        {/* Simulated Card in Offer stage */}
                        {heroStage === 3 && (
                          <motion.div 
                            layoutId="hero-job-card"
                            className="bg-[#121214] border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] rounded-lg p-2 flex flex-col gap-1 z-10"
                            transition={{ type: "spring", stiffness: 100, damping: 13 }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-emerald-400">Stripe</span>
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded font-bold animate-bounce">Offer</span>
                            </div>
                            <span className="text-[11px] font-bold text-white leading-tight">Frontend Developer</span>
                            <span className="text-[8px] text-emerald-400 font-bold">$140k + Equity</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card3DTilt>
            </motion.div>
          </div>
        </section>

        {/* --- PROBLEM TO SOLUTION STORY SECTION --- */}
        <section id="problems" ref={problemsRef} className="pt-20 pb-10 md:pt-28 md:pb-12 border-t border-white/[0.06] relative overflow-hidden bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-24 max-w-3xl mx-auto">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/5 border border-rose-500/10">The Status Quo</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-5 mb-6">Why spreadsheets fail you.</h2>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
                When you're applying to hundreds of companies, losing context is losing offers. Keeping raw rows leads to missed schedules, wrong templates, and zero analytics.
              </p>
            </div>

            {/* Scroll animation track area */}
            <div className="relative min-h-[480px] flex items-center justify-center">
              
              {/* Column structure behind cards mapping to Kanban columns */}
              <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 pointer-events-none">
                <div className="border border-dashed border-white/10 rounded-2xl flex items-center justify-center"><span className="text-xs text-zinc-700">COL 1: Applied</span></div>
                <div className="border border-dashed border-white/10 rounded-2xl flex items-center justify-center"><span className="text-xs text-zinc-700">COL 2: APPLIED</span></div>
                <div className="border border-dashed border-white/10 rounded-2xl flex items-center justify-center"><span className="text-xs text-zinc-700">COL 3: INTERVIEWING</span></div>
              </div>

              {/* Chaos Cards animating on scroll */}
              <div className="relative w-full max-w-lg mx-auto flex flex-col gap-6 items-center">
                
                {/* Chaos Card 1: Spreadsheet Row */}
                <motion.div 
                  style={{
                    x: chaosCard1X,
                    y: chaosCard1Y,
                    rotate: chaosCard1Rotate,
                    borderColor: alignBorderColor
                  }}
                  className="w-full bg-[#121214] border border-white/5 rounded-2xl p-5 shadow-2xl z-20 flex items-center gap-4 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                    <Table className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-zinc-500">Google Sheet — Row 73</span>
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded-full border border-rose-500/10">Scattered Data</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">Google SWE App - applied June 10 (Wait, which resume version?)</p>
                  </div>
                </motion.div>

                {/* Chaos Card 2: Recruiter email alert */}
                <motion.div 
                  style={{
                    x: chaosCard2X,
                    y: chaosCard2Y,
                    rotate: chaosCard2Rotate,
                    borderColor: alignBorderColor
                  }}
                  className="w-full bg-[#121214] border border-white/5 rounded-2xl p-5 shadow-2xl z-20 flex items-center gap-4 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-zinc-500">Inbox Notification</span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">Missed Schedule</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">Marcus from Attio emailed 4 days ago about Tech Screen</p>
                  </div>
                </motion.div>

                {/* Chaos Card 3: No conversion data */}
                <motion.div 
                  style={{
                    x: chaosCard3X,
                    y: chaosCard3Y,
                    rotate: chaosCard3Rotate,
                    borderColor: alignBorderColor
                  }}
                  className="w-full bg-[#121214] border border-white/5 rounded-2xl p-5 shadow-2xl z-20 flex items-center gap-4 cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-zinc-500">Job Board Status</span>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/5 px-2 py-0.5 rounded-full border border-indigo-400/10">Zero Analytics</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">Why am I getting rejected? No funnel metrics recorded.</p>
                  </div>
                </motion.div>

              </div>
            </div>

            {/* Transition subtitle */}
            <div className="mt-12 text-center max-w-lg mx-auto flex flex-col items-center">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scroll to align</p>
              <div className="w-4 h-8 border border-white/10 rounded-full mt-3 flex justify-center p-1.5">
                <div className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-white mt-4">
                Watch your job search chaos align into a structured, automated pipeline.
              </h3>
              
              {/* Animated Connector Line */}
              <div className="relative h-20 w-px mt-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-zinc-800 to-transparent w-full h-full" />
                <motion.div 
                  animate={{ 
                    y: ["-100%", "200%"] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-transparent via-indigo-500 to-transparent"
                />
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE PRODUCT SHOWCASE SECTION --- */}
        <section id="showcase" className="pt-10 pb-20 md:pt-12 md:pb-28 relative">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-20">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-3 py-1 rounded-full bg-primary/5 border border-primary/10">Interactive Demos</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-5 mb-6">Designed for execution.</h2>
              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Click on the tabs below to play interactive, simulated previews of Snap Job workspace modules.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Tabs list selector */}
              <div className="lg:col-span-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-3">
                {showcaseTabs.map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = activeShowcase === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveShowcase(tab.id)}
                      className={`flex-none lg:w-full flex items-center gap-4 p-4.5 rounded-2xl text-left border transition-all duration-300 ${isActive ? 'bg-white/[0.03] border-white/10 text-white shadow-xl scale-[1.02] z-10 relative' : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${isActive ? 'bg-primary border-primary/20 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tab.title}</p>
                        <span className="text-[10px] text-zinc-500 hidden lg:inline-block">Click to preview</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Canvas */}
              <div className="lg:col-span-8">
                <Card3DTilt className="rounded-2xl border border-white/10 bg-[#121214]/65 backdrop-blur-2xl shadow-2xl h-auto min-h-[380px] md:h-[400px] overflow-hidden flex flex-col justify-between">
                  {/* Browser mockup header */}
                  <div className="h-11 border-b border-white/5 flex items-center justify-between px-5 bg-white/[0.01]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Module Preview: {showcaseTabs[activeShowcase].title}</span>
                    <div className="w-3.5 h-3.5 rounded bg-white/5" />
                  </div>

                  {/* Demo area renderer */}
                  <div className="flex-1 p-4 sm:p-8 bg-[#09090b]/80 relative overflow-hidden flex items-center justify-center">
                    
                    {/* CONFETTI / PARTICLES OVERLAY */}
                    <AnimatePresence>
                      {activeShowcase === 0 && kanbanStage === 2 && (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 0.15 }} 
                          exit={{ opacity: 0 }} 
                          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.3)_0%,transparent_70%)] pointer-events-none" 
                        />
                      )}
                    </AnimatePresence>

                    {/* DEMO 0: KANBAN FLOW SIMULATOR */}
                    {activeShowcase === 0 && (
                      <div className="w-full h-full flex flex-col gap-4 justify-between">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Drag & Drop Simulation</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-primary/20 animate-pulse">Running Automator</span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 py-4">
                          {/* Column 1: Applied */}
                          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-3 relative">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase pb-1.5 border-b border-white/5">Applied</span>
                            {kanbanStage === 0 && (
                              <motion.div 
                                layoutId="kanban-demo-card" 
                                className="bg-[#121214] border border-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.1)] rounded-lg p-2.5 flex flex-col gap-1.5"
                                transition={{ type: 'spring', stiffness: 100, damping: 12 }}
                              >
                                <span className="text-[9px] font-bold text-indigo-400">Linear</span>
                                <p className="text-[11px] font-bold text-white">Product Engineer</p>
                                <div className="h-4.5 w-fit px-2.5 rounded-full bg-white/5 text-[8px] font-bold text-zinc-400 flex items-center justify-center border border-white/5">Full-time</div>
                              </motion.div>
                            )}
                          </div>

                          {/* Column 2: Screening */}
                          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-3 relative">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase pb-1.5 border-b border-white/5">Screening</span>
                            {kanbanStage === 1 && (
                              <motion.div 
                                layoutId="kanban-demo-card" 
                                className="bg-[#121214] border border-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.1)] rounded-lg p-2.5 flex flex-col gap-1.5"
                                transition={{ type: 'spring', stiffness: 100, damping: 12 }}
                              >
                                <span className="text-[9px] font-bold text-indigo-400">Linear</span>
                                <p className="text-[11px] font-bold text-white">Product Engineer</p>
                                <div className="h-4.5 w-fit px-2.5 rounded-full bg-amber-500/10 text-[8px] font-bold text-amber-500 flex items-center justify-center border border-amber-500/20">Resume Screen</div>
                              </motion.div>
                            )}
                          </div>

                          {/* Column 3: Interviewing */}
                          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 flex flex-col gap-3 relative">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase pb-1.5 border-b border-white/5">Interview</span>
                            {kanbanStage === 2 && (
                              <motion.div 
                                layoutId="kanban-demo-card" 
                                className="bg-[#121214] border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] rounded-lg p-2.5 flex flex-col gap-1.5"
                                transition={{ type: 'spring', stiffness: 100, damping: 12 }}
                              >
                                <span className="text-[9px] font-bold text-emerald-400">Linear</span>
                                <p className="text-[11px] font-bold text-white">Product Engineer</p>
                                <div className="h-4.5 w-fit px-2.5 rounded-full bg-emerald-500/10 text-[8px] font-bold text-emerald-400 flex items-center justify-center border border-emerald-500/20 animate-bounce">Technical Screen</div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DEMO 1: ANALYTICS FUNNEL SIMULATOR */}
                    {activeShowcase === 1 && (
                      <div className="w-full h-full flex flex-col justify-between gap-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Funnel Analytics</span>
                            <h5 className="text-sm font-bold text-white mt-0.5">Average Conversion: <span className="text-emerald-400">32.4%</span></h5>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">+14% Growth</span>
                        </div>

                        {/* Interactive Bars visual */}
                        <div className="flex-1 flex items-end justify-around gap-2 sm:gap-6 pt-6 border-b border-white/5 pb-2">
                          {[
                            { label: 'Applications', rate: '100%', height: '100%', color: 'from-indigo-600 to-indigo-500' },
                            { label: 'Screenings', rate: '52%', height: '52%', color: 'from-indigo-500 to-indigo-400' },
                            { label: 'Interviews', rate: '32%', height: '32%', color: 'from-indigo-400 to-purple-500' },
                            { label: 'Offers', rate: '12%', height: '12%', color: 'from-emerald-500 to-teal-400' }
                          ].map((bar, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: bar.height }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className={`w-full max-w-[50px] bg-gradient-to-t ${bar.color} rounded-t-lg shadow-lg relative group`}
                              >
                                <span className="absolute top-[-24px] inset-x-0 text-center text-[10px] font-bold text-white">{bar.rate}</span>
                              </motion.div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-center">{bar.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DEMO 2: RESUME VAULT SIMULATOR */}
                    {activeShowcase === 2 && (
                      <div className="w-full h-full flex flex-col justify-between gap-4">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Resume Version Matcher</span>
                        
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-white/10 rounded-xl p-6 relative bg-white/[0.01]">
                          {resumeUploadProgress < 100 ? (
                            <>
                              <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
                              <div className="w-full max-w-[240px] bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                                <motion.div 
                                  className="bg-primary h-full"
                                  style={{ width: `${resumeUploadProgress}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-zinc-400">Uploading: Resume_SWE_Google.pdf ({resumeUploadProgress}%)</span>
                            </>
                          ) : (
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex flex-col items-center gap-3 text-center"
                            >
                              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Check className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">Resume_SWE_Google.pdf uploaded!</p>
                                <span className="text-[10px] text-zinc-500">Auto-linked to Google application - Version v2_google</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DEMO 3: CALENDAR & REMINDERS SIMULATOR */}
                    {activeShowcase === 3 && (
                      <div className="w-full h-full flex flex-col justify-between gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Calendar Sync</span>
                          <span className="text-[10px] font-mono text-zinc-500">Auto-refresh in {calendarSecondsLeft}s</span>
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {!calendarShowAlert ? (
                              <motion.div 
                                key="clock-stage"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-[280px] bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center flex flex-col gap-2 shadow-lg"
                              >
                                <Clock className="w-7 h-7 text-amber-500 mx-auto" />
                                <h6 className="text-xs font-bold text-zinc-400">Awaiting recruiter response...</h6>
                                <p className="text-[11px] text-zinc-600">Simulating real-time schedule trigger from external system.</p>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="alert-stage"
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                                className="w-full max-w-[320px] bg-[#4f46e5]/10 border border-[#4f46e5]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(79,70,229,0.25)] flex gap-4"
                              >
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 animate-pulse">
                                  <Bell className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Schedule Update</span>
                                    <span className="text-[9px] text-emerald-400 font-bold">Now</span>
                                  </div>
                                  <p className="text-xs font-bold text-white">Stripe Tech Screen Scheduled!</p>
                                  <span className="text-[10px] text-zinc-400 block mt-1">Calendar Event Sync: June 15, 3:00 PM</span>
                                  <div className="mt-3.5 px-3 py-1.5 bg-primary rounded-lg text-[10px] font-bold text-white text-center cursor-default inline-block border-t border-white/10">
                                    Join Google Meet
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                  </div>
                </Card3DTilt>
              </div>
            </div>
          </div>
        </section>

        {/* --- WHY NOT EXCEL TABLE --- */}
        <section id="compare" className="py-28 sm:py-36 bg-white/[0.01] border-y border-white/[0.06] relative">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-20">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">Vs Spreadsheets</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-5 mb-6">Designed for velocity, not ledger rows.</h2>
              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Spreadsheets are built for accountants, not careers. Here is how Snap Job changes the game.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* Spreadsheet Chaos Side */}
              <div className="border border-rose-500/10 hover:border-rose-500/20 transition-colors rounded-3xl p-4 sm:p-6 md:p-8 bg-[#121214]/40 backdrop-blur-2xl relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Spreadsheet Chaos
                    </h3>
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wider">Old Way</span>
                  </div>
                  
                  {/* Spreadsheet Grid Simulation */}
                  <div className="space-y-3 font-mono text-[9px] sm:text-[10px] text-zinc-500 bg-[#09090b]/80 p-3 sm:p-4 rounded-xl border border-white/5">
                    <div className="grid grid-cols-4 border-b border-white/10 pb-2 text-zinc-400 font-bold font-mono">
                      <span>Company</span><span>Stage</span><span>Resume</span><span>Follow Up</span>
                    </div>
                    <div className="grid grid-cols-4 border-b border-white/5 py-1.5 text-rose-400/80">
                      <span className="truncate">Google</span><span>Applied</span><span className="truncate">cv_v4_final.pdf</span><span className="text-rose-500 font-bold animate-pulse truncate">MISSED CALL</span>
                    </div>
                    <div className="grid grid-cols-4 border-b border-white/5 py-1.5 text-zinc-400">
                      <span className="truncate">Stripe</span><span>Technical</span><span className="truncate">resume_old.pdf</span><span className="text-amber-500 font-bold truncate">Forgot (3d ago)</span>
                    </div>
                    <div className="grid grid-cols-4 py-1.5 text-zinc-650">
                      <span className="truncate">Meta</span><span>Applied</span><span className="truncate">cv_latest.pdf</span><span className="truncate">No reminders</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-5 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-zinc-400">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>No automated reminders or visual pipeline tracking.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-zinc-400">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Confusing and tedious manual data entry that leads to missed calls.</span>
                  </div>
                </div>
              </div>

              {/* Snap Job CRM Side */}
              <div className="border border-emerald-500/15 hover:border-emerald-500/30 transition-colors rounded-3xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-primary/5 to-emerald-500/[0.02] backdrop-blur-2xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Snap Job CRM
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider font-mono">New Way</span>
                  </div>

                  {/* CRM Card Simulation */}
                  <div className="bg-[#09090b]/80 p-3 sm:p-4 rounded-xl border border-white/5 space-y-3.5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center font-bold text-[10px]">S</div>
                        <div>
                          <span className="font-bold block leading-tight">Stripe</span>
                          <span className="text-[8px] text-zinc-400">Software Engineer</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[9px] border border-emerald-500/10 animate-pulse">Active Interview</span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-2 border-t border-white/5 pt-2.5 text-[9px] sm:text-[10px] text-zinc-400 font-medium">
                      <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-indigo-400" /> Linked: Stripe_v2.pdf</div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Synced to Calendar: Today 4:30 PM</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-5 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-emerald-400">
                    <span className="font-bold">✓</span>
                    <span>Interactive visual pipeline keeps application stages distinct and clear.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-emerald-400">
                    <span className="font-bold">✓</span>
                    <span>Automatic updates and calendars assure you never miss interview times.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DEEP ANALYTICS FUNNEL SECTION --- */}
        <section className="py-28 sm:py-36 relative overflow-hidden">
          <div className="absolute left-[-5%] top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-3 py-1 rounded-full bg-primary/5 border border-primary/10">Advanced Analytics</span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-5 mb-6 leading-tight">Stop Guessing. <br />Start Measuring.</h2>
                <p className="text-base sm:text-lg text-zinc-400 mb-8 leading-relaxed">
                  Are you dropping the ball on resume parsing or failing at the technical code screen? Snap Job's automated analytics breakdown exposes conversion bottlenecks instantly.
                </p>
                <ul className="space-y-4 mb-10">
                  {['Calculate Resume response ratios', 'Identify stages with highest dropoffs', 'Visualize historical offer trend lines'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-semibold text-zinc-300">
                      <Target className="w-5 h-5 text-indigo-400 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              {/* Actual Recharts Bar Chart Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Card3DTilt className="bg-[#121214]/65 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0">
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Funnel Yield</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white">24.5% Interview Rate</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-full text-[11px]">+5.2% this week</span>
                  </div>
                  <div className="h-60 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{name: 'Applied', v: 100}, {name: 'Screening', v: 45}, {name: 'Interview', v: 2450}, {name: 'Offer', v: 4}]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                        <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                          <Cell fill="#4f46e5" />
                          <Cell fill="#818cf8" />
                          <Cell fill="#c084fc" />
                          <Cell fill="#10b981" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card3DTilt>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- WORKFLOW TIMELINE --- */}
        <section className="py-28 sm:py-36 bg-white/[0.01] border-y border-white/[0.06]">
          <div className="container mx-auto px-6 max-w-5xl text-center">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-3 py-1 rounded-full bg-primary/5 border border-primary/10">The Pipeline</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-5 mb-24">Setting up takes 60 seconds.</h2>

            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-[28px] left-0 w-full h-0.5 bg-white/5 z-0" />

              <div className="grid md:grid-cols-4 gap-12 md:gap-6 relative z-10">
                {[
                  { step: "01", title: "Sign Up", desc: "Create your workspace in seconds." },
                  { step: "02", title: "Import Applications", desc: "Log jobs manually or import from CSV." },
                  { step: "03", title: "Link Resumes", desc: "Add resume files to specific entries." },
                  { step: "04", title: "Secure Offers", desc: "Monitor funnel stages and close deals." }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#121214] border border-white/10 text-white font-extrabold text-lg flex items-center justify-center mb-6 shadow-lg hover:border-primary/50 transition-colors duration-300">
                      {item.step}
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- STATS COUNTER SECTION --- */}
        <section className="py-28 sm:py-36 relative">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "Applications Logged", val: "10,000+" },
                { label: "Interviews Arranged", val: "2,500+" },
                { label: "Resumes Uploaded", val: "4,000+" },
                { label: "Offers Received", val: "800+" }
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                    <AnimatedCounter value={stat.val} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SOCIAL PROOF TESTIMONIALS --- */}
        <section className="py-28 sm:py-36 bg-white/[0.01] border-y border-white/[0.06]">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-20">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-3 py-1 rounded-full bg-primary/5 border border-primary/10">Social Proof</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-5 mb-6">Engineered for success.</h2>
              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Read how candidates optimize their pipeline efficiency to land roles at major companies.
              </p>
            </div>

            <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none md:grid-cols-3 gap-6 md:gap-8 pb-6 md:pb-0 custom-scrollbar">
              {[
                { name: "Sarah C.", role: "New Grad SWE @ Google", quote: "I applied to 140 places. Without Snap Job, I would have dropped the ball on half my interviews. The Kanban board is a lifesaver.", img: "S", glow: "rgba(79, 70, 229, 0.12)" },
                { name: "Marcus J.", role: "Product Manager", quote: "The analytics showed me I was failing at the HR screen. I adjusted my pitch, and my offer rate skyrocketed next month.", img: "M", glow: "rgba(16, 185, 129, 0.08)" },
                { name: "Elena R.", role: "UX Design Intern", quote: "Being able to attach specific resume versions to specific applications solved my biggest headache. Highly recommend.", img: "E", glow: "rgba(168, 85, 247, 0.08)" }
              ].map((test, i) => (
                <Card3DTilt 
                  key={i} 
                  glowColor={test.glow}
                  className="p-8 rounded-3xl bg-[#121214]/65 border border-white/10 hover:border-white/20 transition-colors relative flex flex-col justify-between h-80 shrink-0 w-[85vw] md:w-auto snap-center md:snap-align-none"
                >
                  <div>
                    <div className="flex gap-1 mb-6">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">"{test.quote}"</p>
                  </div>
                  <div className="flex items-center gap-3.5 border-t border-white/5 pt-5 mt-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0">
                      {test.img}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{test.name}</p>
                      <p className="text-[10px] text-indigo-400 font-semibold">{test.role}</p>
                    </div>
                  </div>
                </Card3DTilt>
              ))}
            </div>
          </div>
        </section>

        {/* --- FAQ SECTION WITH GET IN TOUCH --- */}
        <section id="faq" className="py-28 sm:py-36">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-12 gap-16 items-start">
              
              {/* Left Column Text */}
              <div className="md:col-span-5 flex flex-col gap-10">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-4.5 py-1.5 rounded-full bg-primary/5 border border-primary/10">Help Center</span>
                  <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mt-6 mb-6 leading-tight">Questions?<br />We've got answers.</h2>
                  <p className="text-lg text-zinc-400 leading-relaxed">Can't find the answers you're looking for? Chat with our team.</p>
                </div>
                
                {/* Contact Modal Trigger card */}
                <div className="p-6 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <h3 className="text-2xl font-bold text-white relative z-10">Need custom support?</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed relative z-10">Submit a ticket and our engineering team will get back to you within 24 hours.</p>
                  <MagneticButton className="self-start relative z-10 mt-2">
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="px-8 py-4 rounded-xl bg-white text-zinc-950 font-bold text-base hover:bg-zinc-200 transition-colors shadow-[0_4px_20px_rgba(255,255,255,0.15)] border-t border-white/20"
                    >
                      Get in Touch
                    </button>
                  </MagneticButton>
                </div>
              </div>

              {/* Right Column Accordion */}
              <div className="md:col-span-7 space-y-6">
                {[
                  { q: "Is Snap Job actually free?", a: "Yes. Core application tracking features are 100% free forever. Job hunting is stressful enough without having to pay for monthly subscription software." },
                  { q: "Can I import my existing spreadsheet data?", a: "Absolutely. You can import your current job application data from any standard CSV spreadsheet directly in your settings, or export your Snap Job workspace back to CSV with a single click." },
                  { q: "Does it support tracking recruiters and company contacts?", a: "Yes. Snap Job features a built-in Company CRM. You can save recruiter names, emails, phone numbers, and custom notes directly to specific applications and company profiles so you never lose contacts." },
                  { q: "How do interview reminders and notifications work?", a: "You can configure automated email notifications and dashboard alerts for upcoming interviews, screeners, and online assessments (OAs) in your Settings dashboard." },
                  { q: "Can I upload my resumes here?", a: "Absolutely. The Resume Vault lets you upload PDF documents and map specific versions to specific company applications so you always know which CV you applied with." },
                  { q: "How secure is my data?", a: "Your data is encrypted both in transit and at rest. We never sell your application data or personal information to third parties, and your data remains entirely yours." },
                  { q: "Does it sync with my calendar?", a: "Yes! Currently, we support internal schedules and alarms. Native Google Calendar integrations can be toggled via your Settings/Preferences dashboard." },
                  { q: "Can I track custom application stages?", a: "Yes. While we provide standard stages (Applied, Applied, OA, Offer, Rejected), you can filter and organize your board dynamically by status, priority, and source." }
                ].map((faq, i) => {
                  const isActive = activeFaq === i;
                  return (
                    <div 
                      key={i} 
                      className={`border rounded-3xl bg-white/[0.01] overflow-hidden transition-all duration-300 ${isActive ? 'border-primary bg-primary/[0.02] shadow-[0_0_25px_rgba(79,70,229,0.08)]' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <button 
                        className="w-full px-5 py-4 sm:px-8 sm:py-6.5 flex items-center justify-between font-bold text-base sm:text-lg text-left text-white hover:bg-white/[0.02] transition-colors"
                        onClick={() => setActiveFaq(isActive ? null : i)}
                      >
                        <span className="pr-4">{faq.q}</span>
                        <ChevronRight className={`w-5.5 h-5.5 text-zinc-400 shrink-0 transition-transform duration-300 ${isActive ? 'rotate-90 text-indigo-400' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-5 pb-5 sm:px-8 sm:pb-7 text-sm sm:text-base text-zinc-400 leading-relaxed font-medium"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* --- FINAL CONVERTING CTA --- */}
        <section className="py-28 sm:py-36 relative overflow-hidden border-t border-white/[0.06]">
          <div className="absolute inset-0 bg-[#09090b] z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gradient-to-r from-primary to-emerald-500 blur-[140px] opacity-20 rounded-full pointer-events-none mix-blend-screen" />
          
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl flex flex-col items-center">
            {/* Visual Journey Nodes */}
            <div className="flex items-center justify-center gap-1 sm:gap-4 mb-12 max-w-lg mx-auto relative z-10">
              {[
                { label: 'Applied', icon: Briefcase, color: 'border-primary/30 text-primary bg-primary/10' },
                { label: 'Screening', icon: Search, color: 'border-amber-500/30 text-amber-500 bg-amber-500/10' },
                { label: 'Interview', icon: Calendar, color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
                { label: 'Offer', icon: CheckCircle2, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' }
              ].map((node, i) => {
                const IconComp = node.icon;
                return (
                  <div key={i} className="flex items-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shadow-lg ${node.color}`}>
                        <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-wider uppercase">{node.label}</span>
                    </motion.div>
                    {i < 3 && (
                      <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        whileInView={{ width: '16px', opacity: 0.3 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 + 0.1, duration: 0.4 }}
                        className="h-px bg-white mx-1.5 sm:mx-3"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="text-4xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight leading-tight"
            >
              Ready to organize your job search?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg text-zinc-400 mb-12 max-w-xl"
            >
              Join the thousands of engineers and professionals structuring their application funnel and landing better offers.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-md sm:max-w-none"
            >
              <MagneticButton className="w-full sm:w-auto">
                <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-zinc-950 font-bold text-base hover:bg-zinc-200 transition-all shadow-[0_0_45px_rgba(255,255,255,0.25)] border-t border-white/25">
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
              </MagneticButton>
              <MagneticButton className="w-full sm:w-auto">
                <Link to="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-bold text-base hover:bg-white/5 transition-all">
                  View Dashboard
                </Link>
              </MagneticButton>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#09090b] border-t border-white/[0.06] pt-20 pb-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
            
            {/* Branding Column */}
            <div className="col-span-2 lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                  <Briefcase className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Snap Job</span>
              </Link>
              <p className="text-xs text-zinc-400 font-medium max-w-xs leading-relaxed">
                The MERN standard for job application tracking. Built by engineers, for engineers.
              </p>
            </div>
            
            {/* Nav Column 1 */}
            <div>
              <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-4 text-xs text-zinc-400 font-medium">
                <li><a href="#showcase" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#compare" className="hover:text-white transition-colors">Vs Excel</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            {/* Nav Column 2 */}
            <div>
              <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest mb-6">Resources</h4>
              <ul className="space-y-4 text-xs text-zinc-400 font-medium">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            {/* Nav Column 3 */}
            <div>
              <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4 text-xs text-zinc-400 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li>
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="hover:text-white transition-colors text-left bg-transparent border-none p-0 cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400 font-medium">
              © {new Date().getFullYear()} Snap Job. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- CONTACT MODAL --- */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactModal(false)}
              className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#121214]/75 border border-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-[2rem] p-6 sm:p-12 shadow-[0_0_50px_rgba(79,70,229,0.18)] relative z-10 overflow-hidden"
            >
              {/* Inner ambient glow highlights */}
              <div className="absolute top-0 left-0 w-[150px] h-[150px] bg-primary/15 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-[120px] h-[120px] bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

              <button 
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all z-20"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <ContactForm onClose={() => setShowContactModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENT: CONTACT FORM ---
function ContactForm({ onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8 space-y-6 relative z-10">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-extrabold text-white tracking-tight">Thank You!</h3>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Your message has been sent successfully. Our team will get back to you as soon as possible.
          </p>
        </div>
        <button 
          onClick={onClose}
          className="mt-6 px-8 py-3.5 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors border-t border-white/20 shadow-lg text-sm cursor-pointer"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
      <div>
        <h3 className="text-3xl font-extrabold text-white tracking-tight">Get in touch</h3>
        <p className="text-sm text-zinc-400 mt-2">Fill out the form below and we will contact you shortly.</p>
      </div>

      {status === 'error' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2.5 text-xs shadow-md">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Failed to send message. Please try again later.</p>
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Full Name</label>
          <input 
            type="text"
            required
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-[#09090b]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-400 hover:border-white/20 hover:bg-white/[0.01]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Email Address</label>
          <input 
            type="email"
            required
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full bg-[#09090b]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-400 hover:border-white/20 hover:bg-white/[0.01]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Subject</label>
          <input 
            type="text"
            required
            placeholder="How can we help?"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full bg-[#09090b]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-400 hover:border-white/20 hover:bg-white/[0.01]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Message</label>
          <textarea 
            required
            rows={4}
            placeholder="Tell us more about your questions..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full bg-[#09090b]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-zinc-400 resize-none hover:border-white/20 hover:bg-white/[0.01]"
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-extrabold text-sm transition-all mt-4 flex justify-center items-center gap-2 shadow-[0_4px_25px_rgba(79,70,229,0.35)] border-t border-white/25 active:scale-[0.98] cursor-pointer"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
