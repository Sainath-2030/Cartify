import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Search,
  Cpu,
  Layers,
  Database,
  Star,
  Clock,
  Trash2,
  TrendingUp,
  Award,
} from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import ProductSkeleton from '../components/ProductSkeleton.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import Container from '../components/Container.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Button from '../components/Button.jsx';
import Badge from '../components/Badge.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';
import { getRecentlyViewedProducts } from '../utils/recentViews.js';

// Legitimate Cartify Platform Pillars
const TRUST_METRICS = [
  {
    icon: Database,
    title: '16,976 Products',
    desc: 'Clean, dataset-independent catalogue',
  },
  {
    icon: ShieldCheck,
    title: 'ACID Transactions',
    desc: 'Atomic stock & snapshot pricing',
  },
  {
    icon: Layers,
    title: 'Event Telemetry',
    desc: 'Real-time behavioral stream tracking',
  },
  {
    icon: Cpu,
    title: 'Neural Hybrid AI',
    desc: 'Multi-model fusion recommendation',
  },
];

const POPULAR_SEARCH_TAGS = [
  { label: 'Headphones', query: 'headphones' },
  { label: 'Smartwatch', query: 'smartwatch' },
  { label: 'Shoes', query: 'shoes' },
  { label: 'Coffee', query: 'coffee' },
  { label: 'Cookware', query: 'cookware' },
  { label: 'Gaming', query: 'gaming' },
];

export default function Home() {
  const navigate = useNavigate();
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // 1. Featured Products (Top rated & editor picks)
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');

  // 2. Popular Products (High review volume)
  const [popularProducts, setPopularProducts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState('');

  // 3. New Arrivals (Latest additions)
  const [newArrivals, setNewArrivals] = useState([]);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [newArrivalsError, setNewArrivalsError] = useState('');

  // 4. Categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  // 5. Community Rating Fallback for AI Section
  const [communityPicks, setCommunityPicks] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  // 6. Recently Viewed Products (Local Session History)
  const [recentProducts, setRecentProducts] = useState([]);

  // Fetch Featured Products
  const loadFeatured = async () => {
    setFeaturedLoading(true);
    setFeaturedError('');
    try {
      const res = await productService.list({ sort: 'featured', limit: 8 });
      setFeaturedProducts(res.data || []);
    } catch (err) {
      setFeaturedError(err.message || 'Unable to load featured products.');
    } finally {
      setFeaturedLoading(false);
    }
  };

  // Fetch Popular Products
  const loadPopular = async () => {
    setPopularLoading(true);
    setPopularError('');
    try {
      const res = await productService.list({ sort: 'popular', limit: 4 });
      setPopularProducts(res.data || []);
    } catch (err) {
      setPopularError(err.message || 'Unable to load popular picks.');
    } finally {
      setPopularLoading(false);
    }
  };

  // Fetch New Arrivals
  const loadNewArrivals = async () => {
    setNewArrivalsLoading(true);
    setNewArrivalsError('');
    try {
      const res = await productService.list({ sort: 'newest', limit: 4 });
      setNewArrivals(res.data || []);
    } catch (err) {
      setNewArrivalsError(err.message || 'Unable to load new arrivals.');
    } finally {
      setNewArrivalsLoading(false);
    }
  };

  // Fetch Categories
  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const res = await categoryService.list();
      setCategories(res.data || []);
    } catch (err) {
      setCategoriesError(err.message || 'Unable to load departments.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch Community Picks for AI Recommender Fallback
  const loadCommunityPicks = async () => {
    setCommunityLoading(true);
    try {
      const res = await productService.list({ sort: 'rating', limit: 4 });
      setCommunityPicks(res.data || []);
    } catch (err) {
      console.warn('Community picks load notice:', err.message);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    loadPopular();
    loadNewArrivals();
    loadCategories();
    loadCommunityPicks();
    setRecentProducts(getRecentlyViewedProducts());
  }, []);

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(heroSearchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleClearRecentlyViewed = () => {
    localStorage.removeItem('cartify_recent_products');
    setRecentProducts([]);
  };

  return (
    <div className="flex flex-col gap-16 pb-20 overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: HERO SECTION                                        */}
      {/* ------------------------------------------------------------- */}
      <section className="relative border-b border-surface-border bg-surface py-16 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Copy & Search Entry */}
            <div className="flex flex-col items-start lg:col-span-7">
              <div className="flex items-center gap-2">
                <Badge variant="primary" icon={Sparkles}>
                  Next-Gen E-Commerce Platform
                </Badge>
                <span className="hidden sm:inline text-xs font-semibold text-muted">
                  • 16,000+ Verified Items
                </span>
              </div>

              <h1 className="text-display mt-4 font-black tracking-tight text-ink">
                Intelligent Discovery,{' '}
                <span className="text-primary">
                  Personalized
                </span>{' '}
                For Your Lifestyle.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Explore a catalogue of verified electronics, fashion, home essentials, and more. Backed by real-time behavioral telemetry and academic AI recommendation models.
              </p>

              {/* Quick Search Entry Input */}
              <form
                onSubmit={handleHeroSearchSubmit}
                className="mt-8 flex w-full max-w-lg items-center rounded-2xl border border-surface-border bg-white p-1.5 shadow-sm hover:border-zinc-400 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10 transition-all"
              >
                <div className="flex items-center pl-3 text-muted">
                  <Search className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  placeholder="Search 16,000+ products (e.g. smartwatch, shoes)..."
                  className="w-full bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-light"
                />
                <Button type="submit" variant="primary" size="md">
                  Search
                </Button>
              </form>

              {/* Popular Tags */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">Popular:</span>
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <Link
                    key={tag.label}
                    to={`/products?q=${encodeURIComponent(tag.query)}`}
                    className="rounded-xl bg-surface-secondary px-2.5 py-1 text-ink-light hover:bg-white hover:text-primary transition-colors border border-surface-border/60"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>

              {/* Primary Call to Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/products" className="btn btn-lg btn-primary shadow-sm hover:shadow">
                  Explore Full Catalogue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/categories" className="btn btn-lg btn-secondary">
                  Browse Departments
                </Link>
              </div>
            </div>

            {/* Right Hero Product Showcase */}
            <div className="lg:col-span-5">
              <div className="card relative overflow-hidden p-6 bg-gradient-to-br from-slate-900 to-ink text-white shadow-cardHover border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Editor's Spotlight
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">PostgreSQL Verified</span>
                </div>

                <div className="mt-6">
                  {featuredLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-48 w-full rounded-xl bg-slate-800" />
                      <div className="h-5 w-3/4 rounded bg-slate-800" />
                      <div className="h-4 w-1/2 rounded bg-slate-800" />
                    </div>
                  ) : featuredProducts.length > 0 ? (
                    <div className="space-y-4">
                      <Link
                        to={`/products/${featuredProducts[0].slug}`}
                        className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex gap-4 items-center">
                          <img
                            src={featuredProducts[0].main_image}
                            alt={featuredProducts[0].name}
                            className="h-20 w-20 rounded-lg object-cover bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-primary-300 uppercase">
                              {featuredProducts[0].brand}
                            </p>
                            <h2 className="text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                              {featuredProducts[0].name}
                            </h2>
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star className="h-3 w-3 fill-amber-400" />
                                {featuredProducts[0].rating || 4.5}
                              </span>
                              <span className="text-slate-400">
                                ({featuredProducts[0].review_count || 120} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {featuredProducts[1] && (
                        <Link
                          to={`/products/${featuredProducts[1].slug}`}
                          className="group block overflow-hidden rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex gap-4 items-center">
                            <img
                              src={featuredProducts[1].main_image}
                              alt={featuredProducts[1].name}
                              className="h-20 w-20 rounded-lg object-cover bg-white"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-primary-300 uppercase">
                                {featuredProducts[1].brand}
                              </p>
                              <h2 className="text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                                {featuredProducts[1].name}
                              </h2>
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  {featuredProducts[1].rating || 4.8}
                                </span>
                                <span className="text-slate-400">
                                  ({featuredProducts[1].review_count || 95} reviews)
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Showcase items loading...</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Fast Full-Text GIN Indexing</span>
                  <Link to="/products" className="text-primary-400 font-semibold hover:underline">
                    View Catalogue →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: TRUST & PLATFORM HIGHLIGHTS                        */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_METRICS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="card flex items-start gap-4 p-5 hover:border-slate-300 transition"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink">{item.title}</h2>
                    <p className="text-caption mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: BROWSE BY DEPARTMENT / CATEGORY                    */}
      {/* ------------------------------------------------------------- */}
      <section id="categories">
        <Container>
          <SectionHeader
            title="Browse by Department"
            subtitle="Curated collections across our 8 standardized taxonomy categories"
            linkText="View All Departments"
            linkTo="/categories"
          />

          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-4 space-y-3 animate-pulse">
                  <div className="h-28 w-full rounded-lg bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <ErrorState description={categoriesError} onRetry={loadCategories} />
          ) : categories.length === 0 ? (
            <EmptyState title="No categories found" description="Categories are currently unpopulated." />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: FEATURED PRODUCT SHOWCASE                          */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container>
          <SectionHeader
            title="Featured Products"
            subtitle="Top-rated catalogue selections based on authentic customer reviews"
            linkText="View All Featured"
            linkTo="/products?sort=featured"
          />

          {featuredLoading ? (
            <ProductSkeleton count={8} />
          ) : featuredError ? (
            <ErrorState description={featuredError} onRetry={loadFeatured} />
          ) : featuredProducts.length === 0 ? (
            <EmptyState title="No featured products" description="No items found in the catalogue." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: POPULAR & TRENDING PICKS                           */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-surface-border bg-surface-secondary/60 py-16">
        <Container>
          <SectionHeader
            title="Popular Picks"
            subtitle="Products with high community review volume and buyer demand"
            linkText="Explore Popular"
            linkTo="/products?sort=popular"
          />

          {popularLoading ? (
            <ProductSkeleton count={4} />
          ) : popularError ? (
            <ErrorState description={popularError} onRetry={loadPopular} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6: NEW ARRIVALS                                       */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container>
          <SectionHeader
            title="New Arrivals"
            subtitle="Recently added items and verified inventory"
            linkText="View All New Arrivals"
            linkTo="/products?sort=newest"
          />

          {newArrivalsLoading ? (
            <ProductSkeleton count={4} />
          ) : newArrivalsError ? (
            <ErrorState description={newArrivalsError} onRetry={loadNewArrivals} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7: AI RECOMMENDATION ARCHITECTURAL GATEWAY             */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-surface-border bg-surface-secondary/40 py-16">
        <Container>
          <div className="card overflow-hidden border-zinc-800 bg-gradient-to-br from-zinc-950 via-ink to-zinc-900 p-8 sm:p-12 text-white shadow-cardHover">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" icon={Cpu}>
                    Research Pipeline • Phase 5
                  </Badge>
                  <span className="text-xs font-semibold text-slate-400">
                    Telemetry Ingestion Active
                  </span>
                </div>

                <h2 className="text-h1 text-white font-extrabold">
                  Personalized For You (Neural AI Engine)
                </h2>

                <p className="text-sm leading-relaxed text-slate-300">
                  Cartify’s multi-model recommendation engine (combining Neural Collaborative Filtering, CNN Visual Embeddings, Sequential GRU RNN, and Latent Autoencoders) will personalize your feed as your behavioral interaction telemetry accumulates.
                </p>
              </div>

              <div className="shrink-0">
                <Link to="/products?rating=4.5" className="btn btn-md bg-white text-ink hover:bg-slate-100 font-bold shadow">
                  Browse Community Favorites <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Fallback Baseline Showcase: High Community Ratings */}
            <div className="mt-8 border-t border-slate-800 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Community-Rated Baseline Picks:
              </p>
              {communityLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-lg bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {communityPicks.map((item) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.slug}`}
                      className="group flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                    >
                      <img
                        src={item.main_image}
                        alt={item.name}
                        className="h-14 w-14 rounded-lg object-cover bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs text-amber-400 font-semibold mt-0.5">
                          ★ {item.rating || 4.5} Rating
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8: RECENTLY VIEWED PRODUCTS (SESSION HISTORY)          */}
      {/* ------------------------------------------------------------- */}
      {recentProducts.length > 0 && (
        <section>
          <Container>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-h2">Recently Viewed</h2>
                </div>
                <p className="text-body-muted mt-0.5">
                  Products you inspected during this shopping session
                </p>
              </div>

              <button
                onClick={handleClearRecentlyViewed}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-error transition-colors"
                aria-label="Clear recently viewed products"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
