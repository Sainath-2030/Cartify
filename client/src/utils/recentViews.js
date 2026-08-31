const RECENT_KEY = 'cartify_recent_products';

export function getRecentlyViewedProducts() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewedProduct(product) {
  if (!product || !product.id) return;
  try {
    const existing = getRecentlyViewedProducts();
    const filtered = existing.filter((p) => p.id !== product.id);
    const updated = [
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        price: product.price,
        final_price: product.final_price || product.finalPrice,
        discount_percentage: product.discount_percentage || product.discountPercentage || 0,
        rating: product.rating,
        review_count: product.review_count || product.reviewCount || 0,
        main_image: product.main_image || product.mainImage,
        stock_quantity: product.stock_quantity || product.stockQuantity || 50,
      },
      ...filtered,
    ].slice(0, 8);

    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage write failures
  }
}
