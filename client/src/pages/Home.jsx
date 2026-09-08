import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Star,
  Clock,
  Trash2,
  Truck,
  RotateCcw,
  Lock,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Tag,
  Copy,
  Check,
  Headphones,
  Shirt,
  Utensils,
  Sparkle,
  Dumbbell,
  Gamepad2,
  BookOpen,
  ShoppingBasket,
  Quote,
  Award,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import ProductSkeleton from '../components/ProductSkeleton.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import Container from '../components/Container.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import Button from '../components/Button.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import MarqueeTicker from '../components/MarqueeTicker.jsx';
import FlashDealCard from '../components/FlashDealCard.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';
import { userService } from '../services/userService.js';
import { getRecentlyViewedProducts } from '../utils/recentViews.js';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../hooks/useAuth.js';

const CATEGORY_ICONS = {
  electronics: Headphones,
  fashion: Shirt,
  'home-kitchen': Utensils,
  beauty: Sparkle,
  sports: Dumbbell,
  gaming: Gamepad2,
  books: BookOpen,
  grocery: ShoppingBasket,
};

const HERO_SLIDES = [
  {
    id: 'sneakers',
    tag: 'Exclusive drop • Spring 2026',
    title: 'The next generation of minimalist footwear',
    description:
      'Engineered with responsive cloud cushioning, breathable dual-layer mesh, and iconic dark contours.',
    ctaText: 'Explore sneakers',
    ctaLink: '/products?category=fashion',
    secondaryCtaText: 'View lookbook',
    secondaryCtaLink: '/products',
    discountPill: 'Limited edition drop',
    specs: ['Responsive foam', 'Ultralight fit', '4.9 ★ rating'],
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech',
    tag: 'Studio acoustics & audio',
    title: 'Precision sound & smart audio gear',
    description:
      'Immerse in studio-grade acoustics, hybrid active noise cancellation, and all-day 40-hour wireless battery life.',
    ctaText: 'Shop electronics',
    ctaLink: '/category/electronics',
    secondaryCtaText: 'Compare models',
    secondaryCtaLink: '/products?category=electronics',
    discountPill: 'Up to 35% off',
    specs: ['Lossless 24-bit', 'Hybrid ANC', '40h playtime'],
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'living',
    tag: 'Curated living & kitchen',
    title: 'Artisanal craft for contemporary spaces',
    description:
      'Discover enameled cookware, precision specialty coffee gear, and sleek kitchen tools crafted for intentional living.',
    ctaText: 'Shop kitchen & living',
    ctaLink: '/category/home-kitchen',
    secondaryCtaText: 'Explore essentials',
    secondaryCtaLink: '/products?category=home-kitchen',
    discountPill: 'New season curation',
    specs: ['Cast iron build', 'Chef approved', 'Free shipping'],
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  },
];

const BENTO_COLLECTIONS = [
  {
    title: 'Sneakers & street footwear',
    subtitle: 'High-rebound cushioning & iconic minimalist silhouettes',
    badge: 'Trending drop',
    tag: 'Footwear',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
    link: '/category/fashion',
    colSpan: 'md:col-span-8',
  },
  {
    title: 'Studio acoustics & audio',
    subtitle: 'Lossless audio & active noise cancelling',
    badge: 'Bestseller',
    tag: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    link: '/category/electronics',
    colSpan: 'md:col-span-4',
  },
  {
    title: 'Artisanal home & kitchen',
    subtitle: 'Precision cookware and everyday minimalist living',
    badge: "Editor's pick",
    tag: 'Home & living',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    link: '/category/home-kitchen',
    colSpan: 'md:col-span-4',
  },
  {
    title: 'Everyday essentials & apparel',
    subtitle: 'Breathable organic fabrics & timeless cuts',
    badge: 'New season',
    tag: 'Apparel',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
    link: '/category/fashion',
    colSpan: 'md:col-span-8',
  },
];

const VERIFIED_TESTIMONIALS = [
  {
    id: 1,
    name: 'Aarav Sharma',
    location: 'Mumbai, IN',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Outstanding build quality & rapid dispatch!',
    comment:
      'The packaging was immaculate and the audio gear sounds unbelievable. Definitely my go-to store for curated tech.',
    product: 'AcousticPro Studio Wireless ANC',
  },
  {
    id: 2,
    name: 'Priya Sundaram',
    location: 'Bangalore, IN',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Minimalist aesthetic and supreme comfort.',
    comment:
      'The sneakers are remarkably lightweight with pillow-soft bounce for daily commutes. Seamless checkout experience.',
    product: 'CloudWalk Zero Running Sneakers',
  },
  {
    id: 3,
    name: 'Vikram Malhotra',
    location: 'Delhi, IN',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Authentic products with frictionless support.',
    comment:
      'Customer support answered in 3 minutes when I asked about sizing. 30-day return policy gives complete peace of mind.',
    product: 'Nordic Cast-Iron Dutch Oven',
  },
];

const SHOPPER_TRUST_PILLARS = [
  {
    icon: Truck,
    title: 'Free express dispatch',
    desc: 'On all verified orders above ₹999',
  },
  {
    icon: ShieldCheck,
    title: '100% genuine guarantee',
    desc: 'Directly verified & certified authentic',
  },
  {
    icon: RotateCcw,
    title: '30-day easy returns',
    desc: 'Effortless door-step replacement or refund',
  },
  {
    icon: Lock,
    title: 'Bank-grade security',
    desc: '256-bit encrypted checkout protection',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHoveringHero, setIsHoveringHero] = useState(false);

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');

  const [popularProducts, setPopularProducts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState('');

  const [newArrivals, setNewArrivals] = useState([]);
  const [newArrivalsLoading, setNewArrivalsLoading] = useState(true);
  const [newArrivalsError, setNewArrivalsError] = useState('');

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  const [recentProducts, setRecentProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('trending');
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-advance hero carousel
  useEffect(() => {
    if (isHoveringHero) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHoveringHero]);

  // Load Catalogue Shelves
  const loadShelves = async () => {
    setFeaturedLoading(true);
    setPopularLoading(true);
    setNewArrivalsLoading(true);
    setFeaturedError('');
    setPopularError('');
    setNewArrivalsError('');

    try {
      const featRes = await productService.list({ sort: 'featured', limit: 8 });
      const featList = featRes.data || [];
      setFeaturedProducts(featList);
      setFeaturedLoading(false);

      const usedIds = new Set(featList.map((p) => p.id));

      try {
        const popRes = await productService.list({ sort: 'popular', limit: 12 });
        const popFiltered = (popRes.data || []).filter((p) => !usedIds.has(p.id));
        setPopularProducts(popFiltered.length >= 4 ? popFiltered.slice(0, 8) : popRes.data || []);
      } catch (err) {
        setPopularError(err.message || 'Unable to load trending picks.');
      } finally {
        setPopularLoading(false);
      }

      try {
        const newRes = await productService.list({ sort: 'newest', limit: 12 });
        const newFiltered = (newRes.data || []).filter((p) => !usedIds.has(p.id));
        setNewArrivals(newFiltered.length >= 4 ? newFiltered.slice(0, 8) : newRes.data || []);
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

  // Load Departments
  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const res = await categoryService.list();
      setCategories(res.data || []);
    } catch (err) {
      setCategoriesError(err.message || 'Unable to load categories.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user) {
      setRecommendedProducts([]);
      return;
    }
    try {
      setRecLoading(true);
      const res = await userService.getRecommendations(8);
      setRecommendedProducts(res.data?.recommendations || []);
    } catch (err) {
      console.warn('Could not load homepage recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    loadShelves();
    loadCategories();
    setRecentProducts(getRecentlyViewedProducts());
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const handleClearRecentlyViewed = () => {
    localStorage.removeItem('cartify_recent_products');
    setRecentProducts([]);
    showToast('Browsing history cleared.');
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Code "${code}" copied! 10% discount applied at checkout.`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const activeSlideData = HERO_SLIDES[currentSlide];

  const flashDealItem = useMemo(() => {
    if (featuredProducts && featuredProducts.length > 0) {
      return featuredProducts.find((p) => Number(p.discount_percentage) >= 15) || featuredProducts[0];
    }
    return null;
  }, [featuredProducts]);

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-20 bg-surface">
      {/* ------------------------------------------------------------- */}
      {/* 1. QUICK CATEGORY PILL RAIL (STICKY)                          */}
      {/* ------------------------------------------------------------- */}
      <section className="sticky top-[88px] z-30 border-b border-border-subtle bg-surface/95 backdrop-blur-md py-2.5 transition-all shadow-xs">
        <Container size="storefront">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {categories.slice(0, 8).map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.slug] || Sparkles;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="group flex items-center gap-2 rounded-lg border border-border-subtle bg-card-elevated px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-ink shrink-0"
                >
                  <IconComponent className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. EDITORIAL HERO BILLBOARD                                   */}
      {/* ------------------------------------------------------------- */}
      <section
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
      >
        <Container size="storefront">
          <div className="relative overflow-hidden rounded-2xl bg-card-hero border border-border-subtle p-6 sm:p-10 lg:p-12 transition-all duration-500">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              {/* Left Content Area */}
              <div className="lg:col-span-7 space-y-4">
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold bg-card-soft border border-border-subtle">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-accent font-bold">{activeSlideData.tag}</span>
                  <span className="text-ink-subtle">•</span>
                  <span className="text-muted">{activeSlideData.discountPill}</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-display text-ink font-extrabold leading-tight tracking-tight">
                  {activeSlideData.title}
                </h1>

                <p className="max-w-lg text-xs sm:text-sm leading-relaxed text-muted">
                  {activeSlideData.description}
                </p>

                {/* Specs Highlights */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeSlideData.specs?.map((spec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border-subtle px-2.5 py-1 text-[11px] font-medium text-ink"
                    >
                      <CheckCircle2 className="h-3 w-3 text-accent" />
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Link
                    to={activeSlideData.ctaLink}
                    className="btn btn-primary px-6 py-2.5"
                  >
                    <span>{activeSlideData.ctaText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={activeSlideData.secondaryCtaLink}
                    className="btn btn-secondary px-5 py-2.5"
                  >
                    {activeSlideData.secondaryCtaText}
                  </Link>
                </div>
              </div>

              {/* Right Showcase Image Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-border-subtle bg-card-elevated p-3 flex items-center justify-center group">
                  <img
                    src={activeSlideData.image}
                    alt={activeSlideData.title}
                    className="h-full w-full rounded-lg object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-ink bg-card/90 px-3 py-1.5 rounded-lg border border-border-subtle backdrop-blur-xs">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-accent" />
                      <span className="font-medium text-muted">Curated drop</span>
                    </div>
                    <span className="font-semibold text-accent">★ 4.9 Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Bottom Controls */}
            <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? 'w-6 bg-accent' : 'w-1.5 bg-card-elevated hover:bg-muted'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-card-elevated text-muted hover:text-ink transition-colors border border-border-subtle"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-card-elevated text-muted hover:text-ink transition-colors border border-border-subtle"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. INFINITE MARQUEE TICKER                                    */}
      {/* ------------------------------------------------------------- */}
      <MarqueeTicker />

      {/* ------------------------------------------------------------- */}
      {/* 4. CURATED EDITORIAL BENTO GRID                               */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <SectionHeader
            title="Curated collections"
            subtitle="Explore trendsetting designs across signature lifestyle categories"
            linkText="View all collections"
            linkTo="/categories"
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {BENTO_COLLECTIONS.map((bento) => (
              <Link
                key={bento.title}
                to={bento.link}
                className={`group relative overflow-hidden rounded-2xl bg-card text-ink min-h-[260px] p-6 flex flex-col justify-between border border-border-subtle hover:border-border-strong transition-colors ${bento.colSpan}`}
              >
                <img
                  src={bento.image}
                  alt={bento.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent pointer-events-none" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="rounded-lg bg-card-elevated border border-border-subtle px-2.5 py-1 text-xs font-semibold text-accent">
                    {bento.badge}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {bento.tag}
                  </span>
                </div>

                {/* Bottom Title & Action */}
                <div className="relative z-10 space-y-1.5 pt-10">
                  <h3 className="text-xl sm:text-2xl font-bold text-ink group-hover:text-accent transition-colors">
                    {bento.title}
                  </h3>
                  <p className="text-xs text-muted max-w-md">{bento.subtitle}</p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform">
                    <span>Shop collection</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4.5 AI-POWERED PERSONALIZED RECOMMENDATIONS (NCF)             */}
      {/* ------------------------------------------------------------- */}
      {user && recommendedProducts.length > 0 && (
        <section>
          <Container size="storefront">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 border-b border-border-subtle pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-ink">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                    Recommended for You
                  </h2>
                  <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    AI NeuMF Powered
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  Personalized product affinity predictions calculated for {user.full_name || 'your profile'}.
                </p>
              </div>
              <Link to="/products" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                Explore catalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recLoading ? (
              <ProductSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {recommendedProducts.map((p) => (
                  <div key={p.productId || p.id} className="relative group">
                    <div className="absolute top-3 right-3 z-20 rounded-md bg-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-ink shadow-sm">
                      {p.affinityPercentage ? `${p.affinityPercentage}% Match` : 'Top Pick'}
                    </div>
                    <ProductCard
                      product={{
                        id: p.productId || p.id,
                        name: p.name,
                        brand: p.brand,
                        main_image: p.mainImage || p.main_image,
                        price: p.price,
                        final_price: p.finalPrice || p.final_price || p.price,
                        rating: p.rating,
                        reviews_count: p.reviews_count || 12,
                        category_id: p.categoryId || p.category_id,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. FEATURED DEALS & BEST SELLERS SHELF                        */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <SectionHeader
            title="Bestsellers"
            subtitle="Verified authentic selections rated 4.5+ by thousands of shoppers"
            linkText="View all deals"
            linkTo="/products?sort=featured"
          />

          {featuredLoading ? (
            <ProductSkeleton count={8} />
          ) : featuredError ? (
            <ErrorState description={featuredError} onRetry={loadShelves} />
          ) : featuredProducts.length === 0 ? (
            <EmptyState title="No products found" description="Catalogue is being updated." />
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
      {/* 6. FLASH DEAL SPOTLIGHT                                       */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <FlashDealCard dealProduct={flashDealItem} />
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. DYNAMIC TABBED CATALOGUE EXPLORER                          */}
      {/* ------------------------------------------------------------- */}
      <section className="border-y border-border-subtle bg-surface py-12">
        <Container size="storefront">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink">
                Explore more selections
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Filter catalogue by customer demand and latest arrivals
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border-subtle self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'trending'
                    ? 'bg-accent text-accent-ink font-bold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Trending</span>
              </button>

              <button
                onClick={() => setActiveTab('newest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'newest'
                    ? 'bg-accent text-accent-ink font-bold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>New arrivals</span>
              </button>
            </div>
          </div>

          {activeTab === 'trending' ? (
            popularLoading ? (
              <ProductSkeleton count={8} />
            ) : popularError ? (
              <ErrorState description={popularError} onRetry={loadShelves} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )
          ) : newArrivalsLoading ? (
            <ProductSkeleton count={8} />
          ) : newArrivalsError ? (
            <ErrorState description={newArrivalsError} onRetry={loadShelves} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to={activeTab === 'trending' ? '/products?sort=popular' : '/products?sort=newest'}
              className="btn btn-secondary px-6 py-2.5"
            >
              Browse full {activeTab === 'trending' ? 'trending' : 'new'} collection
            </Link>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. SHOP BY DEPARTMENT GRID                                    */}
      {/* ------------------------------------------------------------- */}
      <section id="categories">
        <Container size="storefront">
          <SectionHeader
            title="Shop by department"
            subtitle="Explore our comprehensive standardized catalogue"
            linkText="All departments"
            linkTo="/categories"
          />

          {categoriesLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-4 space-y-3 animate-pulse">
                  <div className="h-36 w-full rounded-xl bg-card-elevated" />
                  <div className="h-4 w-1/2 rounded bg-card-elevated" />
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <ErrorState description={categoriesError} onRetry={loadCategories} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. VERIFIED CUSTOMER REVIEWS                                  */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <SectionHeader
            title="Trusted by shoppers"
            subtitle="Real reviews from verified customers who shop with Cartify"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VERIFIED_TESTIMONIALS.map((review) => (
              <div
                key={review.id}
                className="relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-card p-5 transition-colors hover:border-border-strong"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                    <Quote className="h-5 w-5 text-border-subtle" />
                  </div>

                  <h4 className="text-sm font-semibold text-ink">
                    "{review.title}"
                  </h4>

                  <p className="text-xs text-muted leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="h-8 w-8 rounded-full object-cover border border-border-subtle"
                  />
                  <div>
                    <h5 className="text-xs font-semibold text-ink">{review.name}</h5>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted">
                      <span className="text-accent font-medium">{review.role}</span>
                      <span>•</span>
                      <span>{review.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. PROMO CODE BANNER                                         */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <div className="relative overflow-hidden rounded-2xl bg-card p-6 sm:p-8 text-ink flex flex-col md:flex-row items-center justify-between gap-6 border border-border-subtle">
            <div className="space-y-1.5 max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-card-elevated px-2.5 py-0.5 text-xs font-semibold text-accent border border-border-subtle">
                <Tag className="h-3.5 w-3.5" /> Welcome privilege
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-ink">
                Get 10% off your first order
              </h3>
              <p className="text-xs text-muted">
                Use code <span className="font-semibold text-ink">WELCOME10</span> at checkout on any order over ₹999.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-card-elevated border border-border-subtle px-3 py-2">
                <span className="text-xs text-muted">CODE:</span>
                <span className="font-mono text-sm font-bold text-accent tracking-wider">
                  WELCOME10
                </span>
                <button
                  onClick={() => handleCopyCode('WELCOME10')}
                  aria-label="Copy discount code"
                  className="ml-1 rounded-md bg-card p-1 text-muted hover:text-ink transition-colors"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <Link
                to="/products"
                className="btn btn-primary px-5 py-2"
              >
                Shop now
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. RECENTLY VIEWED PRODUCTS                                  */}
      {/* ------------------------------------------------------------- */}
      {recentProducts.length > 0 && (
        <section>
          <Container size="storefront">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <h2 className="text-lg font-bold text-ink">
                    Recently viewed
                  </h2>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Products you inspected during this active session
                </p>
              </div>

              <button
                onClick={handleClearRecentlyViewed}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-card px-2.5 py-1 text-xs font-medium text-muted hover:text-error hover:border-error/30 transition-colors"
                aria-label="Clear recently viewed products"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear history</span>
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
      {/* 12. SHOPPER TRUST PILLARS                                     */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl border border-border-subtle bg-card p-5">
            {SHOPPER_TRUST_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3 p-1.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card-elevated text-accent border border-border-subtle">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-ink">{item.title}</h3>
                    <p className="text-[11px] text-muted mt-0.5 leading-tight">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 13. NEWSLETTER VIP CLUB                                       */}
      {/* ------------------------------------------------------------- */}
      <section>
        <Container size="storefront">
          <div className="rounded-2xl border border-border-subtle bg-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-card-elevated border border-border-subtle px-2.5 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" /> VIP drop access
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-ink mt-2.5">
              Join the Cartify collective
            </h3>
            <p className="mt-1.5 text-xs text-muted max-w-sm mx-auto">
              Subscribe to get early notifications, secret promo vouchers, and curated seasonal style edits.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Thank you for subscribing to Cartify updates!');
              }}
              className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                className="input-field"
              />
              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
        </Container>
      </section>
    </div>
  );
}
