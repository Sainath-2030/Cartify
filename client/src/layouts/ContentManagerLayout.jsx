import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import { LayoutDashboard, Package, PlusCircle, LayoutGrid } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/content-manager', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/content-manager/products', icon: Package },
  { label: 'Add Product', to: '/content-manager/products/new', icon: PlusCircle },
  { label: 'Categories', to: '/content-manager/categories', icon: LayoutGrid },
];

export default function ContentManagerLayout() {
  return <DashboardShell roleLabel="Content Manager" navItems={NAV_ITEMS} homePath="/" />;
}