import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, Menu, User, LogOut, ShoppingBag, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import MobileMenu from './MobileMenu.jsx';
import SearchBar from './SearchBar.jsx';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    showToast('You have been logged out.');
    navigate('/');
  };

  // Wishlist and Cart get full functionality in Section 3 — for now these
  // are honest placeholders rather than dead buttons.
  const notImplementedYet = (label) => showToast(`${label} is coming in a future section.`, 'success');

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-ink">
          <ShoppingBag className="h-6 w-6 text-primary" />
          Cartify
        </Link>

        <nav className="hidden shrink-0 items-center gap-8 md:flex">
          {LINKS.map((link) =>
            link.to.startsWith('/#') ? (
              <a key={link.label} href={link.to} className="text-sm font-medium text-ink/80 transition-colors hover:text-primary">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to} className="text-sm font-medium text-ink/80 transition-colors hover:text-primary">
                {link.label}
              </Link>
            )
          )}
        </nav>

        {searchOpen ? (
          <div className="flex flex-1 items-center gap-2">
            <SearchBar variant="full" onClose={() => setSearchOpen(false)} />
            <button aria-label="Close search" onClick={() => setSearchOpen(false)} className="rounded-lg p-2.5 text-muted hover:bg-slate-100 hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="hidden rounded-lg p-2.5 text-ink/70 transition-colors hover:bg-slate-100 hover:text-ink sm:inline-flex"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Wishlist"
              onClick={() => notImplementedYet('Wishlist')}
              className="hidden rounded-lg p-2.5 text-ink/70 transition-colors hover:bg-slate-100 hover:text-ink sm:inline-flex"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button
              aria-label="Cart"
              onClick={() => notImplementedYet('Cart')}
              className="hidden rounded-lg p-2.5 text-ink/70 transition-colors hover:bg-slate-100 hover:text-ink sm:inline-flex"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>

            {isAuthenticated ? (
              <div className="relative ml-1 hidden md:block">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
                  aria-label="Open profile menu"
                >
                  {initials || <User className="h-4 w-4" />}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 card p-1.5 shadow-cardHover">
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    )}
                    {user?.role === 'CONTENT_MANAGER' && (
                      <Link
                        to="/content-manager"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Content Manager Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-50"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-1 hidden items-center gap-2 md:flex">
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/signup" className="btn-primary">Sign Up</Link>
              </div>
            )}

            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="ml-1 rounded-lg p-2.5 text-ink/70 hover:bg-slate-100 hover:text-ink md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
}