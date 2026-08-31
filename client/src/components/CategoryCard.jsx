import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { onImageError } from '../utils/image.js';

const DEPARTMENT_TAGS = {
  fashion: ['Apparel', 'Footwear', 'Watches'],
  electronics: ['Audio & TWS', 'Smart TVs', 'Cameras'],
  'home-kitchen': ['Cookware', 'Furniture', 'Décor'],
  beauty: ['Skincare', 'Fragrances', 'Makeup'],
  sports: ['Fitness Gear', 'Cricket', 'Athletics'],
  grocery: ['Coffee & Tea', 'Chocolates', 'Pantry'],
  gaming: ['Gaming Mice', 'RGB Keyboards', 'Gear'],
  books: ['Computer Science', 'Finance', 'Literature'],
};

export default function CategoryCard({ category, featured = false }) {
  const { name, slug, description, image, product_count: productCount } = category;
  const tags = DEPARTMENT_TAGS[slug] || [];

  return (
    <Link
      to={`/category/${slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-surface-border bg-surface-card transition-all duration-300 hover:border-zinc-400 hover:shadow-cardHover ${
        featured ? 'lg:col-span-2 lg:flex-row' : ''
      }`}
    >
      <div
        className={`overflow-hidden bg-surface-secondary/40 p-2.5 ${
          featured ? 'lg:w-1/2 aspect-[16/10] lg:aspect-auto' : 'aspect-[16/10]'
        }`}
      >
        <img
          src={image}
          onError={onImageError}
          alt={name}
          loading="lazy"
          className="h-full w-full rounded-2xl object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-zinc-950 group-hover:text-primary transition-colors">
              {name}
            </h3>
            {productCount !== undefined && (
              <span className="text-[11px] font-bold text-zinc-600 bg-surface-secondary px-2.5 py-0.5 rounded-full border border-surface-border">
                {productCount.toLocaleString('en-IN')} items
              </span>
            )}
          </div>

          {description && (
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mt-2">
              {description}
            </p>
          )}

          {/* Curated Sub-department Chips */}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-surface-secondary/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600 border border-surface-border/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-zinc-900 group-hover:text-primary transition-colors">
          <span>Explore Department</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
