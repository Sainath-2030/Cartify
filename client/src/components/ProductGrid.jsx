import ProductCard from './ProductCard.jsx';
import ProductSkeleton from './ProductSkeleton.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { PackageSearch } from 'lucide-react';

export default function ProductGrid({
  products,
  isLoading,
  error,
  onRetry,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your filters or search terms.',
}) {
  if (isLoading) return <ProductSkeleton count={8} />;

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (!products || products.length === 0) {
    return <EmptyState icon={PackageSearch} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
