export default function ProductSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card animate-pulse"
        >
          {/* 4:5 Ratio Image Placeholder */}
          <div className="aspect-[4/5] w-full bg-surface-secondary/60" />

          {/* Metadata Placeholders */}
          <div className="flex flex-1 flex-col p-4 pt-3.5 space-y-2.5">
            <div className="h-3 w-1/4 rounded bg-surface-secondary" />
            <div className="h-4 w-4/5 rounded bg-surface-secondary" />
            <div className="h-3 w-1/2 rounded bg-surface-secondary" />
            <div className="mt-auto pt-3 border-t border-surface-border/60 flex items-center justify-between">
              <div className="h-5 w-1/3 rounded bg-surface-secondary" />
              <div className="h-7 w-7 rounded-lg bg-surface-secondary sm:hidden" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
