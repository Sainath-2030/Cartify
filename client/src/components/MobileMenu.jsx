import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Home,
  Grid,
  Heart,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Sliders,
  LogIn,
  UserPlus,
  Sparkles,
  Package,
} from 'lucide-react';
import Badge from './Badge.jsx';

const STORE_LINKS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'All Products', to: '/products', icon: ShoppingBag },
  { label: 'Departments', to: '/categories', icon: Grid },
  { label: 'Featured Curations', to: '/products?sort=featured', icon: Sparkles },
];

export default function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  onLogout,
}) {
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
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Sheet */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-8">
        <aside className="flex w-screen max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out-expo p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight text-ink">
                Cartify<span className="text-primary">.</span>
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close mobile menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Authenticated User Status Banner */}
          {isAuthenticated && (
            <div className="mt-4 rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/70">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {user?.fullName || user?.full_name || 'Shopper'}
                </p>
                {userRole === 'ADMIN' && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Admin
                  </span>
                )}
                {userRole === 'CONTENT_MANAGER' && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Manager
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{user?.email}</p>
            </div>
          )}

          {/* Primary Navigation Links */}
          <nav className="mt-6 flex flex-col gap-1 overflow-y-auto flex-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Storefront
            </p>
            {STORE_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={onClose}
                  className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                >
                  <Icon className="h-4 w-4 text-zinc-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="my-2 border-t border-zinc-100" />

            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Personal Shopping
            </p>
            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              <Heart className="h-4 w-4 text-zinc-400" />
              <span>Saved Wishlist</span>
            </Link>

            <Link
              to="/cart"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-zinc-400" />
              <span>Shopping Cart</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/profile"
                onClick={onClose}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
              >
                <Package className="h-4 w-4 text-zinc-400" />
                <span>Orders & Profile</span>
              </Link>
            )}

            {/* Operational Consoles */}
            {isAuthenticated && (userRole === 'ADMIN' || userRole === 'CONTENT_MANAGER') && (
              <>
                <div className="my-2 border-t border-zinc-100" />
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Operations
                </p>
                {userRole === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-amber-700 bg-amber-50/60 hover:bg-amber-100/70 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-amber-700" />
                    <span>Administrator Console</span>
                  </Link>
                )}
                {userRole === 'CONTENT_MANAGER' && (
                  <Link
                    to="/content-manager"
                    onClick={onClose}
                    className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-sky-700 bg-sky-50/60 hover:bg-sky-100/70 transition-colors"
                  >
                    <Sliders className="h-4 w-4 text-sky-700" />
                    <span>Content Manager Console</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Footer Auth Actions */}
          <div className="mt-auto border-t border-zinc-100 pt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  <LogIn className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-950 text-xs font-semibold text-white hover:bg-zinc-800"
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