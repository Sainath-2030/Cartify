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

export default function ProductDetail() {
  const { slug } = useParams();
  const { track } = useInteractionTracking();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await productService.getBySlug(slug);
      setProduct(res.data);
      track('product_view', { productId: res.data.id, metadata: { slug } });
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
    { id: 'seller', label: 'Seller Info' },
    { id: 'reviews', label: `Reviews (${product.review_count})` },
  ];

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/category/${product.category_slug}`} className="hover:text-primary">{product.category_name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink line-clamp-1">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery mainImage={product.main_image} images={product.images} productName={product.name} />
        <ProductInfo product={product} />
      </div>

      <div className="mt-14">
        <div className="flex gap-6 overflow-x-auto border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <p className="max-w-3xl text-sm leading-relaxed text-ink/80">{product.description}</p>
          )}

          {activeTab === 'specifications' && (
            <dl className="grid max-w-2xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                  <dt className="text-muted">{key}</dt>
                  <dd className="font-medium text-ink">{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {activeTab === 'seller' && (
            <div className="max-w-md rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-ink">{product.seller_name}</p>
              <p className="mt-1 text-sm text-muted">
                Ships directly from this seller. Detailed seller ratings and policies will be available in a future section.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewSection
              rating={product.rating}
              reviewCount={product.review_count}
              breakdown={product.ratingBreakdown}
              reviews={product.reviews}
            />
          )}
        </div>
      </div>

      {product.relatedProducts?.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-10">
          <h2 className="mb-5 text-lg font-semibold text-ink">Related Products</h2>
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
