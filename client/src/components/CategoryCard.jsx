import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { onImageError } from '../utils/image.js';

export default function CategoryCard({ category }) {
  const { name, slug, description, image, product_count: productCount } = category;

  return (
    <Link
      to={`/category/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card transition-all duration-300 hover:border-zinc-400 hover:shadow-cardHover"
    >
      <div className="aspect-[16/9] overflow-hidden bg-surface-secondary/50 p-2">
        <img
          src={image}
          onError={onImageError}
          alt={name}
          loading="lazy"
          className="h-full w-full rounded-xl object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-zinc-900 group-hover:text-primary transition-colors">
            {name}
          </h3>
          {productCount !== undefined && (
            <span className="text-[11px] font-semibold text-zinc-500 bg-surface-secondary px-2 py-0.5 rounded-full border border-surface-border/60">
              {productCount} items
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-zinc-900 group-hover:text-primary transition-colors">
          <span>Shop Department</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
