import { Link } from 'react-router-dom';
import { Heart, PackageX } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import { onImageError } from '../utils/image.js';
import { formatPrice } from '../utils/format.js';
import { useInteractionTracking } from '../hooks/useInteractionTracking.js';

export default function ProductCard({ product }) {
  const { track } = useInteractionTracking();

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

  const handleClick = () => {
    track('product_click', { productId: id, metadata: { slug, source: 'product_card' } });
  };

  return (
    <div className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-cardHover">
      <button
        aria-label="Add to wishlist"
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-muted shadow-sm transition-colors hover:text-primary"
      >
        <Heart className="h-4 w-4" />
      </button>

      {isDiscounted && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
          {Math.round(discount)}% OFF
        </span>
      )}

      <Link to={`/products/${slug}`} onClick={handleClick} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <img
            src={image}
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

          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-sm font-semibold text-ink">{formatPrice(finalPrice)}</span>
            {isDiscounted && (
              <span className="text-xs text-muted line-through">{formatPrice(price)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
