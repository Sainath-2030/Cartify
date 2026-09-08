import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Menu, X, ShoppingBag, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';

export default function DashboardShell({ roleLabel, navItems, homePath }) {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
          <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-ink">Cartify</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-accent">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive ? 'bg-card-elevated text-accent font-semibold border border-border-subtle' : 'text-muted hover:bg-card-elevated hover:text-ink'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border-subtle p-4 bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-elevated font-semibold text-xs text-ink border border-border-subtle">
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{user?.full_name || 'User'}</p>
            <p className="truncate text-[11px] text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted hover:bg-card-elevated hover:text-error transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-card md:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border-subtle shadow-modal">
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-subtle bg-surface px-5 sm:px-6 lg:px-8">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted hover:bg-card-elevated hover:text-ink md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-ink">{roleLabel} Console</h1>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              className="rounded-lg p-2 text-muted hover:bg-card-elevated hover:text-ink transition-colors inline-flex items-center justify-center"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-accent transition-transform hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-ink transition-transform hover:-rotate-12" />
              )}
            </button>
            <Link to={homePath} className="text-xs font-medium text-accent hover:underline">
              View storefront
            </Link>
          </div>
        </header>

        <main className="flex-1 px-5 sm:px-6 lg:px-8 py-6 sm:py-8 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}