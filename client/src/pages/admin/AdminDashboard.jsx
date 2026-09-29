import { Link } from 'react-router-dom';
import { LineChart, BrainCircuit, RefreshCw, PackageSearch, Settings2, BarChart3, ArrowRight } from 'lucide-react';

const CARDS = [
  { title: 'Analytics', description: 'Recommendation quality metrics (Precision@K, Recall@K, NDCG@K, Hit Ratio).', to: '/admin/analytics', icon: LineChart },
  { title: 'Models', description: 'Status of NCF, CNN, GRU, Autoencoder and Attention Fusion services.', to: '/admin/models', icon: BrainCircuit },
  { title: 'Retraining', description: 'Trigger and monitor model retraining jobs.', to: '/admin/retraining', icon: RefreshCw },
  { title: 'Catalogue Health', description: 'Data-quality checks across the product catalogue.', to: '/admin/catalogue', icon: PackageSearch },
  { title: 'Business Rules', description: 'Configure promotion boosts and ranking constraints.', to: '/admin/business-rules', icon: Settings2 },
  { title: 'BI Dashboard', description: 'Business intelligence overview, sales velocity, and executive KPI analytics.', to: '/admin/bi-dashboard', icon: BarChart3 },
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

      <div className="rounded-xl border border-amber-200/80 bg-[#FFFBEB] dark:bg-[#2A2010] dark:border-amber-700/50 px-5 py-3.5 text-sm text-[#92400E] dark:text-[#FDE68A] shadow-xs">
        This dashboard is a structural foundation. Live analytics and model data are not yet connected —
        see each section for its current status.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ title, description, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-card p-6 transition-all hover:border-border-strong hover:bg-card-elevated"
          >
            <div>
              <div className="mb-4">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-ink sm:text-base">{title}</h2>
              <p className="mt-2 text-xs text-muted leading-relaxed sm:text-sm">{description}</p>
            </div>
            <span className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-accent">
              Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}