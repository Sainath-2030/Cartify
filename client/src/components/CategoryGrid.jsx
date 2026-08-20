import CategoryCard from './CategoryCard.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { LayoutGrid } from 'lucide-react';

export default function CategoryGrid({ categories, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[2/1] animate-pulse bg-slate-100" />
            <div className="flex flex-col gap-2 p-5">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  if (!categories || categories.length === 0) {
    return <EmptyState icon={LayoutGrid} title="No categories available" />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
