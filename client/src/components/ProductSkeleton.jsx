export default function ProductSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl border border-border-subtle bg-card p-3 animate-pulse"
        >
          {/* Inset Aspect Square */}
          <div className="aspect-square w-full rounded-xl bg-card-elevated" />

          {/* Metadata Placeholders */}
          <div className="flex flex-1 flex-col pt-3 space-y-2">
            <div className="h-3 w-1/4 rounded bg-card-elevated" />
            <div className="h-4 w-4/5 rounded bg-card-elevated" />
            <div className="h-3 w-1/2 rounded bg-card-elevated" />
            <div className="mt-auto pt-3 flex items-center justify-between">
              <div className="h-5 w-1/3 rounded bg-card-elevated" />
              <div className="h-7 w-7 rounded-lg bg-card-elevated sm:hidden" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
