import ComingSoon from '../../components/dashboard/ComingSoon.jsx';

export default function AdminCatalogue() {
  return (
    <ComingSoon
      title="Catalogue Health"
      description="Data-quality checks (duplicate images, missing fields, invalid prices) will surface here, building on server/scripts/validateProducts.js."
    />
  );
}