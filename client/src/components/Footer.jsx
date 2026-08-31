import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-zinc-200/80 bg-white text-zinc-600">
      {/* Main 4-Column Editorial Footer */}
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4 pr-4">
            <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-ink">
                Cartify<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
              An intelligent, dataset-agnostic e-commerce platform built on PostgreSQL and structured for modular multi-model hybrid recommendation research.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-zinc-400">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Catalogue Active
              </span>
              <span>16,976 Verified Items</span>
            </div>
          </div>

          {/* Column 2: Catalogue */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-900">
              Catalogue
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-500">
              <li>
                <Link to="/products" className="hover:text-zinc-900 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-zinc-900 transition-colors">
                  Departments
                </Link>
              </li>
              <li>
                <Link to="/products?sort=featured" className="hover:text-zinc-900 transition-colors">
                  Featured Curations
                </Link>
              </li>
              <li>
                <Link to="/products?sort=rating" className="hover:text-zinc-900 transition-colors">
                  Top Rated
                </Link>
              </li>
              <li>
                <Link to="/products?sort=newest" className="hover:text-zinc-900 transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Hub */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-900">
              Customer Hub
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-500">
              <li>
                <Link to="/cart" className="hover:text-zinc-900 transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-zinc-900 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-zinc-900 transition-colors">
                  Account & Orders
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-zinc-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-zinc-900 transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Operational Consoles */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-900">
              Operations & RBAC
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-500">
              <li>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
                >
                  <span>Admin Console</span>
                  <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                </Link>
              </li>
              <li>
                <Link
                  to="/content-manager"
                  className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
                >
                  <span>Content Studio</span>
                  <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                </Link>
              </li>
              <li>
                <span className="text-zinc-400">REST API v1 (Locked)</span>
              </li>
              <li>
                <span className="text-zinc-400">PostgreSQL Engine</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 pt-8 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} Cartify Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-600 transition-colors">Clean Data Architecture</span>
            <span className="hover:text-zinc-600 transition-colors">Interaction Telemetry</span>
            <span className="hover:text-zinc-600 transition-colors">Academic Research Foundation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
