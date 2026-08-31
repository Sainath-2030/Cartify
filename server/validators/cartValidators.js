// Cart request validators

export function validateAddToCart(body = {}) {
  const errors = {};
  const rawProductId = body.productId !== undefined ? body.productId : body.product_id;
  const { quantity } = body;

  const parsedId = parseInt(rawProductId, 10);
  if (rawProductId === undefined || rawProductId === null || !Number.isFinite(parsedId) || parsedId <= 0) {
    errors.productId = 'A valid positive productId is required.';
  }

  let parsedQty = 1;
  if (quantity !== undefined && quantity !== null) {
    parsedQty = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      errors.quantity = 'Quantity must be a positive integer.';
    } else if (parsedQty > 50) {
      errors.quantity = 'Quantity cannot exceed 50 units per addition.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      productId: parsedId,
      quantity: parsedQty,
    },
  };
}

export function validateUpdateCartQuantity(body = {}) {
  const errors = {};
  const { quantity } = body;

  if (quantity === undefined || quantity === null) {
    errors.quantity = 'Quantity is required.';
  } else {
    const parsedQty = parseInt(quantity, 10);
    if (!Number.isFinite(parsedQty) || parsedQty < 0) {
      errors.quantity = 'Quantity must be a non-negative integer.';
    } else if (parsedQty > 50) {
      errors.quantity = 'Maximum allowed quantity is 50 units.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      quantity: parseInt(quantity, 10),
    },
  };
}
