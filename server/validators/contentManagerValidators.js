// Content Manager request validators

export function validateCreateProduct(body = {}) {
  const errors = {};
  const {
    name,
    brand,
    categoryId,
    category_id,
    subcategory,
    description,
    price,
    discountPercentage,
    discount_percentage,
    finalPrice,
    final_price,
    stockQuantity,
    stock_quantity,
    sellerName,
    mainImage,
    main_image,
    images,
    specifications,
  } = body;

  const prodName = String(name || '').trim();
  if (!prodName || prodName.length < 2) {
    errors.name = 'Product name is required (min 2 characters).';
  }

  const rawCatId = categoryId !== undefined ? categoryId : category_id;
  const catId = parseInt(rawCatId, 10);
  if (!rawCatId || !Number.isFinite(catId) || catId <= 0) {
    errors.categoryId = 'A valid category ID is required.';
  }

  const rawPrice = parseFloat(price);
  if (price === undefined || !Number.isFinite(rawPrice) || rawPrice <= 0) {
    errors.price = 'Price must be a positive number.';
  }

  const rawDiscount = discountPercentage !== undefined ? parseFloat(discountPercentage) : (discount_percentage !== undefined ? parseFloat(discount_percentage) : 0);
  if (!Number.isFinite(rawDiscount) || rawDiscount < 0 || rawDiscount > 100) {
    errors.discountPercentage = 'Discount percentage must be between 0 and 100.';
  }

  const calcFinalPrice = finalPrice !== undefined ? parseFloat(finalPrice) : (final_price !== undefined ? parseFloat(final_price) : (rawPrice ? Math.round(rawPrice * (1 - rawDiscount / 100) * 100) / 100 : 0));
  if (!Number.isFinite(calcFinalPrice) || calcFinalPrice <= 0) {
    errors.finalPrice = 'Final selling price must be a positive number.';
  }

  const rawStock = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : (stock_quantity !== undefined ? parseInt(stock_quantity, 10) : 50);
  if (!Number.isFinite(rawStock) || rawStock < 0) {
    errors.stockQuantity = 'Stock quantity cannot be negative.';
  }

  const img = String(mainImage || main_image || '').trim();
  if (!img || (!img.startsWith('http://') && !img.startsWith('https://'))) {
    errors.mainImage = 'A valid HTTP/HTTPS main image URL is required.';
  }

  if (images !== undefined && !Array.isArray(images)) {
    errors.images = 'Images must be an array of image URL strings.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name: prodName,
      brand: String(brand || 'Cartify Brand').trim(),
      categoryId: catId,
      subcategory: subcategory ? String(subcategory).trim() : null,
      description: String(description || '').trim(),
      shortDescription: prodName.length > 100 ? `${prodName.slice(0, 97)}...` : prodName,
      price: rawPrice,
      discountPercentage: rawDiscount,
      finalPrice: calcFinalPrice,
      stockQuantity: rawStock,
      sellerName: String(sellerName || 'Cartify Verified Seller').trim(),
      mainImage: img,
      images: Array.isArray(images) ? images.filter((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))) : [],
      specifications: typeof specifications === 'object' && !Array.isArray(specifications) ? specifications : {},
    },
  };
}

export function validateUpdateProduct(body = {}) {
  const errors = {};
  const fields = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length < 2) errors.name = 'Product name must have at least 2 characters.';
    else fields.name = name;
  }

  if (body.brand !== undefined) fields.brand = String(body.brand).trim();
  if (body.subcategory !== undefined) fields.subcategory = body.subcategory ? String(body.subcategory).trim() : null;
  if (body.description !== undefined) fields.description = String(body.description).trim();
  if (body.shortDescription !== undefined || body.short_description !== undefined) {
    fields.short_description = String(body.shortDescription || body.short_description).trim();
  }

  if (body.categoryId !== undefined || body.category_id !== undefined) {
    const cId = parseInt(body.categoryId || body.category_id, 10);
    if (!Number.isFinite(cId) || cId <= 0) errors.categoryId = 'Invalid category ID.';
    else fields.category_id = cId;
  }

  if (body.price !== undefined) {
    const p = parseFloat(body.price);
    if (!Number.isFinite(p) || p <= 0) errors.price = 'Price must be positive.';
    else fields.price = p;
  }

  if (body.discountPercentage !== undefined || body.discount_percentage !== undefined) {
    const d = parseFloat(body.discountPercentage !== undefined ? body.discountPercentage : body.discount_percentage);
    if (!Number.isFinite(d) || d < 0 || d > 100) errors.discountPercentage = 'Discount must be 0-100.';
    else fields.discount_percentage = d;
  }

  if (body.finalPrice !== undefined || body.final_price !== undefined) {
    const fp = parseFloat(body.finalPrice !== undefined ? body.finalPrice : body.final_price);
    if (!Number.isFinite(fp) || fp <= 0) errors.finalPrice = 'Final price must be positive.';
    else fields.final_price = fp;
  }

  if (body.stockQuantity !== undefined || body.stock_quantity !== undefined) {
    const sq = parseInt(body.stockQuantity !== undefined ? body.stockQuantity : body.stock_quantity, 10);
    if (!Number.isFinite(sq) || sq < 0) errors.stockQuantity = 'Stock cannot be negative.';
    else fields.stock_quantity = sq;
  }

  if (body.isActive !== undefined || body.is_active !== undefined) {
    fields.is_active = body.isActive !== undefined ? Boolean(body.isActive) : Boolean(body.is_active);
  }

  if (body.mainImage !== undefined || body.main_image !== undefined) {
    const img = String(body.mainImage || body.main_image).trim();
    if (!img.startsWith('http://') && !img.startsWith('https://')) errors.mainImage = 'Invalid image URL.';
    else fields.main_image = img;
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) errors.images = 'Images must be an array.';
    else fields.images = body.images.filter((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
  }

  if (body.specifications !== undefined) {
    if (typeof body.specifications !== 'object' || Array.isArray(body.specifications)) errors.specifications = 'Specifications must be an object.';
    else fields.specifications = body.specifications;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    fields,
  };
}

export function validateUpdateImages(body = {}) {
  const errors = {};
  const { mainImage, main_image, images } = body;

  const img = String(mainImage || main_image || '').trim();
  if (!img || (!img.startsWith('http://') && !img.startsWith('https://'))) {
    errors.mainImage = 'A valid HTTP/HTTPS main image URL is required.';
  }

  let cleanImages = [];
  if (images !== undefined) {
    if (!Array.isArray(images)) {
      errors.images = 'Images must be an array of URL strings.';
    } else {
      cleanImages = images.filter((u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://')));
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      mainImage: img,
      images: cleanImages,
    },
  };
}

export function validateCategory(body = {}) {
  const errors = {};
  const { name, slug, description, imageUrl, is_active, isActive } = body;

  const catName = String(name || '').trim();
  if (!catName || catName.length < 2) {
    errors.name = 'Category name is required (min 2 characters).';
  }

  let catSlug = String(slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!catSlug) {
    catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name: catName,
      slug: catSlug,
      description: description ? String(description).trim() : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : null,
      isActive: isActive !== undefined ? Boolean(isActive) : (is_active !== undefined ? Boolean(is_active) : true),
    },
  };
}
