import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, ArrowRight, Trash2, PackageX } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatPrice } from '../utils/format.js';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import RatingStars from '../components/RatingStars.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';

export default function Wishlist() {
  const {
    items,
    totalItems,
    isLoading,
    isMutating,
    removeItem,
    moveToCart,
    clearWishlist,
  } = useWishlist();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container-page py-16 text-center bg-surface min-h-screen">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card-elevated border border-border-subtle text-accent">
          <Heart className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to view your wishlist</h1>
        <p className="mt-1 text-xs text-muted">
          Your saved favorite products are synchronized across your devices.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/login')}>
            Log In
          </Button>
          <Button variant="secondary" onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loader fullScreen label="Loading your wishlist..." />;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center bg-surface min-h-screen">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border-subtle text-muted">
          <Heart className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Your wishlist is empty</h1>
        <p className="mt-1 text-xs text-muted">
          Explore our catalogue and click the heart icon on any product to save it for later.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/products" className="btn btn-primary">
            Explore products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 bg-surface min-h-screen">
      {/* Top Controls */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to catalogue
        </Link>
        <button
          onClick={clearWishlist}
          disabled={isMutating}
          className="text-xs font-medium text-muted hover:text-error transition-colors"
        >
          Clear wishlist
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          My Wishlist ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h1>
        <p className="mt-0.5 text-xs text-muted">
          Items you've saved for future shopping.
        </p>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const isDiscounted = Number(item.discountPercentage) > 0;
          const outOfStock = Number(item.stockQuantity) <= 0;

          return (
            <div
              key={item.id}
              className="card group relative flex flex-col p-3 rounded-2xl border border-border-subtle hover:border-border-strong transition-colors"
            >
              {/* Remove button */}
              <button
                onClick={() => removeItem(item.productId)}
                disabled={isMutating}
                aria-label="Remove from wishlist"
                className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-1.5 text-muted hover:text-error transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Discount Badge */}
              {isDiscounted && (
                <span className="absolute left-4 top-4 z-10 rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">
                  Sale {Math.round(item.discountPercentage)}%
                </span>
              )}

              {/* Thumbnail */}
              <Link to={`/products/${item.slug}`} className="relative aspect-square overflow-hidden rounded-xl bg-card-elevated p-2 flex items-center justify-center">
                <img
                  src={normalizeImageUrl(item.mainImage || item.image)}
                  alt={item.name}
                  onError={onImageError}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <span className="flex items-center gap-1.5 rounded-lg bg-card-elevated px-2.5 py-1 text-xs font-medium text-error">
                      <PackageX className="h-3.5 w-3.5" /> Out of stock
                    </span>
                  </div>
                )}
              </Link>

              {/* Card Body */}
              <div className="flex flex-1 flex-col pt-3">
                <p className="text-xs font-medium text-muted">{item.brand}</p>
                <Link
                  to={`/products/${item.slug}`}
                  className="line-clamp-2 text-sm font-medium text-ink hover:text-accent transition-colors mt-0.5"
                >
                  {item.name}
                </Link>

                <div className="mt-1 flex items-center gap-1.5">
                  <RatingStars rating={item.rating} />
                  <span className="text-xs text-muted">({item.reviewCount || 0})</span>
                </div>

                <div className="mt-auto pt-3">
                  <div className="flex items-baseline gap-2 pb-2.5">
                    <span className="text-sm font-bold text-ink">{formatPrice(item.finalPrice)}</span>
                    {isDiscounted && (
                      <span className="text-xs text-ink-subtle line-through">{formatPrice(item.price)}</span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    disabled={outOfStock || isMutating}
                    onClick={() => moveToCart(item.productId)}
                    className="w-full text-xs"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Move to Cart
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
