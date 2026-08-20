import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import Button from './Button.jsx';

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterSection({ title, children }) {
  return (
    <div className="border-b border-slate-200 py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

export default function FilterSidebar({
  categories = [],
  brands = [],
  filters,
  onChange,
  onClear,
  activeCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  hideCategoryFilter = false,
}) {
  const [priceMin, setPriceMin] = useState(filters.minPrice ?? '');
  const [priceMax, setPriceMax] = useState(filters.maxPrice ?? '');

  useEffect(() => {
    setPriceMin(filters.minPrice ?? '');
    setPriceMax(filters.maxPrice ?? '');
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrice = (e) => {
    e.preventDefault();
    onChange({ minPrice: priceMin || undefined, maxPrice: priceMax || undefined });
  };

  const content = (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-base font-semibold text-ink">Filters</h2>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs font-semibold text-primary hover:underline">
              Clear All ({activeCount})
            </button>
          )}
          {onCloseMobile && (
            <button onClick={onCloseMobile} aria-label="Close filters" className="text-muted hover:text-ink lg:hidden">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {!hideCategoryFilter && (
        <FilterSection title="Category">
          <ul className="flex flex-col gap-2">
            <li>
              <button
                onClick={() => onChange({ category: undefined })}
                className={`text-sm ${!filters.category ? 'font-semibold text-primary' : 'text-ink/80 hover:text-primary'}`}
              >
                All Categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.slug}>
                <button
                  onClick={() => onChange({ category: cat.slug })}
                  className={`text-sm ${filters.category === cat.slug ? 'font-semibold text-primary' : 'text-ink/80 hover:text-primary'}`}
                >
                  {cat.name}
                  {cat.product_count !== undefined && (
                    <span className="ml-1 text-xs text-muted">({cat.product_count})</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title="Brand">
          <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
            <li>
              <button
                onClick={() => onChange({ brand: undefined })}
                className={`text-sm ${!filters.brand ? 'font-semibold text-primary' : 'text-ink/80 hover:text-primary'}`}
              >
                All Brands
              </button>
            </li>
            {brands.map((brand) => (
              <li key={brand}>
                <button
                  onClick={() => onChange({ brand })}
                  className={`text-sm ${filters.brand === brand ? 'font-semibold text-primary' : 'text-ink/80 hover:text-primary'}`}
                >
                  {brand}
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      <FilterSection title="Price Range">
        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="input-field px-2.5 py-1.5 text-sm"
            aria-label="Minimum price"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="input-field px-2.5 py-1.5 text-sm"
            aria-label="Maximum price"
          />
          <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">Go</Button>
        </form>
      </FilterSection>

      <FilterSection title="Rating">
        <ul className="flex flex-col gap-2">
          <li>
            <button
              onClick={() => onChange({ rating: undefined })}
              className={`text-sm ${!filters.rating ? 'font-semibold text-primary' : 'text-ink/80 hover:text-primary'}`}
            >
              All Ratings
            </button>
          </li>
          {RATING_OPTIONS.map((r) => (
            <li key={r}>
              <button
                onClick={() => onChange({ rating: r })}
                className={`flex items-center gap-1.5 text-sm ${Number(filters.rating) === r ? 'font-semibold text-primary' : 'text-ink/80 hover:text-primary'}`}
              >
                <RatingStars rating={r} /> & up
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Availability">
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked ? 'true' : undefined })}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          In stock only
        </label>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onCloseMobile} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-cardHover">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
