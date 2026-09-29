import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { History, LayoutDashboard, LogOut, Plus } from 'lucide-react';
import { RadialBackground } from '@/components/ui/light-theme-tailwind-css-background-snippet';
import { Logo } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'History', icon: History },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative isolate min-h-screen">
      <RadialBackground className="fixed" />

      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
        <nav className="surface-ink mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 text-white sm:px-4">
          <Logo className="text-white [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />

          <div className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  )
                }
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="light" onClick={() => navigate('/interview/new')}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">New interview</span>
            </Button>
            <span
              title={user?.email}
              className="hidden size-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-sm font-semibold md:grid"
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
