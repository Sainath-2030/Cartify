// Placeholder validator for future review submission (Section 2 only
// implements the display layer). Kept here so the shape is ready.
export const validateReviewSubmission = (body) => {
  const errors = {};
  const { rating, reviewText } = body;

  if (rating === undefined || rating < 1 || rating > 5) {
    errors.rating = 'Rating must be between 1 and 5.';
  }
  if (reviewText !== undefined && reviewText.length > 2000) {
    errors.reviewText = 'Review text is too long.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};
