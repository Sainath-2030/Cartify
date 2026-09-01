import ProductCard from './ProductCard.jsx';
import ProductSkeleton from './ProductSkeleton.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import Button from './Button.jsx';
import { PackageSearch, RotateCcw } from 'lucide-react';

export default function ProductGrid({
  products = [],
  isLoading = false,
  error = '',
  onRetry,
  onClearFilters,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or search terms.',
}) {
  if (isLoading) {
    return <ProductSkeleton count={12} />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-surface-border bg-surface-card p-12 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-zinc-400 mb-4 border border-surface-border">
          <PackageSearch className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-zinc-950">{emptyTitle}</h3>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-zinc-500 leading-relaxed">
          {emptyDescription}
        </p>

        {onClearFilters && (
          <div className="mt-6">
            <Button
              variant="secondary"
              size="md"
              onClick={onClearFilters}
              className="font-bold shadow-xs hover:border-zinc-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear All Filters</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
