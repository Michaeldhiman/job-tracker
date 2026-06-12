import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Bell, Menu, Sun, Moon, Calendar, FileText, Briefcase,
  TrendingUp, Info, CheckCircle2, RefreshCw, X, Dot
} from 'lucide-react';
import { getActivityLogs } from '../../api/jobsApi.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = Math.floor((now - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotifMeta(action = '') {
  const a = action.toLowerCase();
  if (a.includes('interview')) return {
    icon: Calendar,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    dot: 'bg-violet-400',
    label: 'Interview',
  };
  if (a.includes('offer')) return {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-400',
    label: 'Offer',
  };
  if (a.includes('resume') || a.includes('notes')) return {
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-400',
    label: 'Document',
  };
  if (a.includes('status') || a.includes('update')) return {
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
    label: 'Status',
  };
  if (a.includes('job') || a.includes('appli')) return {
    icon: Briefcase,
    color: 'text-primary',
    bg: 'bg-primary/10',
    dot: 'bg-primary',
    label: 'Job',
  };
  return {
    icon: Info,
    color: 'text-text-muted',
    bg: 'bg-surface-elevated',
    dot: 'bg-text-muted',
    label: 'Activity',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

import { NOTIFICATION_SETTINGS } from '../../utils/constants.js';

const POLL_MS = NOTIFICATION_SETTINGS.POLL_INTERVAL_MS;
const NOTIFICATION_LIMIT = NOTIFICATION_SETTINGS.MAX_LIMIT;

function TopNavbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const dropdownRef = useRef(null);
  const seenIds = useRef(new Set());
  const pollRef = useRef(null);

  const { info: toastInfo } = useToast();

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      const res = await getActivityLogs({ limit: NOTIFICATION_LIMIT });
      if (res.success) {
        const logs = res.logs || [];

        // Count truly new entries since last fetch
        const newIds = logs.filter(l => !seenIds.current.has(l._id));
        if (newIds.length > 0 && seenIds.current.size > 0) {
          setUnreadCount(prev => prev + newIds.length);
          
          // Display premium toast alerts for background reminders
          newIds.forEach(l => {
            if (l.action && l.action.toLowerCase().includes('reminder')) {
              toastInfo(l.details || l.action, l.action);
            }
          });
        }
        logs.forEach(l => seenIds.current.add(l._id));

        setNotifications(logs);
        setLastSynced(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [toastInfo]);

  // Initial load + polling + sync event listener
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(() => fetchNotifications({ silent: true }), POLL_MS);

    const handleSync = () => {
      fetchNotifications({ silent: true });
    };
    window.addEventListener('sync-notifications', handleSync);

    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener('sync-notifications', handleSync);
    };
  }, [fetchNotifications]);

  // Click outside close
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      setUnreadCount(0);
      fetchNotifications({ silent: true });
    }
  };

  const handleManualSync = (e) => {
    e.stopPropagation();
    fetchNotifications({ silent: true });
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Group by date label
  const grouped = notifications.reduce((acc, log) => {
    const d = new Date(log.createdAt);
    const now = new Date();
    let label;
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else label = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(log);
    return acc;
  }, {});

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-3 -ml-3 text-text-muted hover:text-text transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2" ref={dropdownRef}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-elevated"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={handleBellClick}
            className={`relative p-2 rounded-lg transition-all duration-200 ${
              showNotifications
                ? 'text-text bg-surface-elevated ring-1 ring-border'
                : 'text-text-muted hover:text-text hover:bg-surface-elevated'
            }`}
            aria-label="View notifications"
          >
            <Bell className={`w-5 h-5 transition-transform duration-200 ${showNotifications ? 'scale-110' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-surface shadow-lg animate-in zoom-in duration-200">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── Notification Panel ────────────────────────── */}
          {showNotifications && (
            <div
              className="absolute -right-2 sm:right-0 top-[calc(100%+8px)] w-[calc(100vw-2rem)] max-w-sm sm:max-w-md sm:w-96 rounded-2xl border border-border shadow-2xl overflow-hidden z-50"
              style={{
                background: 'rgb(var(--color-surface) / 0.95)',
                backdropFilter: 'blur(20px)',
                animation: 'notifSlide 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text leading-none">Activity Feed</p>
                    {lastSynced && (
                      <p className="text-[10px] text-text-muted mt-0.5 leading-none">
                        Updated {timeAgo(lastSynced)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Manual sync */}
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated transition-all"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  </button>
                  {/* Close */}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  // Skeleton
                  <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-surface-elevated shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-surface-elevated rounded w-1/3" />
                          <div className="h-3 bg-surface-elevated rounded w-full" />
                          <div className="h-2 bg-surface-elevated rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-text-muted">
                    <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center">
                      <Bell className="w-5 h-5 opacity-40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs mt-1 opacity-60">No recent activity to show.</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    {Object.entries(grouped).map(([dateLabel, logs]) => (
                      <div key={dateLabel}>
                        {/* Date group label */}
                        <div className="px-4 py-2 flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">{dateLabel}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Notification rows */}
                        {logs.map((log) => {
                          const { icon: Icon, color, bg, dot } = getNotifMeta(log.action);
                          return (
                            <div
                              key={log._id}
                              className="mx-2 mb-1 flex gap-3 items-start p-3 rounded-xl hover:bg-surface-elevated/60 transition-colors cursor-default group"
                            >
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs font-bold uppercase tracking-wider leading-none ${color}`}>
                                    {log.action}
                                  </p>
                                  <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0 mt-0.5">
                                    {timeAgo(log.createdAt)}
                                  </span>
                                </div>
                                {log.details && (
                                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                                    {log.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">
                    {notifications.length} recent activit{notifications.length === 1 ? 'y' : 'ies'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-[10px] text-text-muted">{syncing ? 'Syncing…' : 'Live'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-text leading-none">{user?.name || 'User'}</span>
            <span className="text-xs text-text-muted mt-0.5">{user?.email || ''}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center text-white font-semibold text-xs shadow-md shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Panel animation keyframe */}
      <style>{`
        @keyframes notifSlide {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </header>
  );
}

export default TopNavbar;
