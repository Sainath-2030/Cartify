import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronRight, X, Sparkles, Layers } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
import Container from '../components/Container.jsx';
import Badge from '../components/Badge.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { categoryService } from '../services/categoryService.js';
import { productService } from '../services/productService.js';
import { onImageError } from '../utils/image.js';
import { useInteractionTracking } from '../hooks/useInteractionTracking.js';

const FILTER_KEYS = ['brand', 'minPrice', 'maxPrice', 'rating', 'inStock'];

export default function Category() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { track } = useInteractionTracking();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => {
    const f = {};
    FILTER_KEYS.forEach((key) => {
      const val = searchParams.get(key);
      if (val !== null && val !== '') f[key] = val;
    });
    return f;
  }, [searchParams]);

  const sort = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const activeFilterCount = FILTER_KEYS.filter((k) => filters[k]).length;

  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') next.delete(key);
        else next.set(key, value);
      });
      if (!('page' in updates)) next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = () => {
    setSearchParams({});
  };

  const removeSingleFilter = (key) => {
    updateParams({ [key]: undefined });
  };

  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    productService
      .getBrands(slug)
      .then((res) => setBrands(res.data || []))
      .catch(() => {});
  }, [slug]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await categoryService.getProducts(slug, {
        ...filters,
        sort,
        page,
        limit: 12,
      });
      setCategory(res.category);
      setProducts(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      track('category_view', { metadata: { categorySlug: slug } });
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message || 'Unable to load this department right now.');
    } finally {
      setIsLoading(false);
    }
  }, [slug, filters, sort, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchData]);

  if (notFound) {
    return (
      <Container size="storefront" className="py-20">
        <ErrorState
          title="Department not found"
          description="This department taxonomy does not exist or may have been updated."
        />
      </Container>
    );
  }

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. EDITORIAL DEPARTMENT HERO BANNER                           */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-surface-border bg-surface">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-surface-border/80 py-3">
          <Container size="storefront">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3 text-zinc-400" />
              <Link to="/categories" className="hover:text-primary transition-colors">
                Departments
              </Link>
              <ChevronRight className="h-3 w-3 text-zinc-400" />
              <span className="font-semibold text-zinc-900">{category?.name || 'Department'}</span>
            </nav>
          </Container>
        </div>

        {/* Hero Banner with Representative Photography */}
        {category && (
          <div className="relative overflow-hidden bg-zinc-950 text-white">
            <div className="absolute inset-0 z-0">
              <img
                src={category.image}
                onError={onImageError}
                alt={category.name}
                className="h-full w-full object-cover opacity-25 filter grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            </div>

            <Container size="storefront" className="relative z-10 py-12 sm:py-16">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white border border-white/20">
                    Standard Department
                  </span>
                  {category.product_count !== undefined && (
                    <span className="text-xs text-zinc-400 font-semibold">
                      • {Number(category.product_count).toLocaleString('en-IN')} verified items
                    </span>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  {category.name}
                </h1>

                <p className="mt-2.5 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                  {category.description}
                </p>
              </div>
            </Container>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CONTROLS & ACTIVE FILTER PILLS                             */}
      {/* ------------------------------------------------------------- */}
      <Container size="storefront" className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
          <Button
            variant="secondary"
            size="md"
            className="lg:hidden font-bold shadow-xs hover:border-zinc-400"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Active Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {filters.brand && (
              <button
                type="button"
                onClick={() => removeSingleFilter('brand')}
                className="group inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-zinc-800 border border-surface-border hover:border-zinc-400 transition-all"
              >
                <span>Brand: {filters.brand}</span>
                <X className="h-3 w-3 text-zinc-400 group-hover:text-red-600" />
              </button>
            )}

            {(filters.minPrice || filters.maxPrice) && (
              <button
                type="button"
                onClick={() => {
                  updateParams({ minPrice: undefined, maxPrice: undefined });
                }}
                className="group inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-zinc-800 border border-surface-border hover:border-zinc-400 transition-all"
              >
                <span>
                  Price: ₹{filters.minPrice || 0} – ₹{filters.maxPrice || '∞'}
                </span>
                <X className="h-3 w-3 text-zinc-400 group-hover:text-red-600" />
              </button>
            )}

            {filters.rating && (
              <button
                type="button"
                onClick={() => removeSingleFilter('rating')}
                className="group inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-zinc-800 border border-surface-border hover:border-zinc-400 transition-all"
              >
                <span>★ {filters.rating} & up</span>
                <X className="h-3 w-3 text-zinc-400 group-hover:text-red-600" />
              </button>
            )}

            {filters.inStock && (
              <button
                type="button"
                onClick={() => removeSingleFilter('inStock')}
                className="group inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-zinc-800 border border-surface-border hover:border-zinc-400 transition-all"
              >
                <span>In Stock Only</span>
                <X className="h-3 w-3 text-zinc-400 group-hover:text-red-600" />
              </button>
            )}

            {activeFilterCount > 1 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-primary hover:underline ml-1"
              >
                Reset All
              </button>
            )}
          </div>

          <div className="ml-auto">
            <SortDropdown value={sort} onChange={(val) => updateParams({ sort: val })} />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. MAIN DEPARTMENT CATALOGUE LAYOUT                           */}
        {/* ------------------------------------------------------------- */}
        <div className="flex gap-8 pt-8 items-start">
          <FilterSidebar
            categories={categories}
            brands={brands}
            filters={{ ...filters, category: slug }}
            onChange={(updates) => {
              const { category: _ignored, ...rest } = updates;
              updateParams(rest);
            }}
            onClear={clearFilters}
            activeCount={activeFilterCount}
            isMobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
            hideCategoryFilter
          />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              error={error}
              onRetry={fetchData}
              onClearFilters={activeFilterCount > 0 ? clearFilters : undefined}
              emptyTitle="No products match your filters"
              emptyDescription={`Try adjusting or clearing your filters to see more ${category?.name || ''} products.`}
            />

            {!isLoading && pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onChange={(p) => updateParams({ page: p })}
              />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
