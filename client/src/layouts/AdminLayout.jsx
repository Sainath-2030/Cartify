import DashboardShell from '../components/dashboard/DashboardShell.jsx';
import { LayoutDashboard, LineChart, BrainCircuit, RefreshCw, PackageSearch, Settings2 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Analytics', to: '/admin/analytics', icon: LineChart },
  { label: 'Models', to: '/admin/models', icon: BrainCircuit },
  { label: 'Retraining', to: '/admin/retraining', icon: RefreshCw },
  { label: 'Catalogue', to: '/admin/catalogue', icon: PackageSearch },
  { label: 'Business Rules', to: '/admin/business-rules', icon: Settings2 },
];

export default function AdminLayout() {
  return <DashboardShell roleLabel="Administrator" navItems={NAV_ITEMS} homePath="/" />;
}