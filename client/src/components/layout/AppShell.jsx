import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, History, LayoutDashboard, LogOut, MessagesSquare, Plus } from 'lucide-react';
import { Logo } from '@/components/auth/AuthLayout';
import { motion } from '@/components/ui/motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/coach', label: 'AI Coach', icon: MessagesSquare },
  { to: '/history', label: 'History', icon: History },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-zinc-950 antialiased selection:bg-zinc-900 selection:text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#fbfaf8]/90 backdrop-blur-xl print:hidden">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-8 lg:px-10"
        >
          <Logo className="text-zinc-950 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />

          <ul className="flex items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-100/80 p-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    aria-label={label}
                    className={cn(
                      'relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors',
                      active ? 'text-zinc-950 font-semibold' : 'text-zinc-600 hover:text-zinc-950'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-zinc-950/5"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className="relative size-4" />
                    <span className="relative hidden md:inline">{label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/interview/new')}
              aria-label="New interview"
              className="group inline-flex items-center gap-2 rounded-full bg-zinc-950 pl-3.5 pr-1.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              <span className="hidden sm:inline">New interview</span>
              <span className="grid size-6 place-items-center rounded-full bg-white/20 text-white transition group-hover:scale-105">
                <Plus className="size-3.5" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              title={user?.email}
              aria-label="Open profile"
              className="hidden size-8 sm:size-9 cursor-pointer place-items-center rounded-full border border-zinc-200 bg-white text-xs sm:text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 lg:grid"
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </button>
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="grid size-8 sm:size-9 cursor-pointer place-items-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </nav>
      </header>

      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#fbfaf8] px-4 pt-8 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
