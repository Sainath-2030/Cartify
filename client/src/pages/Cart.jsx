import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatPrice } from '../utils/format.js';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';

export default function Cart() {
  const {
    items,
    totalItems,
    subtotal,
    isLoading,
    isMutating,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container-page py-16 text-center bg-surface min-h-screen">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card-elevated border border-border-subtle text-accent">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to view your cart</h1>
        <p className="mt-1 text-xs text-muted">
          Your shopping cart is saved securely to your account.
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
    return <Loader fullScreen label="Loading your cart..." />;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center bg-surface min-h-screen">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border-subtle text-muted">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-1 text-xs text-muted">
          You haven't added any products yet. Discover items from our catalogue!
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/products" className="btn btn-primary">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  return (
    <div className="container-page py-8 bg-surface min-h-screen">
      {/* Breadcrumb / Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Continue Shopping
        </Link>
        <button
          onClick={clearCart}
          disabled={isMutating}
          className="text-xs font-medium text-muted hover:text-error transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Cart Item List */}
        <div className="lg:col-span-2">
          <div className="card divide-y divide-border-subtle p-0 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* Thumbnail */}
                <Link
                  to={`/products/${item.slug || item.productId || item.id}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-card-elevated p-1 flex items-center justify-center"
                >
                  <img
                    src={normalizeImageUrl(item.mainImage || item.image)}
                    alt={item.name}
                    onError={onImageError}
                    className="h-full w-full object-contain"
                  />
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {item.brand && (
                        <p className="text-xs font-medium text-muted">
                          {item.brand}
                        </p>
                      )}
                      <Link
                        to={`/products/${item.slug || item.productId || item.id}`}
                        className="font-medium text-sm text-ink hover:text-accent transition-colors"
                      >
                        {item.name}
                      </Link>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      disabled={isMutating}
                      aria-label="Remove product"
                      className="rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-error transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center rounded-lg border border-border-subtle bg-card-elevated">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={isMutating}
                        aria-label="Decrease quantity"
                        className="p-1.5 text-muted hover:text-ink disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={isMutating || item.quantity >= item.stockQuantity}
                        aria-label="Increase quantity"
                        className="p-1.5 text-muted hover:text-ink disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Price summary for item */}
                    <div className="text-right">
                      <p className="text-[11px] text-muted">
                        {formatPrice(item.finalPrice)} each
                      </p>
                      <p className="text-sm font-bold text-ink">
                        {formatPrice(item.itemSubtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-5">
            <h2 className="text-base font-bold text-ink">Order Summary</h2>

            <div className="mt-4 flex flex-col gap-2.5 border-b border-border-subtle pb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Items Subtotal:</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Estimated Shipping:</span>
                <span className="font-semibold text-success">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Taxes:</span>
                <span className="font-medium text-ink-subtle">Included</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-sm font-bold text-ink">
              <span>Total:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <Button
              variant="primary"
              onClick={handleCheckoutClick}
              className="mt-5 w-full py-2.5"
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              <span>Safe & Secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
