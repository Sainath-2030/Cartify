import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
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
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to view your cart</h1>
        <p className="mt-2 text-sm text-muted">
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
      <div className="container-page py-20 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-muted">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-2 text-base text-muted">
          You haven't added any products yet. Discover items from our catalogue!
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/products" className="btn-primary">
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
    <div className="container-page py-10">
      {/* Breadcrumb / Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
        <button
          onClick={clearCart}
          disabled={isMutating}
          className="text-xs font-medium text-muted hover:text-red-600"
        >
          Clear Cart
        </button>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">
        Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        {/* Cart Item List */}
        <div className="lg:col-span-2">
          <div className="card divide-y divide-slate-100 p-0 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                {/* Thumbnail */}
                <Link
                  to={`/products/${item.slug}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img
                    src={normalizeImageUrl(item.mainImage || item.image)}
                    alt={item.name}
                    onError={onImageError}
                    className="h-full w-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {item.brand}
                      </p>
                      <Link
                        to={`/products/${item.slug}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        Category: <span className="text-ink">{item.categoryName}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      disabled={isMutating}
                      aria-label="Remove product"
                      className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={isMutating}
                        aria-label="Decrease quantity"
                        className="p-2 text-ink/70 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={isMutating || item.quantity >= item.stockQuantity}
                        aria-label="Increase quantity"
                        className="p-2 text-ink/70 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price summary for item */}
                    <div className="text-right">
                      <p className="text-xs text-muted">
                        {formatPrice(item.finalPrice)} each
                      </p>
                      <p className="text-base font-extrabold text-ink">
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
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-bold text-ink">Order Summary</h2>

            <div className="mt-4 flex flex-col gap-3 border-b border-slate-200 pb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Items Subtotal:</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Estimated Shipping:</span>
                <span className="font-medium text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Taxes:</span>
                <span className="font-medium text-muted">Included</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-base font-extrabold text-ink">
              <span>Total:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <Button
              variant="primary"
              onClick={handleCheckoutClick}
              className="mt-6 w-full py-3"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Safe & Secure Academic E-Commerce Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
