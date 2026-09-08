import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight, RotateCcw } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
import Container from '../components/Container.jsx';
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

  // Fetch products
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

  const selectedCategoryName = useMemo(() => {
    if (!filters.category) return null;
    const found = categories.find((c) => c.slug === filters.category);
    return found ? found.name : filters.category;
  }, [filters.category, categories]);

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* 1. Header & Breadcrumbs */}
      <div className="border-b border-border-subtle bg-surface py-6 sm:py-8">
        <Container size="storefront">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
            <Link to="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-ink-subtle" />
            <Link to="/products" className="hover:text-ink transition-colors">
              All items
            </Link>
            {selectedCategoryName && (
              <>
                <ChevronRight className="h-3 w-3 text-ink-subtle" />
                <span className="font-medium text-ink">{selectedCategoryName}</span>
              </>
            )}
            {searchQuery && (
              <>
                <ChevronRight className="h-3 w-3 text-ink-subtle" />
                <span className="font-medium text-ink">"{searchQuery}"</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-display text-ink font-bold leading-tight">
                {searchQuery
                  ? `Search: "${searchQuery}"`
                  : selectedCategoryName
                  ? selectedCategoryName
                  : 'All items'}
              </h1>

              <p className="mt-1 text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
                {searchQuery
                  ? `Showing results matching your query across our verified catalogue.`
                  : selectedCategoryName
                  ? `Explore authenticated ${selectedCategoryName} curated with verified specifications.`
                  : 'Browse verified inventory across electronics, luxury fashion, home living, beauty, and books.'}
              </p>
            </div>

            <div className="text-xs text-muted shrink-0 font-medium">
              {isLoading ? (
                <span className="animate-pulse">Loading catalogue…</span>
              ) : (
                <span>
                  Showing <strong className="text-ink">{rangeStart}–{rangeEnd}</strong> of{' '}
                  <strong className="text-ink">{pagination.total.toLocaleString('en-IN')}</strong> items
                </span>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* 2. Filter Pills & Controls */}
      <Container size="storefront" className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <Button
            variant="secondary"
            size="md"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-md bg-accent px-1.5 py-0.2 text-[11px] font-bold text-accent-ink">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Filter Chips according to design.md */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors mr-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset filters</span>
              </button>
            )}

            {filters.category && (
              <span className="pill-chip">
                <span>{selectedCategoryName}</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter('category')}
                  aria-label={`Remove category filter`}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.brand && (
              <span className="pill-chip">
                <span>{filters.brand}</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter('brand')}
                  aria-label={`Remove brand filter`}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(filters.minPrice || filters.maxPrice) && (
              <span className="pill-chip">
                <span>
                  ₹{filters.minPrice || 0} – ₹{filters.maxPrice || '∞'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    updateParams({ minPrice: undefined, maxPrice: undefined });
                  }}
                  aria-label={`Remove price range filter`}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.rating && (
              <span className="pill-chip">
                <span>★ {filters.rating} & up</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter('rating')}
                  aria-label={`Remove rating filter`}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.inStock && (
              <span className="pill-chip">
                <span>In stock</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter('inStock')}
                  aria-label={`Remove stock filter`}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          <div className="ml-auto">
            <SortDropdown value={sort} onChange={(val) => updateParams({ sort: val })} />
          </div>
        </div>

        {/* 3. Catalogue Grid (260px Sidebar + Content) */}
        <div className="flex gap-8 pt-6 items-start">
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
