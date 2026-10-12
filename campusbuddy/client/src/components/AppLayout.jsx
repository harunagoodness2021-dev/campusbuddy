import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  BookOpen,
  CalendarDays,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { cn, initials } from '../lib/format.js';

const MENU = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/assistant', label: 'AI Assistant', Icon: Bot },
  { to: '/schedule', label: 'Schedule', Icon: CalendarDays },
  { to: '/map', label: 'Map', Icon: MapIcon },
  { to: '/courses', label: 'Courses', Icon: BookOpen },
];

const navClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive ? 'bg-brand/10 text-brand' : 'text-ink/70 hover:bg-black/5 hover:text-ink'
  );

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-[1900] bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[2000] flex w-64 flex-col border-r border-line bg-paper p-4 transition-transform md:static md:z-auto md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo to="/dashboard" />
          <button className="rounded-lg p-1.5 hover:bg-black/5 md:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Menu</p>
        <nav className="space-y-1">
          {MENU.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={navClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass}>
              <ShieldCheck size={18} />
              Admin
            </NavLink>
          )}
        </nav>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Others</p>
        <nav className="space-y-1">
          <NavLink to="/settings" className={navClass}>
            <Settings size={18} />
            Settings
          </NavLink>
          <NavLink to="/help" className={navClass}>
            <HelpCircle size={18} />
            Help &amp; Support
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
          >
            <LogOut size={18} />
            Log out
          </button>
        </nav>

        <div className="mt-auto rounded-2xl border border-line bg-white/60 p-4">
          <p className="text-sm font-semibold">Need Help?</p>
          <p className="mt-1 text-xs text-muted">Ask CampusBuddy AI anything about campus.</p>
          <NavLink to="/assistant" className="btn-primary mt-3 w-full !py-2 text-xs">
            Chat Now
          </NavLink>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu, hideSearch }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/map?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-cream/80 px-4 backdrop-blur md:px-6">
      <button className="rounded-lg p-2 hover:bg-black/5 md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {hideSearch ? (
        <div className="flex-1" />
      ) : (
        <form onSubmit={submit} className="relative max-w-xl flex-1" role="search">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input !rounded-full !py-2 pl-10"
            placeholder="Search campus buildings, courses, faculty..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search campus"
          />
        </form>
      )}

      <NavLink
        to={user?.role === 'admin' ? '/admin' : '/settings'}
        className="ml-auto flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-black/5"
        title={user?.role === 'admin' ? 'Open admin area' : 'Open settings'}
      >
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs capitalize text-muted">{user?.department || user?.role}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
          {initials(user?.name)}
        </span>
      </NavLink>
    </header>
  );
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isMap = pathname.startsWith('/map');

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-cream text-ink">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenuOpen(true)} hideSearch={isMap} />
        <main className={cn('min-h-0 flex-1', isMap ? 'relative' : 'overflow-y-auto p-4 md:p-8')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
