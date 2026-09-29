import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  PlusCircle,
  Save,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  CheckCircle,
  HelpCircle,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { contentManagerService } from '../../services/contentManagerService.js';
import { useToast } from '../../hooks/useToast.js';

const SAMPLE_PRESETS = [
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' },
  { label: 'Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
  { label: 'Camera', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80' },
];

export default function CMProductNew() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: '',
    brand: 'Cartify Brand',
    categoryId: '',
    subcategory: '',
    sellerName: 'Cartify Verified Seller',
    description: '',
    price: '',
    discountPercentage: '0',
    stockQuantity: '50',
    mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    images: [],
    specifications: [
      { key: 'Color', value: 'Black' },
      { key: 'Warranty', value: '1 Year Manufacturer' },
    ],
  });

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await contentManagerService.listCategories();
        if (res?.data && res.data.length > 0) {
          setCategories(res.data);
          setForm((prev) => ({
            ...prev,
            categoryId: prev.categoryId || String(res.data[0].id),
          }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCats();
  }, []);

  // Real-time calculation of final selling price
  const basePrice = parseFloat(form.price) || 0;
  const discount = Math.min(100, Math.max(0, parseFloat(form.discountPercentage) || 0));
  const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100) * 100) / 100 : basePrice;

  // Selected category object
  const selectedCatObj = categories.find((c) => String(c.id) === String(form.categoryId));

  // Specifications management
  const handleAddSpec = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const handleUpdateSpec = (index, field, val) => {
    setForm((prev) => {
      const next = [...prev.specifications];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, specifications: next };
    });
  };

  const handleRemoveSpec = (index) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  // Additional images management
  const handleAddGalleryUrl = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  };

  const handleUpdateGalleryUrl = (index, val) => {
    setForm((prev) => {
      const next = [...prev.images];
      next[index] = val;
      return { ...prev, images: next };
    });
  };

  const handleRemoveGalleryUrl = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || form.name.trim().length < 2) {
      showToast('Product name must have at least 2 characters.', 'error');
      return;
    }

    if (!form.categoryId) {
      showToast('Please select a valid product category.', 'error');
      return;
    }

    if (!basePrice || basePrice <= 0) {
      showToast('Please specify a positive base price.', 'error');
      return;
    }

    if (!form.mainImage.trim().startsWith('http')) {
      showToast('Please specify a valid main image URL starting with http:// or https://.', 'error');
      return;
    }

    // Convert specifications array into object
    const specsObj = {};
    form.specifications.forEach(({ key, value }) => {
      if (key && key.trim() && value && value.trim()) {
        specsObj[key.trim()] = value.trim();
      }
    });

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || 'Cartify Brand',
      categoryId: parseInt(form.categoryId, 10),
      subcategory: form.subcategory.trim() || null,
      sellerName: form.sellerName.trim() || 'Cartify Verified Seller',
      description: form.description.trim(),
      price: basePrice,
      discountPercentage: discount,
      finalPrice: finalPrice,
      stockQuantity: parseInt(form.stockQuantity, 10) || 50,
      mainImage: form.mainImage.trim(),
      images: form.images.map((u) => u.trim()).filter((u) => u.startsWith('http')),
      specifications: specsObj,
    };

    setSubmitting(true);
    try {
      const res = await contentManagerService.createProduct(payload);
      showToast(`Product "${res.data?.name || form.name}" created successfully!`, 'success');
      navigate('/content-manager/products');
    } catch (err) {
      console.error('Failed to create product:', err);
      showToast(err.message || 'Failed to create product.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to="/content-manager/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products Catalogue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Add New Product</h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Publish a verified product into Cartify's catalogue with instant real-time preview.
            </p>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Core Identification */}
          <div className="card p-5 bg-card border border-border-subtle space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <Package className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-ink">1. Basic Information</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Product Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sony WH-1000XM5 Wireless Noise-Canceling Headphones"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sony, Apple, Cartify"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Primary Category <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Subcategory
                </label>
                <input
                  type="text"
                  placeholder="e.g. Over-Ear Headphones, Running Shoes"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Seller / Vendor Entity
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cartify Verified Seller"
                  value={form.sellerName}
                  onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Product Description
              </label>
              <textarea
                rows={4}
                placeholder="Provide a compelling overview of key benefits, specifications, and warranty details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none resize-y"
              />
            </div>
          </div>

          {/* Card 2: Pricing & Inventory */}
          <div className="card p-5 bg-card border border-border-subtle space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <DollarSign className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-ink">2. Pricing & Stock Inventory</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Base Price ($) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="199.99"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface pl-7 pr-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="15"
                    value={form.discountPercentage}
                    onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Initial Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="50"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Final Price Alert */}
            <div className="flex items-center justify-between rounded-lg bg-card-elevated border border-border-subtle p-3 text-xs">
              <span className="text-muted">Calculated Final Selling Price:</span>
              <span className="text-sm font-bold text-ink">
                ${finalPrice.toFixed(2)}
                {discount > 0 && (
                  <span className="ml-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ({discount}% off original ${basePrice.toFixed(2)})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Card 3: Media & Imagery */}
          <div className="card p-5 bg-card border border-border-subtle space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-ink">3. Product Media & Images</h2>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink">
                  Main Showcase Image URL <span className="text-error">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted">Quick presets:</span>
                  {SAMPLE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setForm({ ...form, mainImage: p.url })}
                      className="rounded bg-card-elevated px-1.5 py-0.5 text-[10px] font-medium text-accent hover:bg-surface border border-border-subtle"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/..."
                value={form.mainImage}
                onChange={(e) => setForm({ ...form, mainImage: e.target.value })}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-ink focus:border-accent focus:outline-none font-mono text-[11px]"
              />
            </div>

            {/* Gallery Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-ink">
                  Additional Gallery Images ({form.images.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                >
                  <PlusCircle className="h-3 w-3" />
                  Add Image URL
                </button>
              </div>

              <div className="space-y-2">
                {form.images.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={url}
                      onChange={(e) => handleUpdateGalleryUrl(i, e.target.value)}
                      className="flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryUrl(i)}
                      className="rounded p-1 text-muted hover:text-error hover:bg-error/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Technical Specifications */}
          <div className="card p-5 bg-card border border-border-subtle space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-ink">4. Specifications & Attributes</h2>
              </div>
              <button
                type="button"
                onClick={handleAddSpec}
                className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                <PlusCircle className="h-3 w-3" />
                Add Specification
              </button>
            </div>

            <div className="space-y-2.5">
              {form.specifications.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Battery Life, Material)"
                    value={spec.key}
                    onChange={(e) => handleUpdateSpec(i, 'key', e.target.value)}
                    className="w-1/3 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 30 Hours, Aluminum & Leather)"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(i, 'value', e.target.value)}
                    className="flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(i)}
                    className="rounded p-1 text-muted hover:text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/content-manager/products"
              className="rounded-lg border border-border-subtle bg-card px-4 py-2.5 text-xs font-semibold text-muted hover:bg-card-elevated hover:text-ink transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-xs font-bold text-accent-ink hover:bg-accent-hover transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Publishing...' : 'Publish Product to Catalogue'}
            </button>
          </div>
        </div>

        {/* Right Sticky Column: Live Product Card Preview (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Live Storefront Card Preview
              </span>
              <span className="text-[10px] rounded bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Verified
              </span>
            </div>

            {/* Storefront Product Card simulation */}
            <div className="card overflow-hidden border border-border-subtle bg-card shadow-cardHover transition-all rounded-xl">
              {/* Product Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-surface">
                <img
                  src={form.mainImage || 'https://placehold.co/400x400?text=Product+Image'}
                  alt={form.name || 'Product Preview'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x400?text=Preview+Unavailable';
                  }}
                />
                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink shadow-xs">
                    {discount}% OFF
                  </span>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-surface/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-ink border border-border-subtle">
                  INTERNAL
                </span>
              </div>

              {/* Product Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span className="font-semibold text-accent truncate">{form.brand || 'Cartify'}</span>
                  <span>{selectedCatObj?.name || 'Department'}</span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-ink line-clamp-2 min-h-[36px]">
                  {form.name || 'Your Product Title will appear right here...'}
                </h3>

                {/* Rating mock */}
                <div className="flex items-center gap-1 text-xs">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <span className="font-bold text-ink text-xs">5.0</span>
                  <span className="text-[10px] text-muted">(New Release)</span>
                </div>

                {/* Pricing row */}
                <div className="flex items-baseline justify-between pt-1 border-t border-border-subtle">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-ink">
                      ${finalPrice > 0 ? finalPrice.toFixed(2) : '0.00'}
                    </span>
                    {discount > 0 && basePrice > 0 && (
                      <span className="text-xs text-muted line-through">
                        ${basePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {parseInt(form.stockQuantity, 10) > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guidance card */}
            <div className="rounded-xl border border-border-subtle bg-card-elevated p-4 text-xs text-muted space-y-2">
              <p className="font-bold text-ink flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
                Automatic Catalog Indexing
              </p>
              <p className="text-[11px] leading-relaxed">
                Publishing this product immediately updates PostgreSQL search vectors and full-text index. Shoppers can search by title, brand, or specifications immediately.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}