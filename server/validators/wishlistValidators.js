// Wishlist request validators

export function validateWishlistAction(body = {}) {
  const errors = {};
  const rawProductId = body.productId !== undefined ? body.productId : body.product_id;

  const parsedId = parseInt(rawProductId, 10);
  if (rawProductId === undefined || rawProductId === null || !Number.isFinite(parsedId) || parsedId <= 0) {
    errors.productId = 'A valid positive productId is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      productId: parsedId,
    },
  };
}
