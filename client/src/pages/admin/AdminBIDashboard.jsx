import { useState, useEffect, useCallback, useRef } from 'react';
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
  Calendar,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Tag,
  ShieldCheck,
  Activity,
  ChevronRight,
  Filter
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

export default function AdminBIDashboard() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [etlRefreshing, setEtlRefreshing] = useState(false);
  const [timeGrain, setTimeGrain] = useState('month');
  const [overviewData, setOverviewData] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const requestIdRef = useRef(0);

  const fetchDashboardData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        adminService.getWarehouseOverview(),
        adminService.getWarehouseSalesTrend(timeGrain),
        adminService.getWarehouseTopProducts(5)
      ]);

      // Ignore responses from superseded requests
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const [overviewResult, trendResult, topResult] = results;

      // Handle Executive Overview
      if (overviewResult.status === 'fulfilled') {
        const overview = overviewResult.value?.data || overviewResult.value;
        if (overview?.kpis) {
          setOverviewData(overview);
        } else {
          setOverviewData(null);
          showToast('Executive overview data format was unexpected.', 'error');
        }
      } else {
        setOverviewData(null);
        showToast(overviewResult.reason?.message || 'Failed to load executive overview.', 'error');
      }

      // Handle Sales Trend (clear stale data on failure)
      if (trendResult.status === 'fulfilled') {
        const trend = trendResult.value?.data || trendResult.value;
        if (Array.isArray(trend)) {
          setSalesTrend(trend);
        } else if (Array.isArray(trend?.data)) {
          setSalesTrend(trend.data);
        } else {
          setSalesTrend([]);
        }
      } else {
        setSalesTrend([]);
        showToast(trendResult.reason?.message || 'Failed to load sales trend data.', 'error');
      }

      // Handle Top Products (clear stale data on failure)
      if (topResult.status === 'fulfilled') {
        const top = topResult.value?.data || topResult.value;
        if (Array.isArray(top)) {
          setTopProducts(top);
        } else if (Array.isArray(top?.data)) {
          setTopProducts(top.data);
        } else {
          setTopProducts([]);
        }
      } else {
        setTopProducts([]);
        showToast(topResult.reason?.message || 'Failed to load top products data.', 'error');
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        showToast(err.message || 'Error loading BI Dashboard data.', 'error');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [timeGrain, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTriggerETL = async () => {
    try {
      setEtlRefreshing(true);
      const res = await adminService.triggerWarehouseEtl();
      showToast(res.message || 'ETL Warehouse refresh completed successfully!', 'success');
      await fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to trigger ETL refresh.', 'error');
    } finally {
      setEtlRefreshing(false);
    }
  };

  const kpis = overviewData?.kpis || null;
  const categoryShare = overviewData?.categoryShare || [];
  const customerTiers = overviewData?.customerTiers || [];
  const priceTiers = overviewData?.priceTiers || [];
  const etlHealth = overviewData?.etlHealth || {};

  const grainLabels = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    quarter: 'Quarterly',
    year: 'Yearly'
  };

  // Formatter helpers
  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  const formatNumber = (val) =>
    new Intl.NumberFormat('en-US').format(val || 0);

  return (
    <div className="space-y-8 pb-16 max-w-7xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OLAP Star Schema Active
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 font-mono">DWM Section 1 Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 font-display">
            Business Intelligence (BI) Dashboard
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Dual-Layer OLAP Analytics, Star Schema Fact Aggregations, and Multi-Dimensional Decision Support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white p-1 shadow-xs">
            {['day', 'week', 'month'].map((grain) => (
              <button
                key={grain}
                onClick={() => setTimeGrain(grain)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeGrain === grain
                    ? 'bg-amber-500 text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {grainLabels[grain] || grain}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerETL}
            disabled={etlRefreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${etlRefreshing ? 'animate-spin' : ''}`} />
            <span>{etlRefreshing ? 'Syncing ETL...' : 'Refresh Warehouse'}</span>
          </button>
        </div>
      </div>

      {/* Top Architecture Status Banner */}
      <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-stone-50 to-amber-50/50 p-4 text-xs text-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-stone-900">Star Schema Dimensions Operational:</span>{' '}
            <span className="text-stone-600">
              <code>dim_time</code>, <code>dim_product</code>, <code>dim_customer</code>, <code>fact_sales</code>, <code>fact_interaction_daily</code>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-stone-500 font-mono text-[11px]">
          <span>
            Last ETL Sync: <strong className="text-stone-800">{etlHealth.lastSync ? new Date(etlHealth.lastSync).toLocaleTimeString() : 'Recent'}</strong>
          </span>
          <span>•</span>
          <span>
            Duration: <strong className="text-stone-800">{etlHealth.executionTimeMs || 0} ms</strong>
          </span>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Net Fact Revenue',
            value: kpis ? formatCurrency(kpis.netRevenue) : '—',
            subtext: kpis ? `Gross: ${formatCurrency(kpis.grossRevenue)}` : 'Data unavailable',
            icon: DollarSign,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50 border-emerald-200/60'
          },
          {
            label: 'Total Orders',
            value: kpis ? formatNumber(kpis.totalOrders) : '—',
            subtext: kpis ? `AOV: ${formatCurrency(kpis.averageOrderValue)}` : 'Data unavailable',
            icon: ShoppingBag,
            color: 'text-indigo-700',
            bg: 'bg-indigo-50 border-indigo-200/60'
          },
          {
            label: 'Active Customers',
            value: kpis ? formatNumber(kpis.activeCustomers) : '—',
            subtext: kpis ? `${formatNumber(kpis.totalUnitsSold)} items purchased` : 'Data unavailable',
            icon: Users,
            color: 'text-sky-700',
            bg: 'bg-sky-50 border-sky-200/60'
          },
          {
            label: 'Products in Fact',
            value: kpis ? formatNumber(kpis.productsTransacted) : '—',
            subtext: kpis ? `Avg item rev: ${formatCurrency(kpis.avgItemRevenue)}` : 'Data unavailable',
            icon: TrendingUp,
            color: 'text-amber-700',
            bg: 'bg-amber-50 border-amber-200/60'
          }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs relative overflow-hidden group hover:border-stone-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-stone-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} border flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-900 font-display">{loading ? '...' : kpi.value}</div>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                {kpi.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Multi-Dimensional Visual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time-Series OLAP Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  OLAP Time-Series Sales Aggregation ({grainLabels[timeGrain] || timeGrain})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Roll-up aggregation from <code>fact_sales</code> joined with <code>dim_time</code>
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-stone-100 font-mono text-stone-600">
                {salesTrend.length} periods
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="space-y-3 my-6">
              {salesTrend.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-12">No time-series data available.</p>
              ) : (
                (() => {
                  const maxRevenue = Math.max(...salesTrend.map(s => s.netRevenue), 1);
                  return salesTrend.map((row, i) => {
                    const pct = Math.max(8, Math.round((row.netRevenue / maxRevenue) * 100));
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-stone-700">{row.label}</span>
                          <span className="text-stone-900 font-semibold font-mono">
                            {formatCurrency(row.netRevenue)} <span className="text-stone-400 font-normal">({row.orderCount} orders)</span>
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
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

          <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-xs text-stone-500">
            <span>Granularity: <code>dim_time.{timeGrain}</code></span>
            <span>ACID Transactional Isolation: Preserved</span>
          </div>
        </div>

        {/* Category Share Breakdown (Slicing) */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Category Revenue Share
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Denormalized <code>dim_product</code> slice
                </p>
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              {categoryShare.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-12">No category data.</p>
              ) : (
                categoryShare.slice(0, 6).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-stone-800 truncate">{cat.categoryName}</p>
                      <p className="text-[11px] text-stone-400 font-mono">{formatNumber(cat.unitsSold)} units sold</p>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono">
                      <p className="font-semibold text-stone-900">{formatCurrency(cat.netRevenue)}</p>
                      <p className="text-[11px] text-emerald-600 font-medium">{cat.revenueSharePct}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 text-xs text-stone-400 flex items-center justify-between">
            <span>Dimension: <code>dim_product.category_id</code></span>
            <span className="text-stone-600 font-semibold">{categoryShare.length} Active Categories</span>
          </div>
        </div>
      </div>

      {/* Dimensional Breakdown Tables: Price Tiers & Customer Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Activity Cohort (dim_customer) */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                Customer Behavioral Tiers (<code>dim_customer</code>)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Segmented by order frequency and monetary contribution
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {customerTiers.map((tier, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-800 font-mono">
                    {tier.activityTier}
                  </span>
                  <p className="text-stone-500 text-[11px] mt-1">
                    {tier.customerCount} customers • {tier.unitsPurchased} units
                  </p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-stone-900">{formatCurrency(tier.totalRevenue)}</p>
                  <p className="text-[11px] text-stone-400">Avg {formatCurrency(tier.revenuePerCustomer)}/user</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Tier Breakdown (dim_product) */}
        <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Price Hierarchy Distribution (<code>dim_product</code>)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                OLAP aggregation grouped by catalogue price tier
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {priceTiers.map((tier, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-800 font-mono">
                    {tier.priceTier}
                  </span>
                  <p className="text-stone-500 text-[11px] mt-1">
                    {formatNumber(tier.productCount)} catalogue products • {tier.unitsSold} sold
                  </p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-stone-900">{formatCurrency(tier.totalRevenue)}</p>
                  <p className="text-[11px] text-stone-400">Avg ${tier.avgUnitPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
