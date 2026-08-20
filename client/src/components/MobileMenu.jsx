import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
];

export default function MobileMenu({ isOpen, onClose, isAuthenticated, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-72 flex-col gap-6 bg-white p-6 shadow-cardHover">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-ink">Cartify</span>
          <button onClick={onClose} aria-label="Close menu" className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-4">
          {LINKS.map((link) =>
            link.to.startsWith('/#') ? (
              <a key={link.label} href={link.to} onClick={onClose} className="text-sm font-medium text-ink">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to} onClick={onClose} className="text-sm font-medium text-ink">
                {link.label}
              </Link>
            )
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-6">
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={onClose} className="btn-secondary w-full">Profile</Link>
              <button onClick={() => { onLogout(); onClose(); }} className="btn-ghost w-full">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className="btn-secondary w-full">Login</Link>
              <Link to="/signup" onClick={onClose} className="btn-primary w-full">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
