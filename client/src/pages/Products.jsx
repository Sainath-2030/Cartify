import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
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
      if (val !== null) f[key] = val;
    });
    return f;
  }, [searchParams]);

  const sort = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q');

  const activeFilterCount = FILTER_KEYS.filter((k) => k !== 'q' && filters[k]).length;

  const updateParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    // Any filter/sort change resets pagination back to page 1.
    if (!('page' in updates)) next.delete('page');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (searchQuery) next.set('q', searchQuery);
    setSearchParams(next);
  };

  // Load categories + brands once.
  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    productService.getBrands(filters.category).then((res) => setBrands(res.data)).catch(() => {});
  }, [filters.category]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = { ...filters, sort, page, limit: 12 };
      const res = searchQuery ? await productService.search(params) : await productService.list(params);
      setProducts(res.data);
      setPagination(res.pagination);

      if (searchQuery) {
        track('search', { metadata: { query: searchQuery, resultCount: res.pagination.total } });
      }
    } catch (err) {
      setError(err.message || 'Unable to load products right now.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, sort, page, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">
          {searchQuery ? `Search results for "${searchQuery}"` : 'All Products'}
        </h1>
        <p className="text-sm text-muted">
          {isLoading ? 'Loading products…' : `Showing ${rangeStart}-${rangeEnd} of ${pagination.total} products`}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <Button variant="secondary" className="lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-white">{activeFilterCount}</span>
          )}
        </Button>
        <div className="ml-auto">
          <SortDropdown value={sort} onChange={(val) => updateParams({ sort: val })} />
        </div>
      </div>

      <div className="flex gap-8 pt-6">
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

        <div className="flex-1">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            error={error}
            onRetry={fetchProducts}
            emptyTitle={searchQuery ? `No products found for "${searchQuery}"` : 'No products match your filters'}
            emptyDescription={searchQuery ? 'Try a different search term or browse categories instead.' : 'Try adjusting or clearing your filters.'}
          />
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => updateParams({ page: p })} />
        </div>
      </div>
    </div>
  );
}
