// Single fallback used anywhere a product/category image might 404 or
// fail to load, so a broken image never breaks the layout.
export const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#F8FAFC"/>
      <circle cx="300" cy="270" r="48" fill="#E2E8F0"/>
      <path d="M220 380 L270 320 L320 370 L370 300 L420 380 Z" fill="#CBD5E1"/>
      <text x="50%" y="75%" font-family="Inter, sans-serif" font-size="18" font-weight="500" fill="#94A3B8" text-anchor="middle">Cartify</text>
    </svg>`
  );

export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  // Fix Amazon expired experiment path tokens
  if (url.includes('/images/W/IMAGERENDERING_')) {
    return url.replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/');
  }
  return url;
};

export const onImageError = (e) => {
  const currentSrc = e.target.src;
  if (currentSrc.includes('/images/W/IMAGERENDERING_')) {
    e.target.src = currentSrc.replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/');
    return;
  }
  if (e.target.src !== FALLBACK_IMAGE) {
    e.target.src = FALLBACK_IMAGE;
  }
};

