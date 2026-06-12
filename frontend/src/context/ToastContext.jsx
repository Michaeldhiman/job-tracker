import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(({ type = 'success', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message, leaving: false }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((message, title) => toast({ type: 'success', message, title }), [toast]);
  const error = useCallback((message, title) => toast({ type: 'error', message, title, duration: 6000 }), [toast]);
  const info = useCallback((message, title) => toast({ type: 'info', message, title }), [toast]);
  const warning = useCallback((message, title) => toast({ type: 'warning', message, title, duration: 5000 }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

const CONFIGS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-400',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-400',
    iconColor: 'text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-400',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-primary/10 border-primary/20',
    text: 'text-primary',
    iconColor: 'text-primary',
  },
};

function Toast({ toast, dismiss }) {
  const cfg = CONFIGS[toast.type] || CONFIGS.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-80 max-w-sm px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${cfg.bg} ${toast.leaving ? 'opacity-0 translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className={`text-sm font-semibold ${cfg.text}`}>{toast.title}</p>}
        {toast.message && <p className="text-sm text-text-muted leading-snug mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 text-text-muted hover:text-text transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
