import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  MapPin,
  AlertCircle,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { orderService } from '../services/orderService.js';
import { formatPrice } from '../utils/format.js';
import { onImageError, normalizeImageUrl } from '../utils/image.js';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalItems, subtotal, isLoading: isCartLoading, refreshCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  });

  // Valid backend payment methods: 'COD', 'SIMULATED_GATEWAY', 'DEMO', 'CARD', 'UPI'
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [formErrors, setFormErrors] = useState({});

  // Sync user name when user loads
  useEffect(() => {
    if (user?.fullName && !formData.fullName) {
      setFormData((prev) => ({ ...prev, fullName: user.fullName }));
    }
  }, [user]);

  // Load server-side checkout preview
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function loadPreview() {
      setIsPreviewLoading(true);
      try {
        const previewData = await orderService.previewCheckout();
        if (isMounted) setPreview(previewData);
      } catch (err) {
        if (isMounted) {
          console.warn('Checkout preview load notice:', err.message);
        }
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    }

    loadPreview();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, items]);

  // Redirect unauthenticated user
  if (!isAuthenticated) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to checkout</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to complete your purchase and save your order history.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/login', { state: { from: location } })}
          >
            Log In
          </Button>
          <Button variant="secondary" onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  // Confirmation View upon successful order creation
  if (completedOrder) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Order Confirmed
          </span>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-base text-muted">
            Your simulated order has been placed successfully and processed in our database.
          </p>

          {/* Order Details Card */}
          <div className="card mt-8 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-muted">Order ID</p>
                <p className="text-lg font-bold text-ink">#{completedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Status</p>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {completedOrder.status || 'PENDING'}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted">Total Amount</p>
                <p className="text-lg font-extrabold text-primary">
                  {formatPrice(completedOrder.totalAmount)}
                </p>
              </div>
            </div>

            {/* Items Summary */}
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-ink">Purchased Items</h2>
              <div className="mt-3 divide-y divide-slate-100">
                {completedOrder.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      {item.mainImage && (
                        <img
                          src={normalizeImageUrl(item.mainImage)}
                          alt={item.name}
                          onError={onImageError}
                          className="h-10 w-10 rounded-md object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <p className="font-medium text-ink line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted">
                          Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-ink">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address Summary */}
            {completedOrder.shippingAddress && (
              <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-muted">
                <p className="font-semibold text-ink">Delivering To:</p>
                <p className="mt-1">
                  {completedOrder.shippingAddress.fullName} • {completedOrder.shippingAddress.phone}
                </p>
                <p>
                  {completedOrder.shippingAddress.addressLine1}
                  {completedOrder.shippingAddress.addressLine2 ? `, ${completedOrder.shippingAddress.addressLine2}` : ''}
                </p>
                <p>
                  {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.postalCode}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button variant="primary" onClick={() => navigate('/profile')}>
              <Package className="h-4 w-4" /> View in Order History
            </Button>
            <Button variant="secondary" onClick={() => navigate('/products')}>
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isCartLoading || isPreviewLoading) {
    return <Loader fullScreen label="Preparing your checkout..." />;
  }

  // Empty cart state
  if (!items || items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-muted">
          <ShoppingBag className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-2 text-base text-muted">
          Add some products to your cart before proceeding to checkout.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/products" className="btn-primary">
            Browse Catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const name = formData.fullName.trim();
    const address = formData.addressLine1.trim();
    const city = formData.city.trim();
    const state = formData.state.trim();
    const postalCode = formData.postalCode.trim().replace(/\s/g, '');
    const phone = formData.phone.trim();

    if (!name || name.length < 2) {
      errors.fullName = 'Recipient full name is required (min 2 characters).';
    }
    if (!address || address.length < 5) {
      errors.addressLine1 = 'Street address is required (min 5 characters).';
    }
    if (!city || city.length < 2) {
      errors.city = 'City is required.';
    }
    if (!state || state.length < 2) {
      errors.state = 'State/Province is required.';
    }
    if (!postalCode || !/^\d{5,6}(-\d{4})?$/.test(postalCode)) {
      errors.postalCode = 'A valid 5 or 6 digit postal code is required.';
    }
    if (!phone || phone.length < 8) {
      errors.phone = 'Valid phone number is required (min 8 digits).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the highlighted errors in the delivery address.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder({
        shippingAddress: {
          fullName: formData.fullName.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || null,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          phone: formData.phone.trim() || null,
        },
        paymentMethod,
      });

      // Clear frontend cart state to sync with cleared PostgreSQL cart
      await refreshCart();

      setCompletedOrder(order);
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      if (err.status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
        navigate('/login', { state: { from: location } });
      } else if (err.status === 422 && err.fieldErrors) {
        const normalized = {};
        for (const [key, msg] of Object.entries(err.fieldErrors)) {
          const cleanKey = key.replace(/^shippingAddress\./, '');
          normalized[cleanKey] = msg;
        }
        setFormErrors(normalized);
        showToast(err.message || 'Please correct the delivery details.', 'error');
      } else if (err.status === 409) {
        showToast(err.message || 'One or more items in your cart exceeded available stock.', 'error');
      } else {
        showToast(err.message || 'Failed to place order. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayTotal = preview?.totalAmount !== undefined ? preview.totalAmount : subtotal;

  return (
    <div className="container-page py-10">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Cart
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Secure Checkout
        </span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        {/* Left Column: Shipping Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address Section */}
          <section className="card p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">1. Delivery Address</h2>
            </div>

            <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      formErrors.fullName ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210"
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      formErrors.phone ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Street Address (Line 1) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="House number, building name, street"
                  className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/20 ${
                    formErrors.addressLine1 ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                  }`}
                />
                {formErrors.addressLine1 && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.addressLine1}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">
                  Apartment, Suite, Landmark (Line 2) <span className="text-muted">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Apartment, unit, floor, landmark"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-ink">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Vellore"
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      formErrors.city ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Tamil Nadu"
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      formErrors.state ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                    }`}
                  />
                  {formErrors.state && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">
                    Postal / PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="e.g. 632014"
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/20 ${
                      formErrors.postalCode ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary'
                    }`}
                  />
                  {formErrors.postalCode && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </form>
          </section>

          {/* Payment Method Section */}
          <section className="card p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">2. Payment Method</h2>
            </div>

            <div className="mt-6 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">
                      Demo / Prototype Cash on Delivery (COD)
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Active Demo
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Instant order simulation. No credit card or actual payment gateway transaction required.
                  </p>
                </div>
              </label>

              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${
                paymentMethod === 'SIMULATED_GATEWAY' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="paymentOption"
                  value="SIMULATED_GATEWAY"
                  checked={paymentMethod === 'SIMULATED_GATEWAY'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">
                      Demo / Prototype Digital Payment Simulation
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-muted">
                      Sandbox
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Simulates instant pre-authorized digital checkout for academic evaluation.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Academic Prototype Notice:</strong> Real payment gateways (Razorpay, Stripe) will be integrated in future phases. Orders placed here simulate real database inventory transactions.
              </span>
            </div>
          </section>
        </div>

        {/* Right Column: Order Items Summary & Confirmation Button */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-bold text-ink">Order Items ({totalItems})</h2>

            {/* Compact Product List */}
            <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <img
                    src={normalizeImageUrl(item.mainImage || item.image)}
                    alt={item.name}
                    onError={onImageError}
                    className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                    <p className="text-xs text-muted">
                      Qty: {item.quantity} × {formatPrice(item.finalPrice)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-ink shrink-0">
                    {formatPrice(item.itemSubtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-4 border-t border-slate-200 pt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Items Subtotal:</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery:</span>
                <span className="font-medium text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Taxes & Packaging:</span>
                <span className="font-medium text-muted">Included</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 flex justify-between text-base font-extrabold text-ink">
              <span>Grand Total:</span>
              <span className="text-primary text-xl">{formatPrice(displayTotal)}</span>
            </div>

            <Button
              variant="primary"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="mt-6 w-full py-3 text-base shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? 'Processing Transaction...' : `Place Order • ${formatPrice(displayTotal)}`}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted text-center">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>ACID-compliant order transaction protected by Cartify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
