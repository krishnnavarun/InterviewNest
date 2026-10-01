import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, History, LayoutDashboard, LogOut, MessagesSquare, Plus } from 'lucide-react';
import { RadialBackground } from '@/components/ui/light-theme-tailwind-css-background-snippet';
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
    <div className="relative isolate min-h-screen">
      <RadialBackground className="fixed" />

      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 print:hidden">
        <nav
          aria-label="Main"
          className="surface-ink mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl px-2.5 text-white sm:px-4"
        >
          <Logo className="text-white [&>span:last-child]:hidden lg:[&>span:last-child]:inline" />

          <ul className="flex items-center gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    aria-label={label}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3',
                      active ? 'text-white' : 'text-white/60 hover:text-white'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg bg-white/10"
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
            <span
              title={user?.email}
              className="hidden size-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-sm font-semibold lg:grid"
            >
              {user?.name?.[0]?.toUpperCase()}
            </span>
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

      <main className="mx-auto w-full max-w-6xl px-3 pt-8 pb-16 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
