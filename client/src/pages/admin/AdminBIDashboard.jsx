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
  Filter,
  Network,
  Settings2,
  Lightbulb,
  Target
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

const CLUSTER_CONFIG = {
  champions: {
    label: 'Champions / High-Value',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  loyal: {
    label: 'Loyal Customers',
    color: '#0ea5e9',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
  },
  at_risk: {
    label: 'At-Risk / Potential Churn',
    color: '#f59e0b',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  new_inactive: {
    label: 'New / Inactive Explorers',
    color: '#8b5cf6',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30'
  }
};

export default function AdminBIDashboard() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [etlRefreshing, setEtlRefreshing] = useState(false);
  const [timeGrain, setTimeGrain] = useState('month');
  const [overviewData, setOverviewData] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  const [associationRules, setAssociationRules] = useState([]);
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.20);
  const [rulesLimit, setRulesLimit] = useState(10);
  
  const [customerSegments, setCustomerSegments] = useState(null);
  const [customerSegmentsError, setCustomerSegmentsError] = useState(false);
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');
  const [hoveredCustomerPoint, setHoveredCustomerPoint] = useState(null);

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

  const fetchAssociationRules = useCallback(async () => {
    try {
      const res = await adminService.getAssociationRules(minSupport, minConfidence, 1.0);
      if (Array.isArray(res)) {
        setAssociationRules(res);
      } else if (res && Array.isArray(res.data)) {
        setAssociationRules(res.data);
      } else {
        setAssociationRules([]);
      }
    } catch (err) {
      console.error('Failed to load association rules:', err);
    }
  }, [minSupport, minConfidence]);

  useEffect(() => {
    fetchAssociationRules();
  }, [fetchAssociationRules]);

  const fetchCustomerSegments = useCallback(async () => {
    setCustomerSegmentsError(false);
    try {
      const res = await adminService.getCustomerSegments();
      if (res && res.clusters) {
        setCustomerSegments(res);
      } else if (res && res.data && res.data.clusters) {
        setCustomerSegments(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer segments:', err);
      setCustomerSegmentsError(true);
    }
  }, []);

  useEffect(() => {
    fetchCustomerSegments();
  }, [fetchCustomerSegments]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OLAP Star Schema Active
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-mono">DWM Section 1 Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink font-display">
            Business Intelligence (BI) Dashboard
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Dual-Layer OLAP Analytics, Star Schema Fact Aggregations, and Multi-Dimensional Decision Support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-lg border border-border-subtle bg-card-elevated p-1 shadow-xs">
            {['day', 'week', 'month'].map((grain) => (
              <button
                key={grain}
                onClick={() => setTimeGrain(grain)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeGrain === grain
                    ? 'bg-accent text-accent-ink font-semibold shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-card'
                }`}
              >
                {grainLabels[grain] || grain}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerETL}
            disabled={etlRefreshing || loading}
            className="btn btn-primary text-xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${etlRefreshing ? 'animate-spin' : ''}`} />
            <span>{etlRefreshing ? 'Syncing ETL...' : 'Refresh Warehouse'}</span>
          </button>
        </div>
      </div>

      {/* Top Architecture Status Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-ink">Star Schema Dimensions Operational:</span>{' '}
            <span className="text-muted">
              <code>dim_time</code>, <code>dim_product</code>, <code>dim_customer</code>, <code>fact_sales</code>, <code>fact_interaction_daily</code>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted font-mono text-[11px]">
          <span>
            Last ETL Sync: <strong className="text-ink">{etlHealth.lastSync ? new Date(etlHealth.lastSync).toLocaleTimeString() : 'Recent'}</strong>
          </span>
          <span>•</span>
          <span>
            Duration: <strong className="text-ink">{etlHealth.executionTimeMs || 0} ms</strong>
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
                  <p className="text-[11px] text-muted">Avg ${tier.avgUnitPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Basket Analysis & Association Rules (Apriori Engine) */}
      <div className="card border-border-subtle p-6 shadow-xs mt-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink flex items-center gap-2 font-display">
              <Network className="w-5 h-5 text-accent" />
              Market Basket Analysis (Apriori Association Rules)
            </h3>
            <p className="text-sm text-muted mt-1">
              Mining transactional purchase records to discover itemsets frequently bought together.
            </p>
          </div>
          <div className="flex-shrink-0 bg-card-elevated p-4 rounded-lg border border-border-subtle min-w-[300px]">
            <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5 text-accent" /> Rule Hyperparameters
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">Min Support</span>
                  <span className="font-mono text-ink">{(minSupport * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.10"
                  step="0.005"
                  value={minSupport}
                  onChange={(e) => setMinSupport(parseFloat(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">Min Confidence</span>
                  <span className="font-mono text-ink">{(minConfidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">Display Limit</span>
                </div>
                <select
                  value={rulesLimit}
                  onChange={(e) => setRulesLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="input-field select-field text-xs py-1.5"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                  <option value="all">All Rules</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-card-elevated text-muted text-xs uppercase tracking-wider font-semibold border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3">Antecedent (If bought...)</th>
                <th className="px-4 py-3">Consequent (...then buys)</th>
                <th className="px-4 py-3 text-right">Support</th>
                <th className="px-4 py-3 text-right">Confidence</th>
                <th className="px-4 py-3 text-right">Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-ink bg-card">
              {associationRules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-muted text-sm">
                    No rules discovered for these thresholds. Try lowering the minimum support or confidence.
                  </td>
                </tr>
              ) : (
                (rulesLimit === 'all' ? associationRules : associationRules.slice(0, rulesLimit)).map((rule, idx) => (
                  <tr key={idx} className="hover:bg-card-elevated transition-colors">
                    <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate" title={rule.antecedentNames.join(', ')}>
                      {rule.antecedentNames.join(', ')}
                    </td>
                    <td className="px-4 py-3 font-medium text-accent max-w-[200px] truncate" title={rule.consequentNames.join(', ')}>
                      {rule.consequentNames.join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {(rule.support * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {(rule.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
                        rule.lift >= 2.0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        rule.lift > 1.0 ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                        'bg-card-elevated text-muted border border-border-subtle'
                      }`}>
                        {rule.lift.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-muted text-right flex justify-between items-center">
          <span>{rulesLimit !== 'all' && associationRules.length > rulesLimit ? `Showing top ${rulesLimit} out of ${associationRules.length} rules` : ''}</span>
          <span>Total rules discovered: {associationRules.length}</span>
        </div>
      </div>

      {/* Customer Segmentation & RFM Clustering (K-Means Engine) */}
      <div className="card p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="w-3.5 h-3.5" />
                Unsupervised Machine Learning
              </span>
              <span className="text-xs text-muted">•</span>
              <span className="text-xs text-muted font-mono">K-Means (K=4, Min-Max Scaled)</span>
            </div>
            <h3 className="text-lg font-semibold text-ink flex items-center gap-2 font-display">
              Customer Segmentation (RFM K-Means Clustering)
            </h3>
            <p className="text-sm text-muted mt-0.5">
              Behavioral cohorts grouped along 3 dimensions: Recency (days), Frequency (order count), and Monetary (total gross spend).
            </p>
          </div>
          {customerSegments && (
            <button
              onClick={fetchCustomerSegments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-elevated text-xs font-medium text-ink hover:border-border-strong transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-cluster Cohorts
            </button>
          )}
        </div>

        {customerSegmentsError ? (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center justify-between">
            <span>Failed to load customer segments.</span>
            <button onClick={fetchCustomerSegments} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 font-medium transition-colors">
              Retry
            </button>
          </div>
        ) : customerSegments ? (
          (() => {
            const allCustomers = customerSegments.clusters?.flatMap(c => c.customers) || [];
            let maxRecency = 30;
            let maxMonetary = 10000;

            if (allCustomers.length > 0) {
              maxRecency = allCustomers[0].recency;
              maxMonetary = allCustomers[0].monetary;
              for (let i = 1; i < allCustomers.length; i++) {
                if (allCustomers[i].recency > maxRecency) maxRecency = allCustomers[i].recency;
                if (allCustomers[i].monetary > maxMonetary) maxMonetary = allCustomers[i].monetary;
              }
            }

            const xDomainMax = Math.max(30, Math.ceil((maxRecency * 1.15) / 10) * 10);
            const yDomainMax = Math.max(1000, Math.ceil((maxMonetary * 1.15) / 5000) * 5000);

            const chartWidth = 720;
            const chartHeight = 360;
            const padding = { top: 30, right: 35, bottom: 55, left: 80 };
            const gutter = { bottom: 20, top: 15, left: 18, right: 20 };

            const axisLeft = padding.left;
            const axisRight = chartWidth - padding.right;
            const axisTop = padding.top;
            const axisBottom = chartHeight - padding.bottom;

            const plotWidth = axisRight - axisLeft - gutter.left - gutter.right;
            const plotHeight = axisBottom - axisTop - gutter.top - gutter.bottom;

            const getPlotX = (r) => axisLeft + gutter.left + (Math.max(0, r) / xDomainMax) * plotWidth;
            const getPlotY = (m) => (axisBottom - gutter.bottom) - (Math.max(0, m) / yDomainMax) * plotHeight;

            const xTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * xDomainMax));
            const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yDomainMax));

            const formatYAxisTick = (val) => {
              if (val === 0) return '$0';
              if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
              return `$${val}`;
            };

            return (
              <div className="space-y-6">
                {/* 4 Cluster Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {customerSegments.clusters.map((cluster) => {
                    const config = CLUSTER_CONFIG[cluster.id] || {
                      color: '#818cf8',
                      bg: 'bg-card-elevated',
                      border: 'border-border-subtle',
                      text: 'text-ink',
                      dot: 'bg-indigo-400',
                      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    };
                    const isSelected = selectedClusterFilter === cluster.id;
                    return (
                      <div
                        key={cluster.id}
                        onClick={() => setSelectedClusterFilter(isSelected ? 'all' : cluster.id)}
                        className={`border rounded-xl p-4 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? `${config.border} ring-2 ring-purple-500/50 bg-card-elevated shadow-md`
                            : `${config.border} ${config.bg} hover:border-border-strong`
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                              <h4 className="font-semibold text-ink text-sm leading-tight">{cluster.label}</h4>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border shrink-0 ml-1 ${config.badge}`}>
                              {cluster.customerCount} {cluster.customerCount === 1 ? 'User' : 'Users'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted">
                              <span>Avg Recency:</span>
                              <span className="font-medium text-ink font-mono">{cluster.averageRecency} days</span>
                            </div>
                            <div className="flex justify-between text-muted">
                              <span>Avg Frequency:</span>
                              <span className="font-medium text-ink font-mono">{cluster.averageFrequency} orders</span>
                            </div>
                            <div className="flex justify-between text-muted">
                              <span>Avg Monetary:</span>
                              <span className="font-medium text-ink font-mono">{formatCurrency(cluster.averageMonetary)}</span>
                            </div>
                            <div className="flex justify-between text-muted">
                              <span>Avg Order Value:</span>
                              <span className="font-medium text-ink font-mono">{formatCurrency(cluster.averageOrderValue)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Suggested Strategy */}
                        <div className="mt-3.5 pt-3 border-t border-border-subtle">
                          <div className="flex items-start gap-1.5 text-xs">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-ink text-[11px] block">Suggested Strategy:</span>
                              <p className="text-[11px] text-muted leading-snug mt-0.5">{cluster.strategy}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive 2D Scatter Plot (Recency vs. Monetary) */}
                <div className="border border-border-subtle rounded-xl p-5 bg-card-elevated">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        2D Behavioral Cohort Map (Recency vs. Monetary Spend)
                      </h4>
                      <p className="text-xs text-muted mt-0.5">
                        Interactive customer distribution. Hover over individual data points or filter by cluster cohort below.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedClusterFilter('all')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          selectedClusterFilter === 'all'
                            ? 'bg-accent text-accent-ink font-semibold shadow-xs'
                            : 'bg-card border border-border-subtle text-muted hover:text-ink hover:border-border-strong'
                        }`}
                      >
                        All ({allCustomers.length})
                      </button>
                      {customerSegments.clusters.map((cluster) => {
                        const config = CLUSTER_CONFIG[cluster.id];
                        const active = selectedClusterFilter === cluster.id;
                        return (
                          <button
                            key={cluster.id}
                            onClick={() => setSelectedClusterFilter(cluster.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium border transition-colors ${
                              active
                                ? `${config.badge} font-semibold shadow-xs ring-1 ring-accent/30`
                                : 'bg-card border-border-subtle text-muted hover:text-ink hover:border-border-strong'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                            <span>{cluster.label.split(' / ')[0]}</span>
                            <span className="text-[10px] opacity-75">({cluster.customerCount})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SVG Scatter Plot Canvas */}
                  <div className="relative bg-card border border-border-subtle rounded-lg p-3 overflow-x-auto shadow-inner">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full max-w-full h-auto select-none"
                      style={{ minWidth: '600px' }}
                    >
                      {/* Grid Lines - Horizontal */}
                      {yTicks.map((tickVal, i) => {
                        const y = getPlotY(tickVal);
                        return (
                          <g key={`y-grid-${i}`}>
                            <line
                              x1={axisLeft}
                              y1={y}
                              x2={axisRight}
                              y2={y}
                              stroke="var(--color-border-subtle, #2A2A2E)"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={axisLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] fill-muted font-mono"
                            >
                              {formatYAxisTick(tickVal)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Grid Lines - Vertical */}
                      {xTicks.map((tickVal, i) => {
                        const x = getPlotX(tickVal);
                        return (
                          <g key={`x-grid-${i}`}>
                            <line
                              x1={x}
                              y1={axisTop}
                              x2={x}
                              y2={axisBottom}
                              stroke="var(--color-border-subtle, #2A2A2E)"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={x}
                              y={axisBottom + 18}
                              textAnchor="middle"
                              className="text-[10px] fill-muted font-mono"
                            >
                              {tickVal}d
                            </text>
                          </g>
                        );
                      })}

                      {/* Axis Lines */}
                      <line
                        x1={axisLeft}
                        y1={axisBottom}
                        x2={axisRight}
                        y2={axisBottom}
                        stroke="var(--color-border-strong, #3A3A40)"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={axisLeft}
                        y1={axisTop}
                        x2={axisLeft}
                        y2={axisBottom}
                        stroke="var(--color-border-strong, #3A3A40)"
                        strokeWidth="1.5"
                      />

                      {/* Axis Titles */}
                      <text
                        x={axisLeft + (axisRight - axisLeft) / 2}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        className="text-[11px] fill-muted font-medium"
                      >
                        Recency (Days Since Last Order) ➔
                      </text>
                      <text
                        x={-(axisTop + (axisBottom - axisTop) / 2)}
                        y={22}
                        textAnchor="middle"
                        transform="rotate(-90)"
                        className="text-[11px] fill-muted font-medium"
                      >
                        Monetary Value (Total Spend in $) ➔
                      </text>

                      {/* Cluster Centroids */}
                      {customerSegments.clusters.map((cluster) => {
                        if (cluster.customerCount === 0) return null;
                        const cx = getPlotX(cluster.averageRecency);
                        const cy = getPlotY(cluster.averageMonetary);
                        const config = CLUSTER_CONFIG[cluster.id] || { color: '#818cf8' };
                        const isDimmed = selectedClusterFilter !== 'all' && selectedClusterFilter !== cluster.id;
                        return (
                          <g key={`centroid-${cluster.id}`} opacity={isDimmed ? 0.25 : 1}>
                            <circle
                              cx={cx}
                              cy={cy}
                              r="10"
                              fill="none"
                              stroke={config.color}
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                            />
                            <path
                              d={`M ${cx - 5} ${cy} L ${cx + 5} ${cy} M ${cx} ${cy - 5} L ${cx} ${cy + 5}`}
                              stroke={config.color}
                              strokeWidth="2"
                            />
                          </g>
                        );
                      })}

                      {/* Data Points */}
                      {allCustomers.map((cust) => {
                        const cx = getPlotX(cust.recency);
                        const cy = getPlotY(cust.monetary);
                        const config = CLUSTER_CONFIG[cust.clusterId] || { color: '#818cf8' };
                        const isSelected = selectedClusterFilter === 'all' || selectedClusterFilter === cust.clusterId;
                        const isHovered = hoveredCustomerPoint?.id === cust.id;

                        return (
                          <g key={`point-${cust.id}`}>
                            {isHovered && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r="10"
                                fill={config.color}
                                fillOpacity="0.25"
                                className="animate-ping"
                              />
                            )}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isHovered ? 7 : isSelected ? 5 : 3.5}
                              fill={config.color}
                              fillOpacity={isSelected ? 0.85 : 0.15}
                              stroke={isHovered ? 'var(--color-ink, #ffffff)' : 'transparent'}
                              strokeWidth={isHovered ? 2 : 1}
                              className="transition-all duration-200 cursor-pointer"
                              onMouseEnter={() => setHoveredCustomerPoint(cust)}
                              onMouseLeave={() => setHoveredCustomerPoint(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Interactive Tooltip Card */}
                    {hoveredCustomerPoint && (
                      <div
                        className="absolute pointer-events-none z-10 bg-card-elevated text-ink rounded-lg shadow-xl p-3 text-xs border border-border-strong max-w-xs transition-transform"
                        style={{
                          left: `${(getPlotX(hoveredCustomerPoint.recency) / chartWidth) * 100}%`,
                          top: `${(getPlotY(hoveredCustomerPoint.monetary) / chartHeight) * 100}%`,
                          transform: 'translate(-50%, -125%)'
                        }}
                      >
                        <div className="font-semibold text-ink flex items-center justify-between gap-3 border-b border-border-subtle pb-1.5 mb-1.5">
                          <span className="truncate">{hoveredCustomerPoint.name}</span>
                          <span className="text-[10px] text-muted font-mono shrink-0">ID: #{hoveredCustomerPoint.id}</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-muted">
                          <div className="flex justify-between gap-3">
                            <span className="text-muted">Cluster:</span>
                            <span className="font-medium text-amber-400">
                              {CLUSTER_CONFIG[hoveredCustomerPoint.clusterId]?.label || hoveredCustomerPoint.clusterId}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted">Recency:</span>
                            <span className="font-mono text-ink">{hoveredCustomerPoint.recency} days ago</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted">Frequency:</span>
                            <span className="font-mono text-ink">{hoveredCustomerPoint.frequency} orders</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted">Total Spend:</span>
                            <span className="font-mono font-medium text-emerald-400">{formatCurrency(hoveredCustomerPoint.monetary)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scatter Legend */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" /> Customer Data Point
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-dashed border-border-strong inline-flex items-center justify-center text-[8px] font-bold">+</span>
                        Cluster Centroid Center
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">Plotted: {allCustomers.length} active customer profiles</span>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <p className="text-sm text-muted py-8 text-center">Loading customer segments or no data available.</p>
        )}
      </div>
    </div>
  );
}
