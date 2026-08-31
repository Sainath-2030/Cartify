import { Link } from 'react-router-dom';
import { Package, PlusCircle, LayoutGrid, ArrowRight } from 'lucide-react';

const CARDS = [
  { title: 'Products', description: 'Browse, edit and manage the Cartify product catalogue.', to: '/content-manager/products', icon: Package },
  { title: 'Add Product', description: 'Upload a new item with metadata and images.', to: '/content-manager/products/new', icon: PlusCircle },
  { title: 'Categories', description: 'Manage category names, descriptions and images.', to: '/content-manager/categories', icon: LayoutGrid },
];

export default function CMDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Content Manager Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Manage Cartify's product catalogue — items, metadata, images and categories.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        This dashboard is a structural foundation. Full product CRUD and image upload are not yet
        connected — see each section for its current status.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ title, description, to, icon: Icon }) => (
          <Link key={to} to={to} className="card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-cardHover">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <p className="text-xs text-muted">{description}</p>
            <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-primary">
              Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}