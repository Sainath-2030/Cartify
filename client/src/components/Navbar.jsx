import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingCart,
  Menu,
  User,
  LogOut,
  ShoppingBag,
  X,
  LayoutDashboard,
  Sliders,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useTheme } from '../hooks/useTheme.js';
import MobileMenu from './MobileMenu.jsx';
import SearchBar from './SearchBar.jsx';

const NAV_LINKS = [
  { label: 'All items', to: '/products' },
  { label: 'Categories', to: '/categories' },
  { label: 'Bestsellers', to: '/products?sort=featured' },
  { label: 'Top rated', to: '/products?sort=rating' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems: cartCount, openCart } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search and mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    showToast('Signed out successfully.');
    navigate('/');
  };

  const userInitials = user?.fullName || user?.full_name
    ? (user.fullName || user.full_name)
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'U';

  const userRole = user?.role || 'USER';

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface transition-colors duration-200">
      {/* Top micro-banner */}
      <div className="border-b border-border-subtle bg-card-soft py-1.5 text-center text-[11px] font-medium text-ink transition-colors">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Complimentary express dispatch on all verified orders above ₹999
        </span>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink transition-transform duration-150 group-hover:scale-105">
              <ShoppingBag className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-display font-bold tracking-tight text-lg text-ink">
              Cartify
            </span>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => {
              const currentPathWithSearch = location.pathname + location.search;
              const isCurrent = currentPathWithSearch === link.to || (link.to === '/products' && location.pathname === '/products' && !location.search);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`relative py-5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isCurrent ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {link.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center / Right: Search & Actions */}
        {searchOpen ? (
          <div className="flex flex-1 max-w-xl items-center gap-2 animate-fadeIn">
            <SearchBar variant="full" onClose={() => setSearchOpen(false)} />
            <button
              aria-label="Close search input"
              onClick={() => setSearchOpen(false)}
              className="rounded-lg p-2 text-muted hover:bg-card-elevated hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Trigger */}
            <button
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border-subtle bg-card-elevated px-3 py-1.5 text-xs text-muted hover:border-border-strong hover:text-ink transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-muted" />
              <span className="hidden sm:inline">Search products...</span>
              <kbd className="hidden lg:inline-flex rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-ink-subtle border border-border-subtle">
                /
              </kbd>
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlistCount} items)`}
              className="relative rounded-lg p-2 text-muted hover:bg-card-elevated hover:text-ink transition-colors inline-flex items-center justify-center"
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-ink">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle Button */}
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

            {/* Cart Trigger */}
            <button
              aria-label={`Shopping Cart (${cartCount} items)`}
              onClick={openCart}
              className="relative flex items-center gap-2 rounded-lg border border-border-subtle bg-card-elevated px-3 py-1.5 text-xs font-semibold text-ink hover:border-border-strong hover:bg-card transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Role-Aware User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-lg p-1 border border-border-subtle hover:border-border-strong transition-colors"
                  aria-label="User Account Menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-card-elevated font-bold text-[11px] text-ink">
                    {userInitials}
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted hidden sm:block pr-0.5" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border-subtle bg-card p-1.5 shadow-dropdown animate-fadeIn z-50 divide-y divide-border-subtle">
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-ink truncate">
                          {user?.fullName || user?.full_name || 'Shopper'}
                        </p>
                        {userRole === 'ADMIN' && (
                          <span className="rounded-lg bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/30">
                            Admin
                          </span>
                        )}
                        {userRole === 'CONTENT_MANAGER' && (
                          <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300 border border-sky-500/30">
                            Manager
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      {userRole === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 text-muted" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      {userRole === 'CONTENT_MANAGER' && (
                        <Link
                          to="/content-manager"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors"
                        >
                          <Sliders className="h-3.5 w-3.5 text-muted" />
                          <span>Content Studio</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors"
                      >
                        <User className="h-3.5 w-3.5 text-muted" />
                        <span>Account & Orders</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors"
                      >
                        <Heart className="h-3.5 w-3.5 text-muted" />
                        <span>Saved Wishlist</span>
                      </Link>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-error hover:bg-error/10 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-sm btn-ghost">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-sm btn-primary hidden sm:inline-flex">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-muted hover:bg-card-elevated hover:text-ink transition-colors md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
}