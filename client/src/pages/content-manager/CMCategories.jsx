import { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  PlusCircle,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Save,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { contentManagerService } from '../../services/contentManagerService.js';
import { useToast } from '../../hooks/useToast.js';

export default function CMCategories() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null = Add, object = Edit
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contentManagerService.listCategories();
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      showToast(err.message || 'Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
      isActive: true,
    });
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      imageUrl: category.image_url || category.image || '',
      isActive: category.is_active !== undefined ? Boolean(category.is_active) : true,
    });
    setModalOpen(true);
  };

  // Auto-generate slug from name when creating
  const handleNameChange = (val) => {
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setCategoryForm((prev) => ({ ...prev, name: val, slug: generatedSlug }));
    } else {
      setCategoryForm((prev) => ({ ...prev, name: val }));
    }
  };

  // Save Category (Create or Update)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || categoryForm.name.trim().length < 2) {
      showToast('Category name must have at least 2 characters.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        description: categoryForm.description.trim(),
        imageUrl: categoryForm.imageUrl.trim() || null,
        isActive: Boolean(categoryForm.isActive),
      };

      if (editingCategory) {
        await contentManagerService.updateCategory(editingCategory.id, payload);
        showToast(`Category "${categoryForm.name}" updated successfully.`, 'success');
      } else {
        await contentManagerService.createCategory(payload);
        showToast(`Category "${categoryForm.name}" created successfully.`, 'success');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast(err.message || 'Failed to save category.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await contentManagerService.deleteCategory(deleteTarget.id);
      showToast(`Category "${deleteTarget.name}" deleted successfully.`, 'success');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      console.error('Delete category failed:', err);
      setDeleteError(err.message || 'Failed to delete category.');
      showToast(err.message || 'Failed to delete category.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered categories by search
  const filtered = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              <LayoutGrid className="h-3.5 w-3.5" />
              Taxonomy Studio
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-medium">{categories.length} departments</span>
          </div>
          <h1 className="text-2xl font-bold text-ink mt-1">Categories Management</h1>
          <p className="text-xs sm:text-sm text-muted">
            Organize Cartify's storefront hierarchy, manage banners, names, and inspect linked product distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCategories}
            disabled={loading}
            title="Refresh categories"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-card px-3 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-hover transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-3.5 bg-card border border-border-subtle">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search categories by name, slug, or keywords..."
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
      </div>

      {/* Category Cards Grid */}
      {loading && categories.length === 0 ? (
        <div className="card p-16 text-center text-muted border border-border-subtle bg-card">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-accent mb-2" />
          <p className="text-xs">Loading categories catalogue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center text-muted border border-border-subtle bg-card">
          <LayoutGrid className="mx-auto h-8 w-8 text-muted/60 mb-2" />
          <p className="text-sm font-semibold text-ink">No categories match your search</p>
          <p className="text-xs text-muted mt-0.5">Try searching with a different keyword or create a new category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cat) => {
            const productCount = parseInt(cat.product_count, 10) || 0;
            const banner = cat.image_url || cat.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80';

            return (
              <div
                key={cat.id}
                className="card overflow-hidden border border-border-subtle bg-card shadow-xs hover:shadow-cardHover transition-all flex flex-col group"
              >
                {/* Image Header */}
                <div className="relative h-36 w-full overflow-hidden bg-surface">
                  <img
                    src={banner}
                    alt={cat.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Slug badge */}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono text-white/90 border border-white/10">
                      /{cat.slug}
                    </span>
                  </div>

                  {/* Product count */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <h3 className="font-bold text-sm tracking-tight text-white drop-shadow-sm truncate">
                      {cat.name}
                    </h3>
                    <span className="flex items-center gap-1 text-[11px] font-semibold bg-accent/90 text-accent-ink px-2 py-0.5 rounded-full shadow-xs shrink-0">
                      <Package className="h-3 w-3" />
                      {productCount.toLocaleString()} items
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-muted line-clamp-2 min-h-[32px]">
                    {cat.description || 'No description provided for this department.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Department
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        title="Edit Category"
                        className="rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-accent transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(cat);
                        }}
                        title="Delete Category"
                        className="rounded-lg p-1.5 text-muted hover:bg-error/10 hover:text-error transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="card w-full max-w-md border border-border-subtle bg-card p-6 shadow-modal">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-xs text-muted">
                  {editingCategory ? `ID: ${editingCategory.id}` : 'Add a new department to the catalogue'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-card-elevated hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Category Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Home & IoT"
                  value={categoryForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  URL Slug <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">/</span>
                  <input
                    type="text"
                    required
                    placeholder="smart-home-iot"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-surface pl-6 pr-3 py-2 text-ink font-mono text-[11px] focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of products in this category..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Cover Image URL</label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-border-subtle bg-surface">
                    <img
                      src={categoryForm.imageUrl || 'https://placehold.co/100x100?text=None'}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=Err';
                      }}
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={categoryForm.imageUrl}
                    onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                    className="flex-1 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-ink focus:border-accent focus:outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted hover:bg-card-elevated hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="card w-full max-w-md border border-border-subtle bg-card p-6 shadow-modal">
            <div className="flex items-center gap-3 text-error mb-3">
              <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Delete Category</h3>
                <p className="text-xs text-muted">"{deleteTarget.name}"</p>
              </div>
            </div>

            {parseInt(deleteTarget.product_count, 10) > 0 ? (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1 mb-4">
                <p className="font-semibold">Dependency Protection Active</p>
                <p className="text-[11px]">
                  This category contains <strong>{deleteTarget.product_count}</strong> active products. To prevent orphaned items, the database requires reassigning or deleting all associated products before removing this category.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted mb-4">
                Are you sure you want to permanently delete this category? This action cannot be undone.
              </p>
            )}

            {deleteError && (
              <div className="rounded-lg bg-error/10 border border-error/20 p-2.5 text-xs text-error mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-muted hover:bg-card-elevated hover:text-ink transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={deleting || parseInt(deleteTarget.product_count, 10) > 0}
                className="flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-xs font-semibold text-white hover:bg-error/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}