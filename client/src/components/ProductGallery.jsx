import { useState } from 'react';
import { onImageError, FALLBACK_IMAGE, normalizeImageUrl } from '../utils/image.js';

export default function ProductGallery({ mainImage, images = [], productName }) {
  const gallery = [mainImage, ...images].filter(Boolean).map(normalizeImageUrl);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const activeImage = gallery[activeIndex] || FALLBACK_IMAGE;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border-subtle bg-card-elevated p-4 flex items-center justify-center"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={activeImage}
          onError={onImageError}
          alt={productName}
          className={`h-full w-full object-contain transition-transform duration-300 ${isZoomed ? 'scale-125' : 'scale-100'}`}
        />
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1} of ${productName}`}
              aria-current={i === activeIndex}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border p-1 bg-card-elevated transition-colors ${
                i === activeIndex ? 'border-accent' : 'border-border-subtle hover:border-border-strong'
              }`}
            >
              <img src={img} onError={onImageError} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
