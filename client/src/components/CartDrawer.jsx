import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, LogIn } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { formatPrice } from '../utils/format.js';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import Button from './Button.jsx';

export default function CartDrawer() {
  const {
    items,
    totalItems,
    subtotal,
    isLoading,
    isMutating,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          className="flex w-screen max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 id="cart-drawer-title" className="text-lg font-bold text-ink">
                Your Shopping Cart
              </h2>
              {isAuthenticated && totalItems > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              onClick={closeCart}
              aria-label="Close cart"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-slate-100 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {!isAuthenticated ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LogIn className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink">Sign in to view your cart</h3>
                <p className="mt-1 max-w-xs text-sm text-muted">
                  Log in to access your saved items and enjoy a seamless shopping experience.
                </p>
                <div className="mt-6 flex w-full flex-col gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      closeCart();
                      navigate('/login');
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      closeCart();
                      navigate('/signup');
                    }}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col gap-4 py-8">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-3 animate-pulse">
                    <div className="h-20 w-20 rounded-lg bg-slate-200" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                      <div className="mt-auto h-4 w-1/4 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-muted">
                  <ShoppingBag className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink">Your cart is empty</h3>
                <p className="mt-1 max-w-xs text-sm text-muted">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => {
                    closeCart();
                    navigate('/products');
                  }}
                >
                  Browse Products <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                    <Link
                      to={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={normalizeImageUrl(item.mainImage || item.image)}
                        onError={onImageError}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted">
                            {item.brand}
                          </p>
                          <Link
                            to={`/products/${item.slug}`}
                            onClick={closeCart}
                            className="line-clamp-1 text-sm font-medium text-ink hover:text-primary"
                          >
                            {item.name}
                          </Link>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          disabled={isMutating}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted transition-colors hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-1 text-xs text-muted">
                        Unit price: <span className="font-medium text-ink">{formatPrice(item.finalPrice)}</span>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-md border border-slate-300 bg-white">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={isMutating}
                            aria-label="Decrease quantity"
                            className="p-1 text-ink/70 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-ink">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={isMutating || item.quantity >= item.stockQuantity}
                            aria-label="Increase quantity"
                            className="p-1 text-ink/70 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-ink">
                          {formatPrice(item.itemSubtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {isAuthenticated && items.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal ({totalItems} items):</span>
                <span className="text-xl font-extrabold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Taxes and delivery simulated at checkout.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <Button variant="primary" onClick={handleCheckoutClick} className="w-full">
                  Proceed to Checkout
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      closeCart();
                      navigate('/cart');
                    }}
                  >
                    View Cart Page
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs text-muted hover:text-red-600"
                    onClick={clearCart}
                    disabled={isMutating}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Protected by Cartify secure session storage</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
