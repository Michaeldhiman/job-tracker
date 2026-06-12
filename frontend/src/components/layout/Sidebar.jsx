import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { LayoutDashboard, KanbanSquare, LineChart, Calendar, FileText, Building2, Settings, LogOut, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Applications', icon: KanbanSquare },
  { path: '/analytics', label: 'Analytics', icon: LineChart },
  { path: '/calendar', label: 'Interviews', icon: Calendar },
  { path: '/resumes', label: 'Resume Library', icon: FileText },
  { path: '/companies', label: 'Company CRM', icon: Building2 },
];

const navLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-text-muted hover:text-text hover:bg-white/5',
  ].join(' ');

function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => {
      logout();
    }, 0);
  };

  const handleNavClick = () => {
    // Close mobile drawer on navigation
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col h-[100dvh] overflow-hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-emerald-500 shadow-glass"></div>
            <span className="font-semibold text-text tracking-tight">Snap Job</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={handleNavClick}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <NavLink to="/settings" className={navLinkClass} onClick={handleNavClick}>
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors mt-1"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
