import { useState } from 'react';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { reviewService } from '../services/reviewService.js';
import { useToast } from '../hooks/useToast.js';
import Button from './Button.jsx';

export default function ReviewModal({ isOpen, onClose, product, onReviewSubmitted }) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 5) {
      setError('Review must be at least 5 characters long.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await reviewService.submitReview(product.id, {
        rating,
        reviewText: reviewText.trim(),
      });
      showToast('Thank you! Your review has been published.', 'success');
      if (onReviewSubmitted) {
        onReviewSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions = {
    1: 'Poor — Not recommended',
    2: 'Fair — Below expectations',
    3: 'Average — Met expectations',
    4: 'Good — Very satisfied',
    5: 'Excellent — Highly recommended!',
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 id="review-modal-title" className="text-lg font-bold text-ink">
              Write a Review
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted line-clamp-1 font-medium">
          Product: <span className="text-ink">{product.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-sm font-semibold text-ink">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="rounded p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-medium text-muted">
                {ratingDescriptions[activeRating]}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review-text" className="block text-sm font-semibold text-ink">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              id="review-text"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like or dislike about this product? How was the quality?"
              maxLength={2000}
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>Min. 5 characters</span>
              <span>{reviewText.length}/2000</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              <Send className="h-4 w-4" /> {isSubmitting ? 'Publishing...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
