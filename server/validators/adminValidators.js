// Admin request validators

export function validateBusinessRules(body = {}) {
  const errors = {};
  const { diversityBoost, minRatingThreshold, maxDiscountHighlight, interactionWeights, categoryWeights } = body;

  if (diversityBoost !== undefined) {
    const boost = parseFloat(diversityBoost);
    if (!Number.isFinite(boost) || boost < 0 || boost > 1) {
      errors.diversityBoost = 'diversityBoost must be a number between 0.0 and 1.0.';
    }
  }

  if (minRatingThreshold !== undefined) {
    const minRating = parseFloat(minRatingThreshold);
    if (!Number.isFinite(minRating) || minRating < 1 || minRating > 5) {
      errors.minRatingThreshold = 'minRatingThreshold must be a number between 1.0 and 5.0.';
    }
  }

  if (maxDiscountHighlight !== undefined) {
    const discount = parseFloat(maxDiscountHighlight);
    if (!Number.isFinite(discount) || discount < 0 || discount > 1) {
      errors.maxDiscountHighlight = 'maxDiscountHighlight must be a number between 0.0 and 1.0.';
    }
  }

  if (interactionWeights !== undefined && (typeof interactionWeights !== 'object' || Array.isArray(interactionWeights))) {
    errors.interactionWeights = 'interactionWeights must be an object mapping interaction types to weights.';
  }

  if (categoryWeights !== undefined && (typeof categoryWeights !== 'object' || Array.isArray(categoryWeights))) {
    errors.categoryWeights = 'categoryWeights must be an object mapping category slugs to weights.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRetrainRequest(body = {}) {
  const errors = {};
  const { modelType, epochs, batchSize } = body;

  if (modelType !== undefined && typeof modelType !== 'string') {
    errors.modelType = 'modelType must be a string.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
