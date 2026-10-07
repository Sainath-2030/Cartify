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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { useTheme } from '../../../hooks/useTheme.js';
import {
  formatCurrency,
  formatNumber,
  grainLabels,
  getChartTheme,
  axisTick,
  tooltipStyle,
  CATEGORY_COLORS
} from './biShared.js';

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const chart = getChartTheme(isDark);
  const tip = tooltipStyle(isDark);
  const tick = axisTick(isDark);

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
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
  {/* Time-Series OLAP Trend Chart */}
  <div className="lg:col-span-2 card border-border-subtle p-6 shadow-xs flex flex-col">
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

      {/* Visual Bar Chart - Recharts */}
      <div className="h-[320px] my-4">
        {salesTrend.length === 0 ? (
          <p className="text-xs text-muted text-center py-12">No time-series data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis type="number" tick={tick} tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="label" tick={tick} width={80} />
              <Tooltip
                formatter={value => formatCurrency(value)}
                labelFormatter={label => label}
                contentStyle={tip}
              />
              <Bar
                dataKey="netRevenue"
                fill="#22d3ee"
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
              >
                {salesTrend.map((row, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#22d3ee' : '#06b6d4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>

    <div className="border-t border-border-subtle pt-3 flex items-center justify-between text-xs text-muted">
      <span>Granularity: <code>dim_time.{timeGrain}</code></span>
      <span>ACID Transactional Isolation: Preserved</span>
    </div>
  </div>

  {/* Category Share Breakdown (Slicing) */}
  <div className="card border-border-subtle p-6 shadow-xs flex flex-col h-full">
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

      <div className="flex flex-col lg:flex-row gap-6 my-4 items-start">
        {/* Pie Chart — kept inside its own fixed square so the donut never
            overflows the card. Labels are rendered inside the ring so they
            cannot be clipped by the ResponsiveContainer bounds. */}
        <div className="w-full lg:w-[240px] lg:flex-none">
          <div className="h-[240px] w-full">
            {categoryShare.length === 0 ? (
              <p className="text-xs text-muted text-center py-12">No category data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryShare.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="netRevenue"
                    nameKey="categoryName"
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                    style={{ fontSize: 10, fill: chart.labelText }}
                  >
                    {categoryShare.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => formatCurrency(value)}
                    labelFormatter={label => label}
                    contentStyle={tip}
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Legend / Details */}
        <div className="flex-1 min-w-0 space-y-2 overflow-y-auto max-h-[240px] pr-1">
          {categoryShare.length === 0 ? (
            <p className="text-xs text-muted text-center py-12">No category data.</p>
          ) : (
            categoryShare.slice(0, 6).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % 6] }}
                  />
                  <p className="font-medium text-ink truncate" title={cat.categoryName}>
                    {cat.categoryName}
                  </p>
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
    </div>

    <div className="border-t border-border-subtle pt-3 mt-auto text-xs text-muted flex items-center justify-between">
      <span>Dimension: <code>dim_product.category_id</code></span>
      <span className="text-ink font-semibold">{categoryShare.length} Active Categories</span>
    </div>
  </div>
</div>

{/* Dimensional Breakdown Charts: Price Tiers & Customer Cohorts */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Customer Activity Cohort (dim_customer) - Bar Chart */}
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

    <div className="h-[260px]">
      {customerTiers.length === 0 ? (
        <p className="text-xs text-muted text-center py-12">No tier data.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={customerTiers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis type="number" tick={tick} tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="activityTier" tick={tick} width={100} />
            <Tooltip
              formatter={value => formatCurrency(value)}
              labelFormatter={label => label}
              contentStyle={tip}
            />
            <Bar dataKey="totalRevenue" fill="#0ea5e9" radius={[0, 4, 4, 0]} maxBarSize={40}>
              {customerTiers.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#0ea5e9' : '#0284c7'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>

    <div className="border-t border-border-subtle pt-3 mt-3 space-y-2">
      {customerTiers.map((tier, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
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

  {/* Price Tier Breakdown (dim_product) - Bar Chart */}
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

    <div className="h-[260px]">
      {priceTiers.length === 0 ? (
        <p className="text-xs text-muted text-center py-12">No tier data.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={priceTiers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis type="number" tick={tick} tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="priceTier" tick={tick} width={100} />
            <Tooltip
              formatter={value => formatCurrency(value)}
              labelFormatter={label => label}
              contentStyle={tip}
            />
            <Bar dataKey="totalRevenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={40}>
              {priceTiers.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#8b5cf6' : '#7c3aed'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>

    <div className="border-t border-border-subtle pt-3 mt-3 space-y-2">
      {priceTiers.map((tier, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
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
