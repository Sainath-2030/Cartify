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
      className="mt-12 flex items-center justify-center gap-1.5 pt-6 border-t border-border-subtle"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-9 items-center gap-1 rounded-lg border border-border-subtle bg-card px-3 text-xs font-medium text-ink hover:border-border-strong hover:bg-card-elevated disabled:opacity-40 disabled:pointer-events-none transition-colors"
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
                <span className="px-1 text-xs text-ink-subtle select-none">…</span>
              )}
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`h-9 min-w-[36px] rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-ink font-bold'
                    : 'border border-border-subtle bg-card text-muted hover:text-ink hover:border-border-strong hover:bg-card-elevated'
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
        className="flex h-9 items-center gap-1 rounded-lg border border-border-subtle bg-card px-3 text-xs font-medium text-ink hover:border-border-strong hover:bg-card-elevated disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
