import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck, Headphones } from 'lucide-react';
import ProductGrid from '../components/ProductGrid.jsx';
import CategoryGrid from '../components/CategoryGrid.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';

const TRUST_POINTS = [
  { icon: Truck, label: 'Fast, reliable delivery' },
  { icon: ShieldCheck, label: 'Secure checkout' },
  { icon: Headphones, label: '24/7 support' },
];

function useProductShelf(sort, limit = 4) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    productService
      .list({ sort, limit, page: 1 })
      .then((res) => { if (!cancelled) setProducts(res.data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Unable to load products.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [sort, limit]);

  return { products, isLoading, error };
}

export default function Home() {
  const featured = useProductShelf('featured', 4);
  const trending = useProductShelf('popular', 4);
  const newArrivals = useProductShelf('newest', 4);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data.slice(0, 8)))
      .catch((err) => setCategoriesError(err.message || 'Unable to load categories.'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Personalized shopping, on the way
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Shop Smarter,<br />Not Harder.
            </h1>
            <p className="max-w-md text-base text-muted">
              Discover products curated around your interests and shopping behavior.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary">
                Start Shopping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/categories" className="btn-secondary">Explore Categories</Link>
            </div>
          </div>

          <div className="relative">
            <ProductGrid products={featured.products.slice(0, 4)} isLoading={featured.isLoading} error={featured.error} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-surface">
        <div className="container-page grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary shadow-card">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-ink">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Categories */}
      <section id="categories" className="border-b border-slate-200 bg-white">
        <div className="container-page py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink">Popular Categories</h2>
              <p className="mt-1 text-sm text-muted">Browse Cartify's full range.</p>
            </div>
            <Link to="/categories" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
              View all
            </Link>
          </div>
          <CategoryGrid categories={categories} isLoading={categoriesLoading} error={categoriesError} />
        </div>
      </section>

      {/* Featured Products */}
      <ProductShelf title="Featured Products" subtitle="Hand-picked picks worth a look." shelf={featured} viewAllHref="/products?sort=featured" />

      {/* Trending Products */}
      <ProductShelf title="Trending Products" subtitle="What shoppers are loving right now." shelf={trending} viewAllHref="/products?sort=popular" tone="alt" />

      {/* New Arrivals */}
      <ProductShelf title="New Arrivals" subtitle="Freshly added to the Cartify catalogue." shelf={newArrivals} viewAllHref="/products?sort=newest" />

      {/* Personalized shopping teaser — NOT live AI, just the visual space for it */}
      <section className="bg-ink">
        <div className="container-page flex flex-col items-center gap-4 py-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Coming soon
          </span>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Personalized For You</h2>
          <p className="max-w-lg text-sm text-slate-300">
            Personalized recommendations will appear here as you shop. This space is reserved for
            Cartify's hybrid deep-learning recommendation engine — it will light up as later
            sections of the project are built.
          </p>
        </div>
      </section>
    </div>
  );
}

function ProductShelf({ title, subtitle, shelf, viewAllHref, tone = 'default' }) {
  return (
    <section className={`border-b border-slate-200 ${tone === 'alt' ? 'bg-surface' : 'bg-white'}`}>
      <div className="container-page py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          <Link to={viewAllHref} className="hidden text-sm font-semibold text-primary hover:underline sm:block">
            View all
          </Link>
        </div>
        <ProductGrid products={shelf.products} isLoading={shelf.isLoading} error={shelf.error} />
      </div>
    </section>
  );
}
