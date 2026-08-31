import { Link } from 'react-router-dom';
import { Heart, PackageX, ShoppingCart } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import { formatPrice } from '../utils/format.js';
import { useInteractionTracking } from '../hooks/useInteractionTracking.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';

export default function ProductCard({ product }) {
  const { track } = useInteractionTracking();
  const { addItem, isMutating: isCartMutating } = useCart();
  const { isWishlisted, toggleWishlist, isMutating: isWishlistMutating } = useWishlist();

  if (!product) return null;

  const {
    id,
    name,
    slug,
    brand,
    price,
    final_price: finalPrice,
    discount_percentage: discount,
    rating,
    review_count: reviewCount,
    main_image: image,
    stock_quantity: stock,
  } = product;

  const isDiscounted = Number(discount) > 0;
  const outOfStock = Number(stock) <= 0;
  const wishlisted = isWishlisted(id);

  const handleClick = () => {
    track('product_click', { productId: id, metadata: { slug, source: 'product_card' } });
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(id);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    track('product_click', { productId: id, metadata: { slug, source: 'quick_add_cart' } });
    await addItem(id, 1, { openDrawer: true });
  };

  return (
    <div className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-cardHover">
      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={isWishlistMutating}
        aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        className={`absolute right-3 top-3 z-10 rounded-full p-2 shadow-sm transition-all ${
          wishlisted
            ? 'bg-white text-red-500 hover:scale-110'
            : 'bg-white/90 text-muted hover:text-red-500 hover:scale-110'
        }`}
      >
        <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {isDiscounted && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
          {Math.round(discount)}% OFF
        </span>
      )}

      <Link to={`/products/${slug}`} onClick={handleClick} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <img
            src={normalizeImageUrl(image)}
            onError={onImageError}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                <PackageX className="h-3.5 w-3.5" /> Out of stock
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{brand}</p>
          <p className="line-clamp-2 text-sm font-medium text-ink">{name}</p>

          <div className="mt-0.5 flex items-center gap-1.5">
            <RatingStars rating={Number(rating)} />
            <span className="text-xs text-muted">({reviewCount?.toLocaleString('en-IN') || 0})</span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-ink">{formatPrice(finalPrice)}</span>
              {isDiscounted && (
                <span className="text-xs text-muted line-through">{formatPrice(price)}</span>
              )}
            </div>

            {!outOfStock && (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isCartMutating}
                aria-label={`Add ${name} to cart`}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
