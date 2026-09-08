import { ChevronDown, ArrowDownUp } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Bestsellers' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
];

export default function SortDropdown({ value = 'featured', onChange }) {
  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="sort-dropdown" className="sr-only">
        Sort catalogue
      </label>
      <div className="pointer-events-none absolute left-3 text-muted">
        <ArrowDownUp className="h-3.5 w-3.5" />
      </div>
      <select
        id="sort-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-border-subtle bg-card-elevated pl-8 pr-8 text-xs font-medium text-ink hover:border-border-strong focus:border-accent focus:outline-none transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-ink">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 text-muted">
        <ChevronDown className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
