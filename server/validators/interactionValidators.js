// Interaction & Telemetry request validators

const ALLOWED_CLIENT_INTERACTIONS = ['VIEW', 'SEARCH'];
const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'secret', 'authorization', 'creditCard', 'card', 'cvv'];

export function validateClientInteraction(body = {}) {
  const errors = {};
  const { interactionType, productId, product_id, sessionId, session_id, metadata } = body;

  const type = String(interactionType || '').toUpperCase().trim();
  if (!type) {
    errors.interactionType = 'interactionType is required.';
  } else if (!ALLOWED_CLIENT_INTERACTIONS.includes(type)) {
    errors.interactionType = `Invalid client interactionType. Allowed client types: ${ALLOWED_CLIENT_INTERACTIONS.join(', ')}. Action events (PURCHASE, CART_ADD, etc.) are recorded exclusively by authoritative server services.`;
  }

  const rawProdId = productId !== undefined ? productId : product_id;
  let parsedProdId = null;
  if (rawProdId !== undefined && rawProdId !== null) {
    const pId = parseInt(rawProdId, 10);
    if (!Number.isFinite(pId) || pId <= 0) {
      errors.productId = 'productId must be a positive integer.';
    } else {
      parsedProdId = pId;
    }
  } else if (type === 'VIEW') {
    errors.productId = 'productId is required for VIEW interactions.';
  }

  const rawSessionId = String(sessionId || session_id || '').trim();
  if (rawSessionId && rawSessionId.length > 100) {
    errors.sessionId = 'sessionId cannot exceed 100 characters.';
  }

  let cleanMetadata = {};
  if (metadata !== undefined && metadata !== null) {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      errors.metadata = 'metadata must be a JSON object.';
    } else {
      const jsonString = JSON.stringify(metadata);
      if (jsonString.length > 4096) {
        errors.metadata = 'metadata payload size cannot exceed 4KB.';
      } else {
        // Sanitize sensitive keys
        cleanMetadata = { ...metadata };
        for (const key of Object.keys(cleanMetadata)) {
          if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
            delete cleanMetadata[key];
          }
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      interactionType: type,
      productId: parsedProdId,
      sessionId: rawSessionId || null,
      metadata: cleanMetadata,
    },
  };
}
