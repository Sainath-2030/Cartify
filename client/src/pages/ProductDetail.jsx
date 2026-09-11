import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductGallery from '../components/ProductGallery.jsx';
import ProductInfo from '../components/ProductInfo.jsx';
import ReviewSection from '../components/ReviewSection.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Loader from '../components/Loader.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { productService } from '../services/productService.js';
import { useInteractionTracking } from '../hooks/useInteractionTracking.js';
import { addRecentlyViewedProduct } from '../utils/recentViews.js';

export default function ProductDetail() {
  const { slug } = useParams();
  const { track } = useInteractionTracking();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  const fetchProduct = useCallback(async () => {
    if (!slug || slug === 'undefined') {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await productService.getBySlug(slug);
      setProduct(res.data);
      addRecentlyViewedProduct(res.data);
      track('VIEW', { productId: res.data.id, metadata: { slug, categoryId: res.data.category_id } });
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message || 'Unable to load this product right now.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [fetchProduct]);

  if (isLoading) return <Loader fullScreen label="Loading product…" />;

  if (notFound) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Product not found" description="This product doesn't exist, may be unavailable, or the link is incorrect." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-page py-16">
        <ErrorState description={error} onRetry={fetchProduct} />
      </div>
    );
  }

  const TABS = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'seller', label: 'Seller info' },
    { id: 'reviews', label: `Reviews (${product.review_count || 0})` },
  ];

  return (
    <div className="container-page py-8 bg-surface min-h-screen">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link to="/" className="hover:text-ink transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3 text-ink-subtle" />
        <Link to={`/category/${product.category_slug}`} className="hover:text-ink transition-colors">{product.category_name}</Link>
        <ChevronRight className="h-3 w-3 text-ink-subtle" />
        <span className="text-ink font-medium line-clamp-1">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery mainImage={product.main_image} images={product.images} productName={product.name} />
        <ProductInfo product={product} />
      </div>

      <div className="mt-12">
        <div className="flex gap-6 overflow-x-auto border-b border-border-subtle">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative shrink-0 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <p className="max-w-prose text-xs sm:text-sm leading-relaxed text-muted">{product.description}</p>
          )}

          {activeTab === 'specifications' && (
            <dl className="grid max-w-2xl grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-border-subtle py-2 text-xs">
                  <dt className="text-muted">{key}</dt>
                  <dd className="font-semibold text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {activeTab === 'seller' && (
            <div className="max-w-md rounded-2xl border border-border-subtle bg-card p-5">
              <p className="text-sm font-semibold text-ink">{product.seller_name}</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Ships directly from verified manufacturer or authorised distributor.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewSection
              product={product}
              onRefresh={fetchProduct}
            />
          )}
        </div>
      </div>

      {product.relatedProducts?.length > 0 && (
        <div className="mt-8 border-t border-border-subtle pt-10">
          <h2 className="mb-5 text-lg font-bold text-ink">Related items</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
