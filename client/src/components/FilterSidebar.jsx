import { useState, useEffect } from 'react';
import { X, Check, Star, RefreshCw, Filter, ArrowRight } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import Button from './Button.jsx';

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterSection({ title, children, defaultOpen = true }) {
  return (
    <div className="border-b border-surface-border py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-zinc-950">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function FilterSidebar({
  categories = [],
  brands = [],
  filters = {},
  onChange,
  onClear,
  activeCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  hideCategoryFilter = false,
}) {
  const [priceMin, setPriceMin] = useState(filters.minPrice ?? '');
  const [priceMax, setPriceMax] = useState(filters.maxPrice ?? '');
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => {
    setPriceMin(filters.minPrice ?? '');
    setPriceMax(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const handleApplyPrice = (e) => {
    e.preventDefault();
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);

    const updates = {};
    if (Number.isFinite(min) && min >= 0) updates.minPrice = min;
    else updates.minPrice = undefined;

    if (Number.isFinite(max) && max > 0) updates.maxPrice = max;
    else updates.maxPrice = undefined;

    onChange(updates);
  };

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  const filterContent = (
    <div className="flex flex-col text-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-700" />
          <h2 className="font-display text-base font-bold text-zinc-950">Filter Catalogue</h2>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-primary hover:underline"
          >
            Clear All ({activeCount})
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      {!hideCategoryFilter && (
        <FilterSection title="Department">
          <ul className="flex flex-col gap-1.5">
            <li>
              <button
                type="button"
                onClick={() => onChange({ category: undefined })}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  !filters.category
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-700 hover:bg-surface-secondary'
                }`}
              >
                <span>All Departments</span>
              </button>
            </li>
            {categories.map((cat) => {
              const isSelected = filters.category === cat.slug;
              return (
                <li key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => onChange({ category: cat.slug })}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-700 hover:bg-surface-secondary'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-500 bg-surface-secondary'
                        }`}
                      >
                        {Number(cat.product_count).toLocaleString('en-IN')}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {/* 2. Brand Filter */}
      {brands.length > 0 && (
        <FilterSection title="Brand">
          {brands.length > 8 && (
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="mb-2.5 w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
            />
          )}
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                onClick={() => onChange({ brand: undefined })}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  !filters.brand
                    ? 'font-bold text-primary bg-surface-secondary'
                    : 'text-zinc-700 hover:bg-surface-secondary'
                }`}
              >
                <span>All Brands</span>
                {!filters.brand && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            </li>
            {filteredBrands.map((b) => {
              const isSelected = filters.brand === b;
              return (
                <li key={b}>
                  <button
                    type="button"
                    onClick={() => onChange({ brand: isSelected ? undefined : b })}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'font-bold text-primary bg-surface-secondary'
                        : 'text-zinc-700 hover:bg-surface-secondary'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {/* 3. Price Range Filter */}
      <FilterSection title="Price Range (₹)">
        <form onSubmit={handleApplyPrice} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white pl-6 pr-2.5 py-1.5 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                aria-label="Minimum price in Rupees"
              />
            </div>
            <span className="text-zinc-400 text-xs font-bold">–</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white pl-6 pr-2.5 py-1.5 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                aria-label="Maximum price in Rupees"
              />
            </div>
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full justify-center">
            Apply Price Range
          </Button>
        </form>
      </FilterSection>

      {/* 4. Rating Filter */}
      <FilterSection title="Minimum Rating">
        <ul className="flex flex-col gap-1.5">
          <li>
            <button
              type="button"
              onClick={() => onChange({ rating: undefined })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                !filters.rating ? 'font-bold text-primary bg-surface-secondary' : 'text-zinc-700 hover:bg-surface-secondary'
              }`}
            >
              <span>Any Rating</span>
              {!filters.rating && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          </li>
          {RATING_OPTIONS.map((r) => {
            const isSelected = Number(filters.rating) === r;
            return (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => onChange({ rating: isSelected ? undefined : r })}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    isSelected ? 'font-bold text-primary bg-surface-secondary' : 'text-zinc-700 hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <RatingStars rating={r} size="sm" />
                    <span>& Up</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* 5. In Stock Availability */}
      <FilterSection title="Availability">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked ? 'true' : undefined })}
            className="h-4 w-4 rounded-md border-surface-border text-zinc-950 focus:ring-zinc-950 focus:ring-offset-0 cursor-pointer"
          />
          <span>In Stock Inventory Only</span>
        </label>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
        <div className="sticky top-24 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-xs">
          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-surface-border bg-surface-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-zinc-800" />
                <h3 className="font-display text-base font-bold text-zinc-950">Filters</h3>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-full p-2 text-zinc-400 hover:text-zinc-900 hover:bg-surface-secondary transition-colors"
                aria-label="Close filter drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {filterContent}

            <div className="mt-6 pt-4 border-t border-surface-border">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-md font-bold"
                onClick={onCloseMobile}
              >
                Show Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
