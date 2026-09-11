import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Home,
  Grid,
  Heart,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Sliders,
  LogIn,
  UserPlus,
  Sparkles,
  Package,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';

const STORE_LINKS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'All items', to: '/products', icon: ShoppingBag },
  { label: 'Categories', to: '/categories', icon: Grid },
  { label: 'Bestsellers', to: '/products?sort=featured', icon: Sparkles },
];

export default function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  onLogout,
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  // Handle ESC key listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userRole = user?.role || 'USER';

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile Menu">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Sheet */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-8">
        <aside className="flex w-screen max-w-sm flex-col bg-card border-l border-border-subtle p-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
                <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-ink">
                Cartify
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close mobile menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-card-elevated hover:text-ink transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Authenticated User Status Banner */}
          {isAuthenticated && (
            <div className="mt-4 rounded-xl bg-card-elevated p-3 border border-border-subtle">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink truncate">
                  {user?.fullName || user?.full_name || 'Shopper'}
                </p>
                {userRole === 'ADMIN' && (
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/30">
                    Admin
                  </span>
                )}
                {userRole === 'CONTENT_MANAGER' && (
                  <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/30">
                    Manager
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted truncate mt-0.5">{user?.email}</p>
            </div>
          )}

          {/* Primary Navigation Links */}
          <nav className="mt-5 flex flex-col gap-1 overflow-y-auto flex-1">
            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
              Storefront
            </p>
            {STORE_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-card-elevated hover:text-ink transition-colors"
                >
                  <Icon className="h-4 w-4 text-ink-subtle" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="my-2 border-t border-border-subtle" />

            <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
              Personal
            </p>
            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-card-elevated hover:text-ink transition-colors"
            >
              <Heart className="h-4 w-4 text-ink-subtle" />
              <span>Saved wishlist</span>
            </Link>

            <Link
              to="/cart"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-card-elevated hover:text-ink transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-ink-subtle" />
              <span>Shopping cart</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted hover:bg-card-elevated hover:text-ink transition-colors"
              >
                <Package className="h-4 w-4 text-ink-subtle" />
                <span>Orders & Profile</span>
              </Link>
            )}

            {/* Operational Consoles */}
            {isAuthenticated && (userRole === 'ADMIN' || userRole === 'CONTENT_MANAGER') && (
              <>
                <div className="my-2 border-t border-border-subtle" />
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle mb-1">
                  Operations
                </p>
                {userRole === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors border border-accent/20"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Administrator Console</span>
                  </Link>
                )}
                {userRole === 'CONTENT_MANAGER' && (
                  <Link
                    to="/content-manager"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors border border-sky-500/20"
                  >
                    <Sliders className="h-4 w-4" />
                    <span>Content Studio</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Footer Theme & Auth Actions */}
          <div className="mt-auto border-t border-border-subtle pt-4 flex flex-col gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-lg border border-border-subtle bg-card-elevated px-3 py-2 text-xs font-medium text-ink hover:border-border-strong transition-colors"
            >
              <span className="flex items-center gap-2">
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 text-accent" />
                ) : (
                  <Moon className="h-4 w-4 text-ink" />
                )}
                <span>Appearance</span>
              </span>
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle py-2 text-xs font-medium text-error hover:bg-error/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border-subtle py-2 text-xs font-medium text-ink hover:bg-card-elevated"
                >
                  <LogIn className="h-3.5 w-3.5 text-muted" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-xs font-bold text-accent-ink hover:bg-accent-hover"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}