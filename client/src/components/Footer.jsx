import { ShoppingBag } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-extrabold text-ink">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Cartify
          </div>
          <p className="text-sm text-muted">Shop smarter, not harder.</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Shop</h4>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><a href="/#categories" className="hover:text-primary">Categories</a></li>
            <li><a href="/" className="hover:text-primary">New arrivals</a></li>
            <li><a href="/" className="hover:text-primary">Best sellers</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ink">Company</h4>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><a href="/#about" className="hover:text-primary">About</a></li>
            <li><a href="/#contact" className="hover:text-primary">Contact</a></li>
            <li><a href="/" className="hover:text-primary">Careers</a></li>
          </ul>
        </div>

        <div id="about">
          <h4 className="mb-3 text-sm font-semibold text-ink">Support</h4>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><a href="/" className="hover:text-primary">Help center</a></li>
            <li><a href="/" className="hover:text-primary">Shipping</a></li>
            <li><a href="/" className="hover:text-primary">Returns</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 py-6">
        <p className="container-page text-center text-xs text-muted">
          © {new Date().getFullYear()} Cartify. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
