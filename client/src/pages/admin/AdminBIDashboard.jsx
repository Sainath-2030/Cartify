import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Sparkles,
  Layers,
  ArrowUpRight,
  PieChart,
  Calendar
} from 'lucide-react';

export default function AdminBIDashboard() {
  return (
    <div className="space-y-8 pb-16 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              BI Module Active
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-mono">Executive Intelligence</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 font-display">
            Business Intelligence (BI) Dashboard
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Executive oversight, revenue insights, sales telemetry, and platform KPI performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-medium text-stone-600">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Ready for widgets</span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-800 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sky-900">BI Dashboard Tab Initialized</p>
          <p className="text-xs text-sky-700 mt-0.5">
            This module has been created and integrated into the administrator console. Connect specific charts, reports, or data queries here as needed.
          </p>
        </div>
      </div>

      {/* KPI Cards Placeholder Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Revenue', value: '—', subtext: 'Awaiting metric connection', icon: DollarSign, color: 'emerald' },
          { label: 'Active Customers', value: '—', subtext: 'Awaiting metric connection', icon: Users, color: 'blue' },
          { label: 'Orders Processed', value: '—', subtext: 'Awaiting metric connection', icon: ShoppingBag, color: 'indigo' },
          { label: 'Sales Conversion', value: '—', subtext: 'Awaiting metric connection', icon: TrendingUp, color: 'amber' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-stone-500">{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-900 font-display">{kpi.value}</div>
              <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                {kpi.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Visual Workspace Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center border-dashed border-2">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-stone-800">Primary Analytics & Revenue Charts</h3>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            This space is reserved for time-series charts, sales trends, and breakdown reports.
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center border-dashed border-2">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-stone-800">Segment & Category Breakdown</h3>
          <p className="text-xs text-stone-500 max-w-xs mt-1">
            Visualizations for category performance, customer cohorts, and product distribution.
          </p>
        </div>
      </div>
    </div>
  );
}
