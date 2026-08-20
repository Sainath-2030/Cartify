import { Star, StarHalf } from 'lucide-react';

export default function RatingStars({ rating = 0, size = 'sm' }) {
  const dims = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const rounded = Math.round(rating * 2) / 2;
  const full = Math.floor(rounded);
  const hasHalf = rounded - full === 0.5;

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) {
          return <Star key={i} className={`${dims} fill-amber-400 text-amber-400`} />;
        }
        if (i === full && hasHalf) {
          return <StarHalf key={i} className={`${dims} fill-amber-400 text-amber-400`} />;
        }
        return <Star key={i} className={`${dims} text-slate-300`} />;
      })}
    </div>
  );
}
