import { Link } from 'react-router-dom';
import { LineChart, BrainCircuit, RefreshCw, PackageSearch, Settings2, ArrowRight } from 'lucide-react';

const CARDS = [
  { title: 'Analytics', description: 'Recommendation quality metrics (Precision@K, Recall@K, NDCG@K, Hit Ratio).', to: '/admin/analytics', icon: LineChart },
  { title: 'Models', description: 'Status of NCF, CNN, GRU, Autoencoder and Attention Fusion services.', to: '/admin/models', icon: BrainCircuit },
  { title: 'Retraining', description: 'Trigger and monitor model retraining jobs.', to: '/admin/retraining', icon: RefreshCw },
  { title: 'Catalogue Health', description: 'Data-quality checks across the product catalogue.', to: '/admin/catalogue', icon: PackageSearch },
  { title: 'Business Rules', description: 'Configure promotion boosts and ranking constraints.', to: '/admin/business-rules', icon: Settings2 },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Administrator Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Oversight for recommendation quality, model health and catalogue-wide business rules.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        This dashboard is a structural foundation. Live analytics and model data are not yet connected —
        see each section for its current status.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ title, description, to, icon: Icon }) => (
          <Link key={to} to={to} className="card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-cardHover">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <p className="text-xs text-muted">{description}</p>
            <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-primary">
              Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}