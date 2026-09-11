import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShoppingBag, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../hooks/useCart.js';

export default function FlashDealCard({ dealProduct }) {
  const { addItem, isMutating } = useCart();

  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const product = dealProduct || {
    id: 101,
    name: 'AcousticPro Studio Wireless Noise-Cancelling Headphones',
    slug: 'acousticpro-studio-wireless-headphones',
    brand: 'AcousticPro',
    price: 14999,
    final_price: 9999,
    discount_percentage: 33,
    rating: 4.9,
    review_count: 842,
    main_image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    stock_quantity: 6,
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (product?.id) {
      await addItem(product.id, 1, { openDrawer: true });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border-subtle p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Product Media Preview */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-card-elevated border border-border-subtle p-6 flex items-center justify-center group">
            {/* Top Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink">
                Deal of the Day
              </span>
            </div>

            <img
              src={product.main_image}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs bg-card/90 px-3 py-1.5 rounded-lg border border-border-subtle">
              <span className="font-medium text-muted">{product.brand || 'AcousticPro'}</span>
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Star className="h-3 w-3 fill-accent text-accent" /> {product.rating || '4.9'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Deal Details & Live Countdown */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-accent">
                Limited flash drop
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-success" /> Verified manufacturer warranty
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-ink leading-snug">
              {product.name}
            </h2>
          </div>

          {/* Pricing & Discount */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-ink">
              {formatPrice(product.final_price || product.price)}
            </span>
            {product.discount_percentage > 0 && (
              <>
                <span className="text-sm text-ink-subtle line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">
                  Save {Math.round(product.discount_percentage)}%
                </span>
              </>
            )}
          </div>

          {/* Live Countdown Timer */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Clock className="h-3.5 w-3.5 text-muted" />
              <span>Offer ends in:</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center justify-center rounded-lg bg-card-elevated border border-border-subtle px-3 py-1.5 min-w-[48px]">
                <span className="font-mono text-base font-bold text-ink">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-medium text-muted">Hrs</span>
              </div>
              <span className="text-muted font-bold">:</span>

              <div className="flex flex-col items-center justify-center rounded-lg bg-card-elevated border border-border-subtle px-3 py-1.5 min-w-[48px]">
                <span className="font-mono text-base font-bold text-ink">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-medium text-muted">Mins</span>
              </div>
              <span className="text-muted font-bold">:</span>

              <div className="flex flex-col items-center justify-center rounded-lg bg-card-elevated border border-border-subtle px-3 py-1.5 min-w-[48px]">
                <span className="font-mono text-base font-bold text-accent">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-medium text-muted">Secs</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isMutating}
              className="btn btn-primary px-6 py-2.5"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Claim deal & add to cart</span>
            </button>

            <Link
              to={`/products/${product.slug || ''}`}
              className="btn btn-secondary px-5 py-2.5"
            >
              <span>View specs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
