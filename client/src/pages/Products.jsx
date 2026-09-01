import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, Search, RotateCcw, X, Sparkles, ChevronRight } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
import Container from '../components/Container.jsx';
import Badge from '../components/Badge.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';
import { useInteractionTracking } from '../hooks/useInteractionTracking.js';

const FILTER_KEYS = ['category', 'brand', 'minPrice', 'maxPrice', 'rating', 'inStock', 'q'];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { track } = useInteractionTracking();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const searchQuery = searchParams.get('q');

  const activeFilterCount = FILTER_KEYS.filter((k) => k !== 'q' && filters[k]).length;

  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      // Reset page back to 1 on any filter or sort modification
      if (!('page' in updates)) next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (searchQuery) next.set('q', searchQuery);
    setSearchParams(next);
  };

  const removeSingleFilter = (key) => {
    updateParams({ [key]: undefined });
  };

  // Load categories once
  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Load brand list scoped to category if selected
  useEffect(() => {
    productService
      .getBrands(filters.category)
      .then((res) => setBrands(res.data || []))
      .catch(() => {});
  }, [filters.category]);

  // Fetch products via authoritative API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = { ...filters, sort, page, limit: 12 };
      const res = searchQuery
        ? await productService.search(params)
        : await productService.list(params);

      setProducts(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });

      if (searchQuery) {
        track('search', {
          metadata: { query: searchQuery, resultCount: res.pagination?.total || 0 },
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to load products right now.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort, page, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  // Find category name if category filter is active
  const selectedCategoryName = useMemo(() => {
    if (!filters.category) return null;
    const found = categories.find((c) => c.slug === filters.category);
    return found ? found.name : filters.category;
  }, [filters.category, categories]);

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. EDITORIAL HEADER & BREADCRUMBS                             */}
      {/* ------------------------------------------------------------- */}
      <div className="border-b border-surface-border bg-surface py-8 sm:py-10">
        <Container size="storefront">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-400" />
            <Link to="/products" className="hover:text-primary transition-colors">
              Catalogue
            </Link>
            {selectedCategoryName && (
              <>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
                <span className="font-semibold text-zinc-900">{selectedCategoryName}</span>
              </>
            )}
            {searchQuery && (
              <>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
                <span className="font-semibold text-zinc-900">"{searchQuery}"</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" icon={Sparkles}>
                  Verified Catalogue
                </Badge>
                <span className="text-xs text-zinc-500 font-semibold">
                  • 100% Guaranteed Purity
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">
                {searchQuery
                  ? `Search: "${searchQuery}"`
                  : selectedCategoryName
                  ? `${selectedCategoryName} Collection`
                  : 'All Products'}
              </h1>

              <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 max-w-xl leading-relaxed">
                {searchQuery
                  ? `Showing results matching your search terms across our verified departments.`
                  : selectedCategoryName
                  ? `Explore authenticated ${selectedCategoryName} curated with verified specifications and reviews.`
                  : 'Browse verified inventory across electronics, luxury fashion, home living, beauty, and literature.'}
              </p>
            </div>

            <div className="text-xs sm:text-sm text-zinc-500 shrink-0 font-medium">
              {isLoading ? (
                <span className="animate-pulse">Loading catalogue…</span>
              ) : (
                <span>
                  Showing <strong className="text-zinc-900">{rangeStart}–{rangeEnd}</strong> of{' '}
                  <strong className="text-zinc-900">{pagination.total.toLocaleString('en-IN')}</strong> items
                </span>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CATALOGUE CONTROLS & ACTIVE FILTER PILLS                   */}
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
            {filters.category && (
              <button
                type="button"
                onClick={() => removeSingleFilter('category')}
                className="group inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-zinc-800 border border-surface-border hover:border-zinc-400 transition-all"
              >
                <span>Dept: {selectedCategoryName}</span>
                <X className="h-3 w-3 text-zinc-400 group-hover:text-red-600" />
              </button>
            )}

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
        {/* 3. MAIN CATALOGUE LAYOUT (SIDEBAR + GRID)                     */}
        {/* ------------------------------------------------------------- */}
        <div className="flex gap-8 pt-8 items-start">
          <FilterSidebar
            categories={categories}
            brands={brands}
            filters={filters}
            onChange={updateParams}
            onClear={clearFilters}
            activeCount={activeFilterCount}
            isMobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              error={error}
              onRetry={fetchProducts}
              onClearFilters={activeFilterCount > 0 ? clearFilters : undefined}
              emptyTitle={
                searchQuery
                  ? `No products found for "${searchQuery}"`
                  : 'No products match your current filters'
              }
              emptyDescription={
                searchQuery
                  ? 'Try searching with broader terms or clear your active filters to discover items.'
                  : 'Try relaxing your price, brand, or rating filter constraints.'
              }
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
