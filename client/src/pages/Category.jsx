import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronRight, X, RotateCcw } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
import Container from '../components/Container.jsx';
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
          description={`The department "${slug}" does not exist in our standardized catalog.`}
          onBack={() => window.history.back()}
        />
      </Container>
    );
  }

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* 1. Category Editorial Header */}
      <div className="border-b border-border-subtle bg-surface py-6 sm:py-8">
        <Container size="storefront">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
            <Link to="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-ink-subtle" />
            <Link to="/categories" className="hover:text-ink transition-colors">
              Categories
            </Link>
            <ChevronRight className="h-3 w-3 text-ink-subtle" />
            <span className="font-medium text-ink">{category?.name || slug}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-display text-ink font-bold leading-tight">
                {category?.name || 'Department'}
              </h1>
              {category?.description && (
                <p className="mt-1 text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
                  {category.description}
                </p>
              )}
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

      {/* 2. Controls & Filter Pills */}
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

          {/* Active Filter Chips */}
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

            {filters.brand && (
              <span className="pill-chip">
                <span>{filters.brand}</span>
                <button
                  type="button"
                  onClick={() => removeSingleFilter('brand')}
                  aria-label="Remove brand filter"
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
                  aria-label="Remove price filter"
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
                  aria-label="Remove rating filter"
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
                  aria-label="Remove stock filter"
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

        {/* 3. Layout with 260px Filter Sidebar */}
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
            hideCategoryFilter={true}
          />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              error={error}
              onRetry={fetchData}
              onClearFilters={activeFilterCount > 0 ? clearFilters : undefined}
              emptyTitle={`No items found in ${category?.name || slug}`}
              emptyDescription="Try relaxing your price, brand, or rating filter constraints."
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
