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
  Award,
  ArrowUpRight,
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

// Verified, legitimate Cartify Platform Pillars
const TRUST_PILLARS = [
  {
    icon: Database,
    title: 'Certified Pure Catalogue',
    desc: 'Strictly partitioned dataset across 8 standardized departments',
  },
  {
    icon: ShieldCheck,
    title: 'ACID Transaction Engine',
    desc: 'Atomic stock reservations, transactional checkout & price snapshots',
  },
  {
    icon: Layers,
    title: 'Interaction Telemetry',
    desc: 'Real-time client view & search event stream tracking',
  },
  {
    icon: Cpu,
    title: 'Neural Hybrid AI Pipeline',
    desc: 'Multi-model recommendation research foundation (NCF + CNN + GRU)',
  },
];

const POPULAR_SEARCH_SUGGESTIONS = [
  { label: 'Smartwatch', query: 'smartwatch' },
  { label: 'Headphones', query: 'headphones' },
  { label: 'Shoes', query: 'shoes' },
  { label: 'Coffee', query: 'coffee' },
  { label: 'Cookware', query: 'cookware' },
  { label: 'Gaming', query: 'gaming' },
];

export default function Home() {
  const navigate = useNavigate();
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // 1. Shelves state
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');

  const [popularProducts, setPopularProducts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState('');

  const [newArrivals, setNewArrivals] = useState([]);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [newArrivalsError, setNewArrivalsError] = useState('');

  // 2. Categories / Departments
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  // 3. Community Rating Baseline for AI Gateway Section
  const [communityPicks, setCommunityPicks] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  // 4. Recently Viewed Session Products
  const [recentProducts, setRecentProducts] = useState([]);

  // Load Shelves with Cross-Shelf Deduplication
  const loadShelves = async () => {
    setFeaturedLoading(true);
    setPopularLoading(true);
    setNewArrivalsLoading(true);
    setFeaturedError('');
    setPopularError('');
    setNewArrivalsError('');

    try {
      // Step 1: Load Featured Products (sort=featured)
      const featRes = await productService.list({ sort: 'featured', limit: 8 });
      const featList = featRes.data || [];
      setFeaturedProducts(featList);
      setFeaturedLoading(false);

      const usedIds = new Set(featList.map((p) => p.id));
      const usedNames = new Set(featList.map((p) => p.name.toLowerCase().slice(0, 30)));

      // Step 2: Load Popular Picks (Exclude already featured items)
      try {
        const popRes = await productService.list({ sort: 'popular', limit: 16 });
        const popCandidates = (popRes.data || []).filter(
          (p) => !usedIds.has(p.id) && !usedNames.has(p.name.toLowerCase().slice(0, 30))
        );
        const popDistinct = [];
        const popBrands = new Set();
        for (const p of popCandidates) {
          if (!popBrands.has(p.brand) || popDistinct.length < 2) {
            popDistinct.push(p);
            popBrands.add(p.brand);
            usedIds.add(p.id);
            usedNames.add(p.name.toLowerCase().slice(0, 30));
          }
          if (popDistinct.length >= 4) break;
        }
        setPopularProducts(popDistinct.length > 0 ? popDistinct : (popRes.data || []).slice(0, 4));
      } catch (err) {
        setPopularError(err.message || 'Unable to load popular picks.');
      } finally {
        setPopularLoading(false);
      }

      // Step 3: Load New Arrivals (Exclude featured and popular items)
      try {
        const newRes = await productService.list({ sort: 'newest', limit: 16 });
        const newCandidates = (newRes.data || []).filter(
          (p) => !usedIds.has(p.id) && !usedNames.has(p.name.toLowerCase().slice(0, 30))
        );
        const newDistinct = [];
        const newBrands = new Set();
        for (const p of newCandidates) {
          if (!newBrands.has(p.brand) || newDistinct.length < 2) {
            newDistinct.push(p);
            newBrands.add(p.brand);
            usedIds.add(p.id);
          }
          if (newDistinct.length >= 4) break;
        }
        setNewArrivals(newDistinct.length > 0 ? newDistinct : (newRes.data || []).slice(0, 4));
      } catch (err) {
        setNewArrivalsError(err.message || 'Unable to load new arrivals.');
      } finally {
        setNewArrivalsLoading(false);
      }
    } catch (err) {
      setFeaturedError(err.message || 'Unable to load catalogue.');
      setFeaturedLoading(false);
      setPopularLoading(false);
      setNewArrivalsLoading(false);
    }
  };

  // Load Departments (GET /api/categories)
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

  // Load Community Baseline for AI Gateway (sort=rating)
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
    loadShelves();
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
    <div className="flex flex-col gap-16 sm:gap-20 pb-20 overflow-x-hidden bg-surface">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: REDESIGNED EDITORIAL HERO                           */}
      {/* ------------------------------------------------------------- */}
      <section className="relative border-b border-surface-border bg-surface py-12 sm:py-16 lg:py-20">
        <Container size="storefront">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Proportional Typography, Search & Actions */}
            <div className="flex flex-col items-start lg:col-span-7">
              <div className="flex items-center gap-2">
                <Badge variant="primary" icon={Sparkles}>
                  Intelligent Discovery Platform
                </Badge>
                <span className="hidden sm:inline text-xs font-semibold text-zinc-500">
                  • Verified Catalogue
                </span>
              </div>

              {/* Smaller, Proportional Heading */}
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl leading-[1.15]">
                The Modern Catalogue,{' '}
                <span className="text-primary">
                  Curated
                </span>{' '}
                For You.
              </h1>

              <p className="mt-3.5 max-w-lg text-sm sm:text-base leading-relaxed text-zinc-600">
                Discover verified electronics, fashion, home essentials, and lifestyle goods. Backed by real-time behavioral telemetry and academic AI recommendation research.
              </p>

              {/* Prominent Search Form */}
              <form
                onSubmit={handleHeroSearchSubmit}
                className="mt-6 flex w-full max-w-lg items-center rounded-2xl border border-surface-border bg-white p-1.5 shadow-xs hover:border-zinc-400 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10 transition-all"
              >
                <div className="flex items-center pl-3 text-zinc-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  placeholder="Search catalogue (e.g. smartwatch, shoes, coffee)..."
                  className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                <Button type="submit" variant="primary" size="md">
                  Search
                </Button>
              </form>

              {/* Suggested Search Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700 text-[11px]">Suggested:</span>
                {POPULAR_SEARCH_SUGGESTIONS.map((tag) => (
                  <Link
                    key={tag.label}
                    to={`/products?q=${encodeURIComponent(tag.query)}`}
                    className="rounded-lg bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-zinc-800 hover:bg-white hover:text-primary transition-colors border border-surface-border/60"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/products" className="btn btn-md btn-primary shadow-sm hover:shadow">
                  Explore Full Catalogue <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/categories" className="btn btn-md btn-secondary">
                  Browse Departments
                </Link>
              </div>
            </div>

            {/* Right Column: Preserved Carbon Obsidian Spotlight Panel */}
            <div className="lg:col-span-5">
              <div className="card relative overflow-hidden p-5 sm:p-6 bg-zinc-950 text-white shadow-2xl border-zinc-800/80 rounded-3xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Editor's Spotlight
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    Live Catalogue
                  </span>
                </div>

                <div className="mt-5">
                  {featuredLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-32 w-full rounded-2xl bg-zinc-900" />
                      <div className="h-4 w-3/4 rounded bg-zinc-900" />
                      <div className="h-4 w-1/2 rounded bg-zinc-900" />
                    </div>
                  ) : featuredProducts.length > 0 ? (
                    <div className="space-y-3.5">
                      {featuredProducts.slice(0, 2).map((item) => (
                        <Link
                          key={item.id}
                          to={`/products/${item.slug}`}
                          className="group block overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 hover:bg-zinc-900 hover:border-zinc-700 transition-all"
                        >
                          <div className="flex gap-3.5 items-center">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 flex items-center justify-center">
                              <img
                                src={item.main_image}
                                alt={item.name}
                                className="h-full w-full object-contain mix-blend-multiply"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider truncate">
                                {item.brand || 'Verified Item'}
                              </p>
                              <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors">
                                {item.name}
                              </h3>
                              <div className="mt-1 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                                    <Star className="h-3 w-3 fill-amber-400" />
                                    {item.rating || 4.5}
                                  </span>
                                  <span className="text-zinc-500 text-[11px]">
                                    ({item.review_count || 0})
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-white tabular-nums">
                                  ₹{Math.round(item.final_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Showcase items loading...</p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Fast Full-Text Discovery</span>
                  <Link to="/products" className="inline-flex items-center gap-1 text-primary-400 font-semibold hover:underline">
                    <span>View All</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: REDESIGNED EDITORIAL BROWSE BY DEPARTMENT           */}
      {/* ------------------------------------------------------------- */}
      <section id="categories">
        <Container size="storefront">
          <SectionHeader
            title="Browse by Department"
            subtitle="Curated collections across our 8 standardized taxonomy categories"
            linkText="View All Departments"
            linkTo="/categories"
          />

          {categoriesLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-4 space-y-3 animate-pulse">
                  <div className="h-36 w-full rounded-2xl bg-zinc-200" />
                  <div className="h-4 w-1/2 rounded bg-zinc-200" />
                  <div className="h-3 w-3/4 rounded bg-zinc-200" />
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <ErrorState description={categoriesError} onRetry={loadCategories} />
          ) : categories.length === 0 ? (
            <EmptyState title="No departments found" description="Categories are currently unpopulated." />
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
      {/* SECTION 3: FEATURED CURATIONS (TOP RATED REAL PRODUCTS)        */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <SectionHeader
            title="Featured Curations"
            subtitle="Top-rated catalogue selections based on authentic customer reviews"
            linkText="View All Featured"
            linkTo="/products?sort=featured"
          />

          {featuredLoading ? (
            <ProductSkeleton count={8} />
          ) : featuredError ? (
            <ErrorState description={featuredError} onRetry={loadShelves} />
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
      {/* SECTION 4: EDITORIAL AI RECOMMENDATION GATEWAY                 */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-surface-border bg-surface-secondary/40 py-16">
        <Container size="storefront">
          <div className="card overflow-hidden border-zinc-800 bg-zinc-950 p-8 sm:p-12 text-white shadow-2xl rounded-3xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                    Research Foundation • Phase 5
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    Telemetry Stream Ingestion Active
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  Personalized For You (Neural AI Engine)
                </h2>

                <p className="text-sm leading-relaxed text-zinc-300">
                  Cartify is developing a modular hybrid recommendation engine combining Neural Collaborative Filtering (NCF), CNN visual embeddings, sequential GRU RNNs, and latent Autoencoders with attention fusion. As you browse, behavioral telemetry builds your personalized discovery profile.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  to="/products?rating=4.5"
                  className="btn btn-md bg-white text-zinc-950 hover:bg-zinc-100 font-bold shadow-md"
                >
                  Browse Community Favorites <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Baseline Community Favorites (Real High-Rated Items) */}
            <div className="mt-10 border-t border-zinc-800/80 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                Community-Rated Top Picks:
              </p>
              {communityLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {communityPicks.map((item) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.slug}`}
                      className="group flex items-center gap-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-3 hover:bg-zinc-900 hover:border-zinc-700 transition-all"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white p-1 flex items-center justify-center">
                        <img
                          src={item.main_image}
                          alt={item.name}
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      </div>
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
      {/* SECTION 5: POPULAR PICKS (DIVERSE SELECTION)                   */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-surface-border bg-surface-secondary/60 py-16">
        <Container size="storefront">
          <SectionHeader
            title="Popular Picks"
            subtitle="Products with high community review volume and buyer demand"
            linkText="Explore Popular"
            linkTo="/products?sort=popular"
          />

          {popularLoading ? (
            <ProductSkeleton count={4} />
          ) : popularError ? (
            <ErrorState description={popularError} onRetry={loadShelves} />
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
        <Container size="storefront">
          <SectionHeader
            title="New Arrivals"
            subtitle="Recently verified inventory added to the catalogue"
            linkText="View All New Arrivals"
            linkTo="/products?sort=newest"
          />

          {newArrivalsLoading ? (
            <ProductSkeleton count={4} />
          ) : newArrivalsError ? (
            <ErrorState description={newArrivalsError} onRetry={loadShelves} />
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
      {/* SECTION 7: RECENTLY VIEWED (SESSION HISTORY)                   */}
      {/* ------------------------------------------------------------- */}
      {recentProducts.length > 0 && (
        <section>
          <Container size="storefront">
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors"
                aria-label="Clear recently viewed products"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear History</span>
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

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8: PLATFORM PILLARS & TRUST ARCHITECTURE              */}
      {/* ------------------------------------------------------------- */}
      <section className="border-t border-surface-border bg-surface-secondary/30 py-16">
        <Container size="storefront">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-h2">Engineered for Intelligent Commerce</h2>
            <p className="text-body-muted mt-1.5">
              Built with rigorous database guarantees, dataset purity, and a research-grade recommendation foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="card flex items-start gap-4 p-6 hover:border-zinc-400 transition-all duration-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-secondary text-zinc-900 border border-surface-border/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}
