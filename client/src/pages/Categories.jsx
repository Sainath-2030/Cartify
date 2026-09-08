import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import CategoryGrid from '../components/CategoryGrid.jsx';
import Container from '../components/Container.jsx';
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
      <div className="border-b border-border-subtle bg-surface py-6 sm:py-8">
        <Container size="storefront">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-muted">
            <Link to="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-ink-subtle" />
            <span className="font-medium text-ink">Categories</span>
          </nav>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-display text-ink font-bold leading-tight">
              Categories
            </h1>

            <p className="max-w-xl text-xs sm:text-sm text-muted leading-relaxed">
              Explore Cartify’s standardized department taxonomy with verified specifications and ratings.
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
