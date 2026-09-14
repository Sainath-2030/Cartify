import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
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
  const [similarProducts, setSimilarProducts] = useState([]);
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

      // Fetch visually similar items using CNN ResNet-18 embeddings
      try {
        const simRes = await productService.getSimilar(res.data.id, 4);
        setSimilarProducts(simRes.data?.similarProducts || (Array.isArray(simRes.data) ? simRes.data : []));
      } catch (simErr) {
        console.warn('Could not load visually similar products:', simErr);
      }
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

      {/* ------------------------------------------------------------- */}
      {/* AI VISUALLY SIMILAR SELECTIONS (CNN RESNET-18)                */}
      {/* ------------------------------------------------------------- */}
      {similarProducts.length > 0 && (
        <div className="mt-12 border-t border-border-subtle pt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-ink">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink">
                  Visually Similar Selections
                </h2>
                <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                  CNN ResNet-18 Visual AI
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Products sharing visual silhouettes, color harmonics, and textures with this item.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similarProducts.map((p) => (
              <div key={p.productId || p.id} className="relative group">
                {(p.similarityPercentage || p.score) && (
                  <div className="absolute top-3 right-3 z-20 rounded-md bg-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-ink shadow-sm">
                    {Math.round(p.similarityPercentage || (p.score * 100))}% Match
                  </div>
                )}
                <ProductCard
                  product={{
                    id: p.productId || p.id,
                    name: p.name,
                    slug: p.slug,
                    brand: p.brand,
                    main_image: p.mainImage || p.main_image,
                    price: p.price,
                    final_price: p.finalPrice || p.final_price || p.price,
                    rating: p.rating || 4.5,
                    category_id: p.categoryId || p.category_id,
                    stock_quantity: p.stock_quantity ?? 10,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
