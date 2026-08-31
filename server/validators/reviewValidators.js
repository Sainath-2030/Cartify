// Review request validators

export const validateReviewSubmission = (body = {}) => {
  const errors = {};
  const { rating, reviewText } = body;

  const parsedRating = parseInt(rating, 10);
  if (rating === undefined || rating === null || !Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    errors.rating = 'Please provide a rating between 1 and 5 stars.';
  }

  const text = (reviewText || '').trim();
  if (text && text.length > 2000) {
    errors.reviewText = 'Review text cannot exceed 2,000 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      rating: parsedRating,
      reviewText: text || null,
    },
  };
};

export const validateReviewUpdate = (body = {}) => {
  const errors = {};
  const { rating, reviewText } = body;
  const data = {};

  if (rating !== undefined && rating !== null) {
    const parsedRating = parseInt(rating, 10);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      errors.rating = 'Please provide a rating between 1 and 5 stars.';
    } else {
      data.rating = parsedRating;
    }
  }

  if (reviewText !== undefined && reviewText !== null) {
    const text = String(reviewText).trim();
    if (text.length > 2000) {
      errors.reviewText = 'Review text cannot exceed 2,000 characters.';
    } else {
      data.reviewText = text || null;
    }
  }

  if (data.rating === undefined && data.reviewText === undefined) {
    errors.general = 'Provide at least a rating or reviewText to update.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data,
  };
};
