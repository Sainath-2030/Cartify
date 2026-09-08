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
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border-subtle p-6 shadow-modal transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            <h2 id="review-modal-title" className="text-base font-semibold text-ink">
              Write a Review
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted hover:bg-card-elevated hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-muted line-clamp-1">
          Product: <span className="text-ink font-medium">{product.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold text-ink">
              Overall rating <span className="text-error">*</span>
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
                    className={`h-6 w-6 ${
                      star <= activeRating
                        ? 'fill-accent text-accent'
                        : 'text-border-subtle hover:text-muted'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs text-muted">
                {ratingDescriptions[activeRating]}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label htmlFor="review-text" className="block text-xs font-semibold text-ink">
              Your review <span className="text-error">*</span>
            </label>
            <textarea
              id="review-text"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like or dislike about this product? How was the quality?"
              maxLength={2000}
              className="input-field mt-1.5 p-3 resize-none"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>Min. 5 characters</span>
              <span>{reviewText.length}/2000</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-error/15 border border-error/30 p-2.5 text-xs text-error">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              <Send className="h-4 w-4" /> {isSubmitting ? 'Publishing...' : 'Submit review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
