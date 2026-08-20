import { useState } from 'react';
import { onImageError, FALLBACK_IMAGE } from '../utils/image.js';

export default function ProductGallery({ mainImage, images = [], productName }) {
  const gallery = [mainImage, ...images].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const activeImage = gallery[activeIndex] || FALLBACK_IMAGE;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={activeImage}
          onError={onImageError}
          alt={productName}
          className={`h-full w-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-125' : 'scale-100'}`}
        />
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-3">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1} of ${productName}`}
              aria-current={i === activeIndex}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? 'border-primary' : 'border-transparent hover:border-slate-300'
              }`}
            >
              <img src={img} onError={onImageError} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
