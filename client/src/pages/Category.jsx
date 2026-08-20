import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronRight } from 'lucide-react';
import FilterSidebar from '../components/FilterSidebar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import Button from '../components/Button.jsx';
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
      if (val !== null) f[key] = val;
    });
    return f;
  }, [searchParams]);

  const sort = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const activeFilterCount = FILTER_KEYS.filter((k) => filters[k]).length;

  const updateParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    if (!('page' in updates)) next.delete('page');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    productService.getBrands(slug).then((res) => setBrands(res.data)).catch(() => {});
  }, [slug]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await categoryService.getProducts(slug, { ...filters, sort, page, limit: 12 });
      setCategory(res.category);
      setProducts(res.data);
      setPagination(res.pagination);
      track('category_view', { metadata: { categorySlug: slug } });
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message || 'Unable to load this category right now.');
    } finally {
      setIsLoading(false);
    }
  }, [slug, filters, sort, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (notFound) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Category not found" description="This category doesn't exist or may have been removed." />
      </div>
    );
  }

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex items-center gap-1.5 py-3 text-xs text-muted">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink">{category?.name || '…'}</span>
        </div>

        {category && (
          <div className="relative h-40 overflow-hidden sm:h-52">
            <img src={category.image} onError={onImageError} alt={category.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-center bg-ink/50 px-6">
              <div className="container-page">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{category.name}</h1>
                <p className="mt-1 max-w-lg text-sm text-slate-200">{category.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container-page py-8">
        <p className="mb-4 text-sm text-muted">
          {isLoading ? 'Loading products…' : `Showing ${rangeStart}-${rangeEnd} of ${pagination.total} products`}
        </p>

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
            filters={{ ...filters, category: slug }}
            onChange={(updates) => {
              // Ignore attempts to change category from within a category page —
              // that's what the category list itself and /categories are for.
              const { category: _ignored, ...rest } = updates;
              updateParams(rest);
            }}
            onClear={() => setSearchParams({})}
            activeCount={activeFilterCount}
            isMobileOpen={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
            hideCategoryFilter
          />

          <div className="flex-1">
            <ProductGrid
              products={products}
              isLoading={isLoading}
              error={error}
              onRetry={fetchData}
              emptyTitle="No products match your filters"
              emptyDescription="Try adjusting or clearing your filters."
            />
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => updateParams({ page: p })} />
          </div>
        </div>
      </div>
    </div>
  );
}
