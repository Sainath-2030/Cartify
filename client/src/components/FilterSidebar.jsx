import { useState, useEffect } from 'react';
import { X, Check, ChevronDown, Filter } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import Button from './Button.jsx';

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle py-4 first:pt-0 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-1 text-sm font-medium text-ink hover:text-accent transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="pt-3">{children}</div>}
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
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-ink">Filters</h2>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-muted hover:text-accent transition-colors"
          >
            Reset all ({activeCount})
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      {!hideCategoryFilter && (
        <FilterSection title="Category">
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => onChange({ category: undefined })}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  !filters.category
                    ? 'bg-card-elevated text-ink font-semibold'
                    : 'text-muted hover:text-ink hover:bg-card-elevated/50'
                }`}
              >
                <span>All categories</span>
              </button>
            </li>
            {categories.map((cat) => {
              const isSelected = filters.category === cat.slug;
              return (
                <li key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => onChange({ category: cat.slug })}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-card-elevated text-ink font-semibold'
                        : 'text-muted hover:text-ink hover:bg-card-elevated/50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span className="text-[11px] text-ink-subtle">
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
              className="mb-2.5 w-full rounded-lg border border-border-subtle bg-card-elevated px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
            />
          )}
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                onClick={() => onChange({ brand: undefined })}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  !filters.brand
                    ? 'bg-card-elevated text-ink font-semibold'
                    : 'text-muted hover:text-ink hover:bg-card-elevated/50'
                }`}
              >
                <span>All brands</span>
                {!filters.brand && <Check className="h-3.5 w-3.5 text-accent" />}
              </button>
            </li>
            {filteredBrands.map((b) => {
              const isSelected = filters.brand === b;
              return (
                <li key={b}>
                  <button
                    type="button"
                    onClick={() => onChange({ brand: isSelected ? undefined : b })}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-card-elevated text-ink font-semibold'
                        : 'text-muted hover:text-ink hover:bg-card-elevated/50'
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {/* 3. Price Range Filter */}
      <FilterSection title="Price (₹)">
        <form onSubmit={handleApplyPrice} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-card-elevated px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
              aria-label="Minimum price in Rupees"
            />
            <span className="text-ink-subtle text-xs">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-card-elevated px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
              aria-label="Maximum price in Rupees"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full justify-center">
            Apply price
          </Button>
        </form>
      </FilterSection>

      {/* 4. Rating Filter */}
      <FilterSection title="Customer rating">
        <ul className="flex flex-col gap-1">
          <li>
            <button
              type="button"
              onClick={() => onChange({ rating: undefined })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                !filters.rating ? 'bg-card-elevated text-ink font-semibold' : 'text-muted hover:text-ink hover:bg-card-elevated/50'
              }`}
            >
              <span>Any rating</span>
              {!filters.rating && <Check className="h-3.5 w-3.5 text-accent" />}
            </button>
          </li>
          {RATING_OPTIONS.map((r) => {
            const isSelected = Number(filters.rating) === r;
            return (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => onChange({ rating: isSelected ? undefined : r })}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected ? 'bg-card-elevated text-ink font-semibold' : 'text-muted hover:text-ink hover:bg-card-elevated/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <RatingStars rating={r} size="sm" />
                    <span>& up</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* 5. In Stock Availability */}
      <FilterSection title="Availability">
        <label className="flex items-center gap-2.5 text-xs font-medium text-ink cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked ? 'true' : undefined })}
            className="h-4 w-4 rounded border-border-subtle bg-card-elevated text-accent focus:ring-accent accent-[#D7FF3D] cursor-pointer"
          />
          <span>In stock items only</span>
        </label>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (260px) */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-border-subtle bg-card p-4">
          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border-subtle bg-card p-5 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3.5 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted" />
                <h3 className="text-sm font-semibold text-ink">Filters</h3>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-card-elevated transition-colors"
                aria-label="Close filter drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {filterContent}

            <div className="mt-5 pt-4 border-t border-border-subtle">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={onCloseMobile}
              >
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
