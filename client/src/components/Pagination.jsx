import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageList(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pageList = getPageList(page, totalPages);

  return (
    <nav
      aria-label="Catalogue Pagination"
      className="mt-12 flex items-center justify-center gap-1.5 pt-6 border-t border-surface-border"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-10 items-center gap-1 rounded-xl border border-surface-border bg-surface-card px-3 text-xs sm:text-sm font-semibold text-zinc-800 shadow-xs hover:bg-surface-secondary hover:border-zinc-400 disabled:opacity-40 disabled:pointer-events-none transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1 mx-1">
        {pageList.map((p, i) => {
          const prev = pageList[i - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          const isActive = p === page;

          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-1 text-xs text-zinc-400 select-none">…</span>
              )}
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`h-10 min-w-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'border border-surface-border bg-surface-card text-zinc-800 hover:bg-surface-secondary hover:border-zinc-400'
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex h-10 items-center gap-1 rounded-xl border border-surface-border bg-surface-card px-3 text-xs sm:text-sm font-semibold text-zinc-800 shadow-xs hover:bg-surface-secondary hover:border-zinc-400 disabled:opacity-40 disabled:pointer-events-none transition-all"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
