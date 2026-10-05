import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  PieChart,
  Tag,
  Activity
} from 'lucide-react';
import { formatCurrency, formatNumber, grainLabels } from './biShared.js';

/**
 * Section 1: Executive KPI cards, OLAP sales trend, category share, and tier breakdowns.
 *
 * Presentational component. All data fetching and state ownership live in
 * AdminBIDashboard.jsx; this module only renders.
 */
export default function WarehouseOverviewPanel({
  loading,
  timeGrain,
  salesTrend,
  kpis,
  categoryShare,
  customerTiers,
  priceTiers
}) {
  return (
    <>
{/* Executive KPI Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    {
      label: 'Net Fact Revenue',
      value: kpis ? formatCurrency(kpis.netRevenue) : '—',
      subtext: kpis ? `Gross: ${formatCurrency(kpis.grossRevenue)}` : 'Data unavailable',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30'
    },
    {
      label: 'Total Orders',
      value: kpis ? formatNumber(kpis.totalOrders) : '—',
      subtext: kpis ? `AOV: ${formatCurrency(kpis.averageOrderValue)}` : 'Data unavailable',
      icon: ShoppingBag,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15 border-indigo-500/30'
    },
    {
      label: 'Active Customers',
      value: kpis ? formatNumber(kpis.activeCustomers) : '—',
      subtext: kpis ? `${formatNumber(kpis.totalUnitsSold)} items purchased` : 'Data unavailable',
      icon: Users,
      color: 'text-sky-400',
      bg: 'bg-sky-500/15 border-sky-500/30'
    },
    {
      label: 'Products in Fact',
      value: kpis ? formatNumber(kpis.productsTransacted) : '—',
      subtext: kpis ? `Avg item rev: ${formatCurrency(kpis.avgItemRevenue)}` : 'Data unavailable',
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30'
    }
  ].map((kpi, idx) => {
    const Icon = kpi.icon;
    return (
      <div
        key={idx}
        className="card p-5 border-border-subtle shadow-xs relative overflow-hidden group hover:border-border-strong transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted">{kpi.label}</span>
          <div className={`w-8 h-8 rounded-lg ${kpi.bg} border flex items-center justify-center ${kpi.color}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-ink font-display">{loading ? '...' : kpi.value}</div>
        <p className="text-xs text-muted mt-1 flex items-center gap-1">
          {kpi.subtext}
        </p>
      </div>
    );
  })}
</div>

{/* Main Multi-Dimensional Visual Workspace */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Time-Series OLAP Trend Chart */}
  <div className="lg:col-span-2 card border-border-subtle p-6 shadow-xs flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            OLAP Time-Series Sales Aggregation ({grainLabels[timeGrain] || timeGrain})
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Roll-up aggregation from <code>fact_sales</code> joined with <code>dim_time</code>
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-card-elevated font-mono text-muted border border-border-subtle">
          {salesTrend.length} periods
        </span>
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-3 my-6">
        {salesTrend.length === 0 ? (
          <p className="text-xs text-muted text-center py-12">No time-series data available.</p>
        ) : (
          (() => {
            const maxRevenue = Math.max(...salesTrend.map(s => s.netRevenue), 1);
            return salesTrend.map((row, i) => {
              const pct = Math.max(8, Math.round((row.netRevenue / maxRevenue) * 100));
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">{row.label}</span>
                    <span className="text-ink font-semibold font-mono">
                      {formatCurrency(row.netRevenue)} <span className="text-muted font-normal">({row.orderCount} orders)</span>
                    </span>
                  </div>
                  <div className="w-full bg-card-elevated h-2.5 rounded-full overflow-hidden border border-border-subtle">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>

    <div className="border-t border-border-subtle pt-3 flex items-center justify-between text-xs text-muted">
      <span>Granularity: <code>dim_time.{timeGrain}</code></span>
      <span>ACID Transactional Isolation: Preserved</span>
    </div>
  </div>

  {/* Category Share Breakdown (Slicing) */}
  <div className="card border-border-subtle p-6 shadow-xs flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent" />
            Category Revenue Share
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Denormalized <code>dim_product</code> slice
          </p>
        </div>
      </div>

      <div className="space-y-3.5 my-4">
        {categoryShare.length === 0 ? (
          <p className="text-xs text-muted text-center py-12">No category data.</p>
        ) : (
          categoryShare.slice(0, 6).map((cat, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-medium text-ink truncate">{cat.categoryName}</p>
                <p className="text-[11px] text-muted font-mono">{formatNumber(cat.unitsSold)} units sold</p>
              </div>
              <div className="text-right flex-shrink-0 font-mono">
                <p className="font-semibold text-ink">{formatCurrency(cat.netRevenue)}</p>
                <p className="text-[11px] text-emerald-400 font-medium">{cat.revenueSharePct}%</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    <div className="border-t border-border-subtle pt-3 text-xs text-muted flex items-center justify-between">
      <span>Dimension: <code>dim_product.category_id</code></span>
      <span className="text-ink font-semibold">{categoryShare.length} Active Categories</span>
    </div>
  </div>
</div>

{/* Dimensional Breakdown Tables: Price Tiers & Customer Cohorts */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Customer Activity Cohort (dim_customer) */}
  <div className="card border-border-subtle p-6 shadow-xs">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          Customer Behavioral Tiers (<code>dim_customer</code>)
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Segmented by order frequency and monetary contribution
        </p>
      </div>
    </div>

    <div className="divide-y divide-border-subtle">
      {customerTiers.map((tier, idx) => (
        <div key={idx} className="py-3 flex items-center justify-between text-xs">
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-card-elevated text-ink font-mono border border-border-subtle">
              {tier.activityTier}
            </span>
            <p className="text-muted text-[11px] mt-1">
              {tier.customerCount} customers • {tier.unitsPurchased} units
            </p>
          </div>
          <div className="text-right font-mono">
            <p className="font-bold text-ink">{formatCurrency(tier.totalRevenue)}</p>
            <p className="text-[11px] text-muted">Avg {formatCurrency(tier.revenuePerCustomer)}/user</p>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Price Tier Breakdown (dim_product) */}
  <div className="card border-border-subtle p-6 shadow-xs">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-400" />
          Price Hierarchy Distribution (<code>dim_product</code>)
        </h3>
        <p className="text-xs text-muted mt-0.5">
          OLAP aggregation grouped by catalogue price tier
        </p>
      </div>
    </div>

    <div className="divide-y divide-border-subtle">
      {priceTiers.map((tier, idx) => (
        <div key={idx} className="py-3 flex items-center justify-between text-xs">
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-card-elevated text-ink font-mono border border-border-subtle">
              {tier.priceTier}
            </span>
            <p className="text-muted text-[11px] mt-1">
              {formatNumber(tier.productCount)} catalogue products • {tier.unitsSold} sold
            </p>
          </div>
          <div className="text-right font-mono">
            <p className="font-bold text-ink">{formatCurrency(tier.totalRevenue)}</p>
            <p className="text-[11px] text-muted">Avg ₹{tier.avgUnitPrice}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
    </>
  );
}
