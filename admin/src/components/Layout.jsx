import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Plane, Eye, History, Settings, Users, BarChart3, FileText, LogOut } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Live View', icon: Eye },
  { to: '/history', label: 'Departed', icon: History },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Pricing', icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col shrink-0 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-md">
              <Plane className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="font-black text-sm text-white tracking-wide leading-tight">AIRPORT</p>
              <p className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">Car Parking</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">Terminal short-term parking management</p>
        </div>

        <p className="px-6 pt-5 pb-2 text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Control Panel</p>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 m-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Administrator</p>
          <p className="text-sm font-medium text-slate-200 truncate mt-1">{user.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
