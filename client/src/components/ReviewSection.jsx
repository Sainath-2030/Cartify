import { Star, UserCircle2 } from 'lucide-react';
import RatingStars from './RatingStars.jsx';
import EmptyState from './EmptyState.jsx';
import { formatDate } from '../utils/format.js';

export default function ReviewSection({ rating, reviewCount, breakdown, reviews }) {
  const total = Object.values(breakdown || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-4">
        <div className="text-center md:text-left">
          <p className="text-4xl font-bold text-ink">{Number(rating).toFixed(1)}</p>
          <RatingStars rating={Number(rating)} size="lg" />
          <p className="mt-1 text-sm text-muted">{reviewCount?.toLocaleString('en-IN') || 0} ratings</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown?.[star] || 0;
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
      </div>

      <div className="flex flex-col divide-y divide-slate-200">
        {(!reviews || reviews.length === 0) ? (
          <EmptyState title="No reviews yet" description="Be the first to share your thoughts on this product." />
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="flex gap-3 py-4 first:pt-0">
              <UserCircle2 className="h-9 w-9 shrink-0 text-slate-300" />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{review.reviewer_name}</span>
                  <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
                </div>
                <RatingStars rating={review.rating} />
                {review.review_text && <p className="text-sm text-ink/80">{review.review_text}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
