// Order & Checkout request validators

export function validateCreateOrder(body = {}) {
  const errors = {};
  const { shippingAddress, paymentMethod } = body;

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    errors.shippingAddress = 'Shipping address is required.';
  } else {
    const fullName = String(shippingAddress.fullName || shippingAddress.name || '').trim();
    const addressLine1 = String(shippingAddress.addressLine1 || shippingAddress.address || '').trim();
    const city = String(shippingAddress.city || '').trim();
    const state = String(shippingAddress.state || '').trim();
    const postalCode = String(shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.zip || '').trim();
    const phone = String(shippingAddress.phone || shippingAddress.mobile || '').trim();

    if (!fullName || fullName.length < 2) {
      errors['shippingAddress.fullName'] = 'Recipient full name is required (min 2 characters).';
    }
    if (!addressLine1 || addressLine1.length < 5) {
      errors['shippingAddress.addressLine1'] = 'Street address is required (min 5 characters).';
    }
    if (!city || city.length < 2) {
      errors['shippingAddress.city'] = 'City is required.';
    }
    if (!state || state.length < 2) {
      errors['shippingAddress.state'] = 'State/Province is required.';
    }
    if (!postalCode || !/^\d{5,6}(-\d{4})?$/.test(postalCode.replace(/\s/g, ''))) {
      errors['shippingAddress.postalCode'] = 'A valid 5 or 6 digit postal code is required.';
    }
  }

  const validPaymentMethods = ['COD', 'DEMO', 'SIMULATED_GATEWAY', 'CARD', 'UPI'];
  let method = 'COD';
  if (paymentMethod) {
    const cleanedMethod = String(paymentMethod).toUpperCase().trim();
    if (validPaymentMethods.includes(cleanedMethod)) {
      method = cleanedMethod;
    } else {
      errors.paymentMethod = `Payment method must be one of: ${validPaymentMethods.join(', ')}`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      shippingAddress: shippingAddress ? {
        fullName: String(shippingAddress.fullName || shippingAddress.name || '').trim(),
        addressLine1: String(shippingAddress.addressLine1 || shippingAddress.address || '').trim(),
        addressLine2: String(shippingAddress.addressLine2 || '').trim() || null,
        city: String(shippingAddress.city || '').trim(),
        state: String(shippingAddress.state || '').trim(),
        postalCode: String(shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.zip || '').trim(),
        phone: String(shippingAddress.phone || shippingAddress.mobile || '').trim() || null,
      } : null,
      paymentMethod: method,
    },
  };
}

export function validateOrderQuery(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  return { page, limit };
}
