import { useState } from 'react';
import { Heart, ShoppingCart, Minus, Plus, ShieldCheck, Store } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import Button from './Button.jsx';
import { formatPrice } from '../utils/format.js';
import { useToast } from '../hooks/useToast.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';

export default function ProductInfo({ product }) {
  const { showToast } = useToast();
  const { addItem, isMutating: isCartMutating } = useCart();
  const { isWishlisted, toggleWishlist, isMutating: isWishlistMutating } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const {
    id: productId,
    name, brand, rating, review_count: reviewCount, price, final_price: finalPrice,
    discount_percentage: discount, stock_quantity: stock, seller_name: seller,
  } = product;

  const isDiscounted = Number(discount) > 0;
  const inStock = Number(stock) > 0;
  const maxQty = Math.min(stock, 10);
  const wishlisted = isWishlisted(productId);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addItem(productId, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    setIsAdding(true);
    const res = await addItem(productId, quantity, { openDrawer: true });
    setIsAdding(false);
  };

  const handleToggleWishlist = async () => {
    await toggleWishlist(productId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        {brand && (
          <p className="text-xs font-medium text-muted">{brand}</p>
        )}
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-ink leading-tight">{name}</h1>
      </div>

      <div className="flex items-center gap-2">
        <RatingStars rating={Number(rating)} size="md" />
        <span className="text-sm font-semibold text-ink">{Number(rating).toFixed(1)}</span>
        <span className="text-xs text-muted">({reviewCount?.toLocaleString('en-IN') || 0} reviews)</span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-ink">{formatPrice(finalPrice)}</span>
        {isDiscounted && (
          <>
            <span className="text-base text-ink-subtle line-through">{formatPrice(price)}</span>
            <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">
              {Math.round(discount)}% OFF
            </span>
          </>
        )}
      </div>

      <p className={`text-xs font-semibold ${inStock ? 'text-success' : 'text-error'}`}>
        {inStock ? `In stock (${stock} available)` : 'Out of stock'}
      </p>

      {seller && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Store className="h-4 w-4 text-muted" /> Sold by <span className="font-medium text-ink">{seller}</span>
        </div>
      )}

      {inStock && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-medium text-muted">Quantity</span>
          <div className="flex items-center rounded-lg border border-border-subtle bg-card-elevated">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="p-2 text-muted hover:text-ink"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-semibold text-ink">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              aria-label="Increase quantity"
              className="p-2 text-muted hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-3 sm:flex-row">
        <Button
          variant="primary"
          disabled={!inStock || isAdding || isCartMutating}
          onClick={handleAddToCart}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4" /> {isAdding ? 'Adding...' : 'Add to Cart'}
        </Button>
        <Button
          variant="secondary"
          disabled={isWishlistMutating}
          onClick={handleToggleWishlist}
          className={`flex-1 ${wishlisted ? 'border-accent text-accent' : ''}`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-accent text-accent' : ''}`} />
          {wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
        </Button>
      </div>

      <Button
        variant="secondary"
        disabled={!inStock || isAdding || isCartMutating}
        onClick={handleBuyNow}
        className="w-full"
      >
        Buy Now
      </Button>

      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border-subtle bg-card p-3 text-xs text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
        <span>Cart items are saved persistently to your account.</span>
      </div>
    </div>
  );
}
