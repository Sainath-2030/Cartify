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
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import MobileMenu from './MobileMenu.jsx';
import SearchBar from './SearchBar.jsx';
import Badge from './Badge.jsx';

const NAV_LINKS = [
  { label: 'Shop All', to: '/products' },
  { label: 'Departments', to: '/categories' },
  { label: 'Featured', to: '/products?sort=featured' },
  { label: 'Top Rated', to: '/products?sort=rating' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems: cartCount, openCart } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
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
  }, [location.pathname]);

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
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md transition-all">
      {/* Top micro-banner */}
      <div className="bg-zinc-950 py-1.5 text-center text-[11px] font-medium tracking-wide text-zinc-300">
        <span>Complimentary express dispatch on all verified orders above ₹999</span>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="font-display font-extrabold tracking-tight text-xl text-ink">
              Cartify<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => {
              const isCurrent = location.pathname + location.search === link.to;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isCurrent ? 'text-primary' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {link.label}
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
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search products...</span>
              <kbd className="hidden lg:inline-flex rounded bg-zinc-200/60 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                /
              </kbd>
            </button>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishlistCount} items)`}
              className="relative rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors inline-flex items-center justify-center"
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-xs">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              aria-label={`Shopping Cart (${cartCount} items)`}
              onClick={openCart}
              className="relative flex items-center gap-2 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Role-Aware User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 rounded-full p-0.5 border border-zinc-200/80 hover:border-zinc-300 transition"
                  aria-label="User Account Menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 font-bold text-[11px] text-white">
                    {userInitials}
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-400 hidden sm:block pr-0.5" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-dropdown animate-fadeIn z-50 divide-y divide-zinc-100">
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
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

                    <div className="py-1">
                      {userRole === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 text-zinc-900" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      {userRole === 'CONTENT_MANAGER' && (
                        <Link
                          to="/content-manager"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                        >
                          <Sliders className="h-3.5 w-3.5 text-zinc-900" />
                          <span>Content Studio</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Account & Orders</span>
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <Heart className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Saved Wishlist</span>
                      </Link>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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
              className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors md:hidden"
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