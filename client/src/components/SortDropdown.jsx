import { ChevronDown, ArrowDownUp } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured Curations' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Customer Rating' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SortDropdown({ value = 'featured', onChange }) {
  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="sort-dropdown" className="sr-only">
        Sort catalogue
      </label>
      <div className="pointer-events-none absolute left-3 text-zinc-400">
        <ArrowDownUp className="h-3.5 w-3.5" />
      </div>
      <select
        id="sort-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-surface-border bg-surface-card pl-9 pr-9 text-xs sm:text-sm font-semibold text-zinc-900 shadow-xs hover:border-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 transition-all cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 text-zinc-400">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}
