// Validates and normalizes query parameters for product listing/search
// endpoints. Never trusts raw query strings — everything is parsed and
// range-checked before it reaches the model layer (defense against
// malformed input and SQL injection via unexpected types).

const ALLOWED_SORTS = ['featured', 'price_asc', 'price_desc', 'rating', 'newest', 'popular'];
const MAX_LIMIT = 48;
const DEFAULT_LIMIT = 12;

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFloat = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseProductQuery = (query) => {
  const errors = {};

  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(MAX_LIMIT, Math.max(1, toInt(query.limit, DEFAULT_LIMIT)));

  const sort = query.sort && ALLOWED_SORTS.includes(query.sort) ? query.sort : 'featured';
  if (query.sort && !ALLOWED_SORTS.includes(query.sort)) {
    errors.sort = `Sort must be one of: ${ALLOWED_SORTS.join(', ')}.`;
  }

  const minPrice = query.minPrice !== undefined ? toFloat(query.minPrice) : undefined;
  const maxPrice = query.maxPrice !== undefined ? toFloat(query.maxPrice) : undefined;
  if (query.minPrice !== undefined && minPrice === undefined) errors.minPrice = 'minPrice must be a number.';
  if (query.maxPrice !== undefined && maxPrice === undefined) errors.maxPrice = 'maxPrice must be a number.';
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.maxPrice = 'maxPrice must be greater than or equal to minPrice.';
  }

  let rating;
  if (query.rating !== undefined) {
    rating = toFloat(query.rating);
    if (rating === undefined || rating < 0 || rating > 5) {
      errors.rating = 'rating must be a number between 0 and 5.';
    }
  }

  const filters = {
    category: query.category ? String(query.category).trim() : undefined,
    brand: query.brand ? String(query.brand).trim() : undefined,
    minPrice,
    maxPrice,
    rating,
    inStock: query.inStock === 'true',
    q: query.q ? String(query.q).trim().slice(0, 100) : undefined,
  };

  return { valid: Object.keys(errors).length === 0, errors, filters, sort, page, limit };
};
