import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, History, LayoutDashboard, LogOut, MessagesSquare, Plus } from 'lucide-react';
import { Logo } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-white text-ink-950">
      <header className="sticky top-0 z-30 bg-[#111217] print:hidden">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full items-center justify-between gap-3 border-b border-white/10 px-4 text-white sm:px-8 lg:px-10"
        >
          <Logo className="text-white [&>span:last-child]:hidden lg:[&>span:last-child]:inline" />

          <ul className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.02] p-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    aria-label={label}
                    className={cn(
                      'relative flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium transition-all sm:px-3',
                      active ? 'text-white' : 'text-white/60 hover:text-white'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10"
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

          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="light" onClick={() => navigate('/interview/new')} aria-label="New interview">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New interview</span>
            </Button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              title={user?.email}
              aria-label="Open profile"
              className="hidden size-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-gradient-to-br from-white/15 to-white/5 text-sm font-semibold shadow-inner shadow-white/10 transition hover:border-brand-300/60 hover:bg-white/15 lg:grid"
            >
              {user?.name?.[0]?.toUpperCase()}
            </button>
            <button
              onClick={logout}
              aria-label="Log out"
              className="grid size-9 cursor-pointer place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </nav>
      </header>

      <main className="min-h-[calc(100vh-4rem)] w-full bg-white px-4 pt-8 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
        <Outlet />
        </div>
      </main>
    </div>
  );
}
