import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Search,
  RefreshCw,
  Edit3,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SlidersHorizontal,
  X,
  Save,
  Trash2,
  Eye,
} from 'lucide-react';
import { contentManagerService } from '../../services/contentManagerService.js';
import { useToast } from '../../hooks/useToast.js';
import Pagination from '../../components/Pagination.jsx';

export default function CMProducts() {
  const { showToast } = useToast();

  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'true' | 'false'
  const [sort, setSort] = useState('created_desc');
  const [page, setPage] = useState(1);

  // Modals state
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [imagesProduct, setImagesProduct] = useState(null);
  const [imagesForm, setImagesForm] = useState({ mainImage: '', images: [] });
  const [imagesSubmitting, setImagesSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load categories once
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await contentManagerService.listCategories();
        if (res?.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCats();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        sort,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await contentManagerService.listProducts(params);
      if (res?.data) {
        setProducts(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast(err.message || 'Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, statusFilter, sort, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Quick toggle active status
  const handleToggleActive = async (product) => {
    try {
      const nextActive = !product.isActive;
      await contentManagerService.updateProduct(product.id, { isActive: nextActive });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
      );
      showToast(`Product "${product.name.slice(0, 30)}..." is now ${nextActive ? 'Active' : 'Inactive'}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update product status.', 'error');
    }
  };

  // Open Quick Edit Modal
  const openEditModal = (product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      brand: product.brand || '',
      categoryId: product.categoryId,
      subcategory: product.subcategory || '',
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive,
    });
  };

  // Submit Quick Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    setEditSubmitting(true);
    try {
      const payload = {
        name: editForm.name,
        brand: editForm.brand,
        categoryId: parseInt(editForm.categoryId, 10),
        subcategory: editForm.subcategory || null,
        price: parseFloat(editForm.price),
        discountPercentage: parseFloat(editForm.discountPercentage) || 0,
        stockQuantity: parseInt(editForm.stockQuantity, 10) || 0,
        isActive: Boolean(editForm.isActive),
      };
      await contentManagerService.updateProduct(editProduct.id, payload);
      showToast('Product updated successfully.', 'success');
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to update product.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Images Modal
  const openImagesModal = async (product) => {
    setImagesProduct(product);
    setImagesForm({
      mainImage: product.mainImage || '',
      images: [],
    });
    // Fetch detailed product to retrieve additional gallery images
    try {
      const res = await contentManagerService.getProductById(product.id);
      if (res?.data) {
        const prod = res.data;
        const gallery = Array.isArray(prod.images)
          ? prod.images
          : typeof prod.images === 'string'
          ? JSON.parse(prod.images || '[]')
          : [];
        setImagesForm({
          mainImage: prod.main_image || prod.mainImage || product.mainImage || '',
          images: gallery.filter((u) => u && typeof u === 'string'),
        });
      }
    } catch {
      // Fallback to what we have
    }
  };

  // Save Images
  const handleImagesSubmit = async (e) => {
    e.preventDefault();
    if (!imagesProduct) return;
    setImagesSubmitting(true);
    try {
      await contentManagerService.updateProductImages(imagesProduct.id, {
        mainImage: imagesForm.mainImage.trim(),
        images: imagesForm.images.filter((u) => u.trim().startsWith('http')),
      });
      showToast('Product images updated.', 'success');
      setImagesProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to update images.', 'error');
    } finally {
      setImagesSubmitting(false);
    }
  };

  const handleAddImageUrl = () => {
    setImagesForm((prev) => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  };

  const handleUpdateGalleryUrl = (idx, val) => {
    setImagesForm((prev) => {
      const next = [...prev.images];
      next[idx] = val;
      return { ...prev, images: next };
    });
  };

  const handleRemoveGalleryUrl = (idx) => {
    setImagesForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              <Package className="h-3.5 w-3.5" />
              Catalogue Management
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-medium">
              {pagination.total.toLocaleString()} total items
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink mt-1">Products Studio</h1>
          <p className="text-xs sm:text-sm text-muted">
            Manage catalogue inventory, pricing, media, and real-time storefront visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={loading}
            title="Refresh product list"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-card px-3 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </button>
          <Link
            to="/content-manager/products/new"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-hover transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-card border border-border-subtle">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search products by title, brand, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-8 py-2 text-xs sm:text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          {/* Sort order */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
          >
            <option value="created_desc">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Products Table Container */}
      <div className="card overflow-hidden border border-border-subtle bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="border-b border-border-subtle bg-card-elevated text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-accent" />
                      <p className="text-xs">Loading catalogue products...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted">
                    <Package className="mx-auto h-8 w-8 text-muted/60 mb-2" />
                    <p className="text-sm font-semibold text-ink">No products found</p>
                    <p className="text-xs text-muted mt-0.5">
                      Try adjusting your search terms or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const finalPrice = p.finalPrice ?? p.price;
                  const hasDiscount = p.discountPercentage > 0;
                  const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 10;
                  const isOutOfStock = p.stockQuantity <= 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-card-elevated/60 transition-colors group"
                    >
                      {/* Product details */}
                      <td className="px-4 py-3 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface">
                            <img
                              src={p.mainImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                              alt={p.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-ink line-clamp-1 text-xs">
                                {p.name}
                              </span>
                              {p.source === 'internal' && (
                                <span className="rounded bg-accent/15 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                                  INTERNAL
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                              <span className="font-medium text-ink/70">{p.brand || 'No brand'}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px]">{p.sourceId || `#${p.id}`}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-card-elevated px-2 py-1 text-[11px] font-medium text-ink border border-border-subtle">
                          {p.categoryName || 'General'}
                        </span>
                        {p.subcategory && (
                          <p className="text-[10px] text-muted mt-1 truncate max-w-[120px]">
                            {p.subcategory}
                          </p>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-ink text-xs sm:text-sm">
                            ${Number(finalPrice).toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-muted line-through">
                              ${Number(p.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {p.discountPercentage}% OFF
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isOutOfStock
                                ? 'bg-error'
                                : isLowStock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-semibold text-ink text-xs">
                            {p.stockQuantity}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted">
                          {isOutOfStock ? (
                            <span className="text-error font-medium">Out of stock</span>
                          ) : isLowStock ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Low stock</span>
                          ) : (
                            'In stock'
                          )}
                        </span>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            p.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-stone-500/10 text-muted border border-border-subtle hover:bg-stone-500/20'
                          }`}
                        >
                          {p.isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Hidden
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Storefront preview */}
                          <Link
                            to={`/product/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View product in storefront"
                            className="rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-accent transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          {/* Images management */}
                          <button
                            type="button"
                            onClick={() => openImagesModal(p)}
                            title="Manage product images"
                            className="rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-accent transition-colors"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Edit product details"
                            className="rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-accent transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        <div className="border-t border-border-subtle bg-card px-4 py-3">
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="card w-full max-w-lg border border-border-subtle bg-card p-6 shadow-modal">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Edit Product</h3>
                <p className="text-xs text-muted">ID: {editProduct.id} • {editProduct.sourceId || 'Internal'}</p>
              </div>
              <button
                onClick={() => setEditProduct(null)}
                className="rounded-lg p-1 text-muted hover:bg-card-elevated hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Brand</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Category</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.discountPercentage}
                    onChange={(e) => setEditForm({ ...editForm, discountPercentage: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stockQuantity}
                    onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Subcategory</label>
                <input
                  type="text"
                  value={editForm.subcategory}
                  onChange={(e) => setEditForm({ ...editForm, subcategory: e.target.value })}
                  placeholder="e.g. Wireless Headphones, Casual Shirts"
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalActiveToggle"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-accent focus:ring-accent accent-accent"
                />
                <label htmlFor="modalActiveToggle" className="font-semibold text-ink cursor-pointer select-none">
                  Active (Visible on public storefront)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted hover:bg-card-elevated hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Images Modal */}
      {imagesProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="card w-full max-w-xl border border-border-subtle bg-card p-6 shadow-modal max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Manage Product Images</h3>
                <p className="text-xs text-muted truncate max-w-md">{imagesProduct.name}</p>
              </div>
              <button
                onClick={() => setImagesProduct(null)}
                className="rounded-lg p-1 text-muted hover:bg-card-elevated hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImagesSubmit} className="space-y-5 text-xs">
              {/* Main Image */}
              <div>
                <label className="block font-semibold text-ink mb-1.5">
                  Main Display Image URL <span className="text-error">*</span>
                </label>
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-surface">
                    <img
                      src={imagesForm.mainImage || 'https://placehold.co/100x100?text=No+Img'}
                      alt="Main Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=Invalid';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={imagesForm.mainImage}
                      onChange={(e) => setImagesForm({ ...imagesForm, mainImage: e.target.value })}
                      className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none font-mono text-[11px]"
                    />
                    <p className="text-[11px] text-muted mt-1">
                      This is the primary showcase image displayed on search and category pages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-ink">
                    Additional Gallery Images ({imagesForm.images.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="flex items-center gap-1 rounded-md border border-border-subtle bg-card-elevated px-2 py-1 text-[11px] font-semibold text-accent hover:bg-card"
                  >
                    <PlusCircle className="h-3 w-3" />
                    Add URL
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {imagesForm.images.length === 0 ? (
                    <p className="text-muted text-[11px] italic">
                      No additional gallery images specified. Click "Add URL" to add item photos.
                    </p>
                  ) : (
                    imagesForm.images.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded border border-border-subtle bg-surface">
                          <img
                            src={url || 'https://placehold.co/50x50?text=?'}
                            alt={`Gallery ${idx + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/50x50?text=Err';
                            }}
                          />
                        </div>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={url}
                          onChange={(e) => handleUpdateGalleryUrl(idx, e.target.value)}
                          className="flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-ink focus:border-accent focus:outline-none font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryUrl(idx)}
                          className="rounded p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setImagesProduct(null)}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted hover:bg-card-elevated hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imagesSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {imagesSubmitting ? 'Saving...' : 'Update Images'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}