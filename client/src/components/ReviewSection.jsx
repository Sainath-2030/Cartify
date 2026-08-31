import { useState } from 'react';
import { Star, UserCircle2, MessageSquarePlus, Trash2 } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import EmptyState from './EmptyState.jsx';
import ReviewModal from './ReviewModal.jsx';
import Button from './Button.jsx';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { reviewService } from '../services/reviewService.js';

export default function ReviewSection({ product, onRefresh }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const rating = product?.rating || 0;
  const reviewCount = product?.review_count || 0;
  const breakdown = product?.ratingBreakdown || {};
  const reviews = product?.reviews || [];

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

  const handleWriteReviewClick = () => {
    if (!isAuthenticated) {
      showToast('Please log in to write a review.', 'error');
      return;
    }
    // Check if user already reviewed
    const hasReviewed = reviews.some((r) => r.user_id && Number(r.user_id) === Number(user?.id));
    if (hasReviewed) {
      showToast('You have already submitted a review for this product.', 'info');
      return;
    }
    setIsModalOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    setIsDeleting(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      showToast('Your review was deleted.', 'info');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete review.', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Left: Overall Rating & Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="text-center md:text-left">
            <p className="text-4xl font-bold text-ink">{Number(rating).toFixed(1)}</p>
            <RatingStars rating={Number(rating)} size="lg" />
            <p className="mt-1 text-sm text-muted">
              {reviewCount.toLocaleString('en-IN')} {reviewCount === 1 ? 'rating' : 'ratings'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[star] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-muted">
                  <span className="flex w-8 items-center gap-0.5">
                    {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            <Button variant="secondary" onClick={handleWriteReviewClick} className="w-full text-xs">
              <MessageSquarePlus className="h-4 w-4" /> Write a Review
            </Button>
          </div>
        </div>

        {/* Right: Review List */}
        <div className="flex flex-col divide-y divide-slate-200">
          {reviews.length === 0 ? (
            <div className="py-6 text-center">
              <EmptyState
                title="No reviews yet"
                description="Be the first to share your thoughts on this product."
              />
              <Button variant="primary" onClick={handleWriteReviewClick} className="mt-4 text-xs">
                Write the First Review
              </Button>
            </div>
          ) : (
            reviews.map((review) => {
              const isAuthor = user?.id && Number(review.user_id) === Number(user.id);
              const isAdmin = user?.role === 'ADMIN';

              return (
                <div key={review.id} className="flex gap-3 py-4 first:pt-0">
                  <UserCircle2 className="h-9 w-9 shrink-0 text-slate-300" />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{review.reviewer_name}</span>
                        {isAuthor && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            You
                          </span>
                        )}
                        <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
                      </div>

                      {(isAuthor || isAdmin) && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={isDeleting === review.id}
                          aria-label="Delete review"
                          className="text-xs text-muted hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <RatingStars rating={review.rating} />
                    {review.review_text && (
                      <p className="mt-1 text-sm text-ink/80">{review.review_text}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          onReviewSubmitted={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
