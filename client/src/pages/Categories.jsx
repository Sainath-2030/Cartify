import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, LayoutGrid } from 'lucide-react';
import CategoryGrid from '../components/CategoryGrid.jsx';
import Container from '../components/Container.jsx';
import Badge from '../components/Badge.jsx';
import { categoryService } from '../services/categoryService.js';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await categoryService.list();
      setCategories(res.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load departments right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* 1. Header & Breadcrumbs */}
      <div className="border-b border-surface-border bg-surface py-8 sm:py-10">
        <Container size="storefront">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-400" />
            <span className="font-semibold text-zinc-900">All Departments</span>
          </nav>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" icon={LayoutGrid}>
                Department Directory
              </Badge>
              <span className="text-xs text-zinc-500 font-semibold">
                • 8 Standardized Categories
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink">
              Browse by Department
            </h1>

            <p className="max-w-xl text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Explore Cartify’s standardized taxonomy departments. Every collection features authenticated inventory, genuine specifications, and verified customer ratings.
            </p>
          </div>
        </Container>
      </div>

      {/* 2. Departments Grid */}
      <Container size="storefront" className="pt-8">
        <CategoryGrid
          categories={categories}
          isLoading={isLoading}
          error={error}
          onRetry={fetchCategories}
        />
      </Container>
    </div>
  );
}
