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
    if (res.success) {
      showToast('Proceeding to checkout is coming in Section 4. Item added to cart!', 'info');
    }
  };

  const handleToggleWishlist = async () => {
    await toggleWishlist(productId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">{brand}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{name}</h1>
      </div>

      <div className="flex items-center gap-2">
        <RatingStars rating={Number(rating)} size="md" />
        <span className="text-sm font-medium text-ink">{Number(rating).toFixed(1)}</span>
        <span className="text-sm text-muted">({reviewCount?.toLocaleString('en-IN') || 0} reviews)</span>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-ink">{formatPrice(finalPrice)}</span>
        {isDiscounted && (
          <>
            <span className="text-lg text-muted line-through">{formatPrice(price)}</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {Math.round(discount)}% OFF
            </span>
          </>
        )}
      </div>

      <p className={`text-sm font-medium ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>
        {inStock ? `In stock (${stock} available)` : 'Out of stock'}
      </p>

      <div className="flex items-center gap-2 text-sm text-muted">
        <Store className="h-4 w-4" /> Sold by <span className="font-medium text-ink">{seller}</span>
      </div>

      {inStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">Quantity</span>
          <div className="flex items-center rounded-lg border border-slate-300">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="p-2 text-ink/70 hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              aria-label="Increase quantity"
              className="p-2 text-ink/70 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          variant="primary"
          disabled={!inStock || isAdding || isCartMutating}
          onClick={handleAddToCart}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4" /> {isAdding ? 'Adding...' : 'Add to Cart'}
        </Button>
        <Button
          variant={wishlisted ? 'secondary' : 'secondary'}
          disabled={isWishlistMutating}
          onClick={handleToggleWishlist}
          className={`flex-1 ${wishlisted ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : ''}`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-600 text-red-600' : ''}`} />
          {wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
        </Button>
      </div>

      <Button
        variant="ghost"
        disabled={!inStock || isAdding || isCartMutating}
        onClick={handleBuyNow}
        className="w-full border border-slate-200"
      >
        Buy Now
      </Button>

      <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <span>Cart items are saved persistently to your account.</span>
      </div>
    </div>
  );
}
