import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const navLinkClass = ({ isActive }) =>
  [
    'block px-4 py-3 rounded-lg font-medium transition-all duration-200 transform',
    isActive
      ? 'bg-white text-blue-600 shadow-md -translate-x-1'
      : 'text-slate-700 hover:bg-white/50 hover:text-slate-900',
  ].join(' ');

function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 p-6 flex flex-col gap-6 shadow-xl">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <p className="font-semibold text-white truncate">{user?.name || 'User'}</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/jobs" className={navLinkClass}>
          💼 Jobs
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
      >
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;

