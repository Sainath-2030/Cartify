import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-border-subtle bg-surface text-muted">
      {/* Main 4-Column Editorial Footer */}
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3.5 pr-4">
            <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
                <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-ink">
                Cartify
              </span>
            </Link>
            <p className="text-xs text-muted leading-relaxed max-w-sm">
              An intelligent, dataset-agnostic dark commerce platform built on PostgreSQL and structured for modular multi-model hybrid recommendation research.
            </p>
            <div className="flex items-center gap-2.5 pt-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1 text-ink border border-border-subtle text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Live catalogue active
              </span>
              <span className="text-[11px] text-ink-subtle">16,976 verified items</span>
            </div>
          </div>

          {/* Column 2: Catalogue */}
          <div>
            <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-ink">
              Catalogue
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-muted">
              <li>
                <Link to="/products" className="hover:text-ink transition-colors">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-ink transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/products?sort=featured" className="hover:text-ink transition-colors">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link to="/products?sort=rating" className="hover:text-ink transition-colors">
                  Top rated
                </Link>
              </li>
              <li>
                <Link to="/products?sort=newest" className="hover:text-ink transition-colors">
                  New arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Hub */}
          <div>
            <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-ink">
              Customer hub
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-muted">
              <li>
                <Link to="/cart" className="hover:text-ink transition-colors">
                  Shopping cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-ink transition-colors">
                  Saved wishlist
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-ink transition-colors">
                  Account & orders
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-ink transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-ink transition-colors">
                  Create account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Operational Consoles */}
          <div>
            <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-ink">
              Operations & RBAC
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-muted">
              <li>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 hover:text-ink transition-colors"
                >
                  <span>Admin console</span>
                  <ArrowUpRight className="h-3 w-3 text-muted" />
                </Link>
              </li>
              <li>
                <Link
                  to="/content-manager"
                  className="inline-flex items-center gap-1 hover:text-ink transition-colors"
                >
                  <span>Content studio</span>
                  <ArrowUpRight className="h-3 w-3 text-muted" />
                </Link>
              </li>
              <li>
                <span className="text-ink-subtle">REST API v1</span>
              </li>
              <li>
                <span className="text-ink-subtle">PostgreSQL engine</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-subtle pt-6 text-xs text-ink-subtle">
          <p>© {new Date().getFullYear()} Cartify. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-muted transition-colors">Clean data architecture</span>
            <span className="hover:text-muted transition-colors">Interaction telemetry</span>
            <span className="hover:text-muted transition-colors">Academic research</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
