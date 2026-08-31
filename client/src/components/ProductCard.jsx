import { Link } from 'react-router-dom';
import { Heart, PackageX, ShoppingBag, Plus } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';

export default function ProductCard({ product }) {
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

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(id);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    await addItem(id, 1, { openDrawer: true });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card transition-all duration-300 hover:border-zinc-400 hover:shadow-cardHover">
      {/* Top Floating Badges */}
      <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between pointer-events-none">
        {isDiscounted ? (
          <span className="rounded-full bg-zinc-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            -{Math.round(discount)}%
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isWishlistMutating}
          aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          className={`pointer-events-auto rounded-full p-2 shadow-sm transition-all duration-200 ${
            wishlisted
              ? 'bg-white text-red-500 scale-110'
              : 'bg-white/90 text-zinc-400 hover:text-red-500 hover:bg-white hover:scale-110'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <Link to={`/products/${slug}`} className="flex flex-1 flex-col">
        {/* Product Image Frame (4:5 Ratio) */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-secondary/40 p-4 flex items-center justify-center">
          <img
            src={normalizeImageUrl(image)}
            onError={onImageError}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 ease-out-expo group-hover:scale-105"
          />

          {outOfStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-card/85 backdrop-blur-[1px]">
              <span className="flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                <PackageX className="h-3.5 w-3.5" /> Out of stock
              </span>
            </div>
          ) : (
            /* Floating Quick Add Trigger on Hover */
            <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isCartMutating}
                aria-label={`Quick add ${name} to cart`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition-colors"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Quick Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Meta & Pricing */}
        <div className="flex flex-1 flex-col p-4 pt-3.5">
          {brand && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 truncate">
              {brand}
            </p>
          )}

          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-primary transition-colors leading-snug mt-1">
            {name}
          </h3>

          {/* Rating Summary */}
          <div className="mt-2 flex items-center gap-1.5">
            <RatingStars rating={Number(rating)} size="sm" />
            <span className="text-[11px] font-medium text-zinc-500">
              ({reviewCount ? Number(reviewCount).toLocaleString('en-IN') : 0})
            </span>
          </div>

          {/* Price Block */}
          <div className="mt-auto flex items-baseline justify-between pt-3 border-t border-surface-border/60">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-base font-bold text-zinc-950 tabular-nums">
                {formatPrice(finalPrice)}
              </span>
              {isDiscounted && (
                <span className="text-xs text-zinc-400 line-through tabular-nums">
                  {formatPrice(price)}
                </span>
              )}
            </div>

            {/* Mobile-visible Quick Add Icon Button */}
            {!outOfStock && (
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isCartMutating}
                aria-label={`Add ${name} to cart`}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-secondary text-zinc-900 hover:bg-zinc-950 hover:text-white transition-colors sm:hidden"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
