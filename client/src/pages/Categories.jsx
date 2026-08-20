import { useEffect, useState, useCallback } from 'react';
import CategoryGrid from '../components/CategoryGrid.jsx';
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
      setCategories(res.data);
    } catch (err) {
      setError(err.message || 'Unable to load categories right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Shop by Category</h1>
        <p className="text-sm text-muted">Browse Cartify's full range of categories.</p>
      </div>
      <CategoryGrid categories={categories} isLoading={isLoading} error={error} onRetry={fetchCategories} />
    </div>
  );
}
