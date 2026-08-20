import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { onImageError } from '../utils/image.js';

export default function CategoryCard({ category }) {
  const { name, slug, description, image, product_count: productCount } = category;

  return (
    <Link
      to={`/category/${slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-cardHover"
    >
      <div className="aspect-[2/1] overflow-hidden bg-slate-100">
        <img
          src={image}
          onError={onImageError}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">{name}</h3>
          {productCount !== undefined && (
            <span className="text-xs text-muted">{productCount} products</span>
          )}
        </div>
        <p className="text-sm text-muted">{description}</p>
        <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
          Explore {name} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
