import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, PackageX, Plus, Check } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useInteractionTracking } from '../hooks/useInteractionTracking.js';

export default function ProductCard({ product }) {
  const { addItem, isMutating: isCartMutating } = useCart();
  const { isWishlisted, toggleWishlist, isMutating: isWishlistMutating } = useWishlist();
  const { track } = useInteractionTracking();
  const [justAdded, setJustAdded] = useState(false);

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

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(id);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || isCartMutating) return;
    await addItem(id, 1, { openDrawer: true });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border-subtle bg-card p-3 transition-colors duration-200 hover:border-border-strong">
      {/* Product Image Inset Frame (Aspect Square) */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-card-elevated flex items-center justify-center">
        <img
          src={normalizeImageUrl(image)}
          onError={onImageError}
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top Badges / Wishlist */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between pointer-events-none">
          {isDiscounted ? (
            <span className="rounded-lg bg-highlight px-2 py-0.5 text-xs font-bold text-highlight-ink pointer-events-auto shadow-xs">
              Sale {Math.round(discount)}%
            </span>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isWishlistMutating}
            aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
            className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors border ${
              wishlisted
                ? 'bg-accent text-accent-ink border-accent'
                : 'bg-card/85 text-muted hover:text-ink hover:bg-card border-border-subtle shadow-xs'
            }`}
          >
            <Heart className={`h-4 w-4 ${wishlisted ? 'fill-accent-ink text-accent-ink' : ''}`} />
          </button>
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <span className="flex items-center gap-1.5 rounded-lg bg-card-elevated border border-border-subtle px-2.5 py-1 text-xs font-medium text-danger">
              <PackageX className="h-3.5 w-3.5" /> Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Meta & Info */}
      <Link
        to={`/products/${slug || id}`}
        onClick={() => track('VIEW', { productId: id })}
        className="mt-3 flex flex-1 flex-col"
      >
        {brand && (
          <p className="text-xs font-medium text-muted truncate">
            {brand}
          </p>
        )}

        <h3 className="line-clamp-2 mt-1 text-sm font-medium text-ink group-hover:text-accent transition-colors leading-snug">
          {name}
        </h3>

        {/* Rating Row */}
        <div className="mt-2 flex items-center gap-1.5">
          <RatingStars rating={Number(rating)} size="sm" />
          <span className="text-xs text-muted">
            ({reviewCount ? Number(reviewCount).toLocaleString('en-IN') : 0})
          </span>
        </div>

        {/* Price Row & Quick Add */}
        <div className="mt-auto flex items-baseline justify-between pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-ink tabular-nums">
              {formatPrice(finalPrice)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-ink-subtle line-through tabular-nums">
                {formatPrice(price)}
              </span>
            )}
          </div>

          {!outOfStock && (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isCartMutating}
              aria-label={`Add ${name} to cart`}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-card-elevated border border-border-subtle text-ink hover:border-border-strong hover:bg-accent hover:text-accent-ink transition-colors"
            >
              {justAdded ? <Check className="h-3.5 w-3.5 text-success" /> : <Plus className="h-4 w-4" />}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}
