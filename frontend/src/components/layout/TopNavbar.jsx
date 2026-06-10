import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Bell, Search, Menu, Sun, Moon, Info, Calendar } from 'lucide-react';
import { getActivityLogs } from '../../api/jobsApi.js';

function TopNavbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await getActivityLogs({ limit: 5 });
      if (res.success) {
        setNotifications(res.logs || []);
        // Show unread count indicator if there are logs
        setUnreadCount(res.logs?.length > 0 ? 1 : 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
    setUnreadCount(0); // clear indicator on click
    fetchNotifications();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search anywhere..."
            className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="flex items-center gap-3" ref={dropdownRef}>
        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-elevated"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative">
          <button 
            onClick={handleBellClick}
            className={`p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-elevated ${showNotifications ? 'text-text bg-surface-elevated' : ''}`}
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-surface"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 glass-card rounded-xl shadow-xl border border-border py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-surface/30">
                <span className="font-semibold text-sm text-text">Notifications Feed</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length > 0 ? (
                  notifications.map((log) => (
                    <div key={log._id} className="p-3 hover:bg-surface-elevated/40 transition-colors flex gap-2.5 items-start">
                      <div className="mt-0.5 p-1 rounded bg-primary/10 text-primary">
                        {log.action?.includes('Interview') ? <Calendar className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text uppercase tracking-wider">{log.action}</p>
                        <p className="text-xs text-text-muted leading-relaxed mt-0.5 break-words">{log.details}</p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-text-muted text-xs">No recent notifications.</div>
                )}
              </div>
            </div>
          )}
        </div>

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
    </header>
  );
}

export default TopNavbar;
