// Single fallback used anywhere a product/category image might 404 or
// fail to load, so a broken image never breaks the layout.
export const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <rect width="600" height="600" fill="#F1F5F9"/>
      <text x="50%" y="50%" font-family="Inter, sans-serif" font-size="20" fill="#94A3B8" text-anchor="middle" dominant-baseline="middle">Image unavailable</text>
    </svg>`
  );

export const onImageError = (e) => {
  if (e.target.src !== FALLBACK_IMAGE) {
    e.target.src = FALLBACK_IMAGE;
  }
};
