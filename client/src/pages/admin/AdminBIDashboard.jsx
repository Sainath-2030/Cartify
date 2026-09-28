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
  Target,
  Box,
  SlidersHorizontal,
  Table,
  Flame,
  Code2,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Split
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

const CLUSTER_CONFIG = {
  champions: {
    label: 'Champions / High-Value',
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  loyal: {
    label: 'Loyal Customers',
    color: '#0ea5e9',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  at_risk: {
    label: 'At-Risk / Potential Churn',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  new_inactive: {
    label: 'New / Inactive Explorers',
    color: '#8b5cf6',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-800 border-violet-200'
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

  // Section 4: Interactive Multi-Dimensional OLAP Slice & Dice State
  const [olapLoading, setOlapLoading] = useState(false);
  const [olapData, setOlapData] = useState(null);
  const [olapError, setOlapError] = useState(false);
  const [olapTimeGrain, setOlapTimeGrain] = useState('month');
  const [olapCubeMode, setOlapCubeMode] = useState('cube');
  const [olapMetric, setOlapMetric] = useState('net_revenue');
  const [olapCategoryId, setOlapCategoryId] = useState('all');
  const [olapQuarter, setOlapQuarter] = useState('all');
  const [olapPriceTier, setOlapPriceTier] = useState('all');
  const [olapActivityTier, setOlapActivityTier] = useState('all');
  const [hoveredOlapCell, setHoveredOlapCell] = useState(null);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

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

  const fetchOlapCube = useCallback(async () => {
    setOlapLoading(true);
    setOlapError(false);
    try {
      const res = await adminService.getOlapCube({
        timeGrain: olapTimeGrain,
        cubeMode: olapCubeMode,
        metric: olapMetric,
        categoryId: olapCategoryId !== 'all' ? olapCategoryId : undefined,
        quarter: olapQuarter !== 'all' ? olapQuarter : undefined,
        priceTier: olapPriceTier !== 'all' ? olapPriceTier : undefined,
        activityTier: olapActivityTier !== 'all' ? olapActivityTier : undefined
      });
      const data = res?.data || res;
      setOlapData(data);
    } catch (err) {
      console.error('Failed to load OLAP cube data:', err);
      setOlapError(true);
    } finally {
      setOlapLoading(false);
    }
  }, [olapTimeGrain, olapCubeMode, olapMetric, olapCategoryId, olapQuarter, olapPriceTier, olapActivityTier]);

  useEffect(() => {
    fetchOlapCube();
  }, [fetchOlapCube]);

  const handleTriggerETL = async () => {
    try {
      setEtlRefreshing(true);
      const res = await adminService.triggerWarehouseEtl();
      showToast(res.message || 'ETL Warehouse refresh completed successfully!', 'success');
      await Promise.all([
        fetchDashboardData(),
        fetchOlapCube()
      ]);
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

      {/* Market Basket Analysis & Association Rules (Apriori Engine) */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs mt-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2 font-display">
              <Network className="w-5 h-5 text-indigo-600" />
              Market Basket Analysis (Apriori Association Rules)
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Mining transactional purchase records to discover itemsets frequently bought together.
            </p>
          </div>
          <div className="flex-shrink-0 bg-stone-50 p-4 rounded-lg border border-stone-200/60 min-w-[300px]">
            <h4 className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5" /> Rule Hyperparameters
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-600 font-medium">Min Support</span>
                  <span className="font-mono text-stone-900">{(minSupport * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.10"
                  step="0.005"
                  value={minSupport}
                  onChange={(e) => setMinSupport(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-600 font-medium">Min Confidence</span>
                  <span className="font-mono text-stone-900">{(minConfidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-600 font-medium">Display Limit</span>
                </div>
                <select
                  value={rulesLimit}
                  onChange={(e) => setRulesLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full bg-white border border-stone-200 text-stone-700 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <div className="overflow-x-auto rounded-lg border border-stone-200/60">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-stone-50 text-stone-600 text-xs uppercase tracking-wider font-semibold border-b border-stone-200/60">
              <tr>
                <th className="px-4 py-3">Antecedent (If bought...)</th>
                <th className="px-4 py-3">Consequent (...then buys)</th>
                <th className="px-4 py-3 text-right">Support</th>
                <th className="px-4 py-3 text-right">Confidence</th>
                <th className="px-4 py-3 text-right">Lift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700 bg-white">
              {associationRules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-stone-400 text-sm">
                    No rules discovered for these thresholds. Try lowering the minimum support or confidence.
                  </td>
                </tr>
              ) : (
                (rulesLimit === 'all' ? associationRules : associationRules.slice(0, rulesLimit)).map((rule, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-900 max-w-[200px] truncate" title={rule.antecedentNames.join(', ')}>
                      {rule.antecedentNames.join(', ')}
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-700 max-w-[200px] truncate" title={rule.consequentNames.join(', ')}>
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
                        rule.lift >= 2.0 ? 'bg-emerald-100 text-emerald-800' :
                        rule.lift > 1.0 ? 'bg-sky-100 text-sky-800' :
                        'bg-stone-100 text-stone-600'
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
        <div className="mt-3 text-xs text-stone-400 text-right flex justify-between items-center">
          <span>{rulesLimit !== 'all' && associationRules.length > rulesLimit ? `Showing top ${rulesLimit} out of ${associationRules.length} rules` : ''}</span>
          <span>Total rules discovered: {associationRules.length}</span>
        </div>
      </div>

      {/* Customer Segmentation & RFM Clustering (K-Means Engine) */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                <Users className="w-3.5 h-3.5" />
                Unsupervised Machine Learning
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-mono">K-Means (K=4, Min-Max Scaled)</span>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2 font-display">
              Customer Segmentation (RFM K-Means Clustering)
            </h3>
            <p className="text-sm text-stone-500 mt-0.5">
              Behavioral cohorts grouped along 3 dimensions: Recency (days), Frequency (order count), and Monetary (total gross spend).
            </p>
          </div>
          {customerSegments && (
            <button
              onClick={fetchCustomerSegments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-cluster Cohorts
            </button>
          )}
        </div>

        {customerSegmentsError ? (
          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg flex items-center justify-between">
            <span>Failed to load customer segments.</span>
            <button onClick={fetchCustomerSegments} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 font-medium transition-colors">
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
                      color: '#6366f1',
                      bg: 'bg-stone-50',
                      border: 'border-stone-200',
                      text: 'text-stone-800',
                      dot: 'bg-stone-500',
                      badge: 'bg-stone-100 text-stone-800 border-stone-200'
                    };
                    const isSelected = selectedClusterFilter === cluster.id;
                    return (
                      <div
                        key={cluster.id}
                        onClick={() => setSelectedClusterFilter(isSelected ? 'all' : cluster.id)}
                        className={`border rounded-xl p-4 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? `${config.border} ring-2 ring-purple-500/40 bg-white shadow-sm`
                            : `${config.border} ${config.bg}/40 hover:bg-white hover:shadow-xs`
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                              <h4 className="font-semibold text-stone-900 text-sm leading-tight">{cluster.label}</h4>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border flex-shrink-0 ml-1 ${config.badge}`}>
                              {cluster.customerCount} {cluster.customerCount === 1 ? 'User' : 'Users'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-stone-600">
                              <span>Avg Recency:</span>
                              <span className="font-medium text-stone-900 font-mono">{cluster.averageRecency} days</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                              <span>Avg Frequency:</span>
                              <span className="font-medium text-stone-900 font-mono">{cluster.averageFrequency} orders</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                              <span>Avg Monetary:</span>
                              <span className="font-medium text-stone-900 font-mono">{formatCurrency(cluster.averageMonetary)}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                              <span>Avg Order Value:</span>
                              <span className="font-medium text-stone-900 font-mono">{formatCurrency(cluster.averageOrderValue)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Suggested Strategy */}
                        <div className="mt-3.5 pt-3 border-t border-stone-200/60">
                          <div className="flex items-start gap-1.5 text-xs">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-stone-800 text-[11px] block">Suggested Strategy:</span>
                              <p className="text-[11px] text-stone-600 leading-snug mt-0.5">{cluster.strategy}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive 2D Scatter Plot (Recency vs. Monetary) */}
                <div className="border border-stone-200/80 rounded-xl p-5 bg-stone-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        2D Behavioral Cohort Map (Recency vs. Monetary Spend)
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Interactive customer distribution. Hover over individual data points or filter by cluster cohort below.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedClusterFilter('all')}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          selectedClusterFilter === 'all'
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
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
                                ? `${config.badge} font-semibold shadow-xs ring-1 ring-stone-900/10`
                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
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
                  <div className="relative bg-white border border-stone-200/80 rounded-lg p-3 overflow-x-auto shadow-xs">
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
                              stroke="#f1f5f9"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={axisLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] fill-stone-400 font-mono"
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
                              stroke="#f1f5f9"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={x}
                              y={axisBottom + 18}
                              textAnchor="middle"
                              className="text-[10px] fill-stone-400 font-mono"
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
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      />
                      <line
                        x1={axisLeft}
                        y1={axisTop}
                        x2={axisLeft}
                        y2={axisBottom}
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      />

                      {/* Axis Titles */}
                      <text
                        x={axisLeft + (axisRight - axisLeft) / 2}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        className="text-[11px] fill-stone-500 font-medium"
                      >
                        Recency (Days Since Last Order) ➔
                      </text>
                      <text
                        x={-(axisTop + (axisBottom - axisTop) / 2)}
                        y={22}
                        textAnchor="middle"
                        transform="rotate(-90)"
                        className="text-[11px] fill-stone-500 font-medium"
                      >
                        Monetary Value (Total Spend in $) ➔
                      </text>

                      {/* Cluster Centroids */}
                      {customerSegments.clusters.map((cluster) => {
                        if (cluster.customerCount === 0) return null;
                        const cx = getPlotX(cluster.averageRecency);
                        const cy = getPlotY(cluster.averageMonetary);
                        const config = CLUSTER_CONFIG[cluster.id] || { color: '#6366f1' };
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
                        const config = CLUSTER_CONFIG[cust.clusterId] || { color: '#6366f1' };
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
                              stroke={isHovered ? '#1e293b' : '#ffffff'}
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
                        className="absolute pointer-events-none z-10 bg-stone-900/95 backdrop-blur-xs text-white rounded-lg shadow-xl p-3 text-xs border border-stone-700 max-w-xs transition-transform"
                        style={{
                          left: `${(getPlotX(hoveredCustomerPoint.recency) / chartWidth) * 100}%`,
                          top: `${(getPlotY(hoveredCustomerPoint.monetary) / chartHeight) * 100}%`,
                          transform: 'translate(-50%, -125%)'
                        }}
                      >
                        <div className="font-semibold text-stone-100 flex items-center justify-between gap-3 border-b border-stone-800 pb-1.5 mb-1.5">
                          <span className="truncate">{hoveredCustomerPoint.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono flex-shrink-0">ID: #{hoveredCustomerPoint.id}</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-stone-300">
                          <div className="flex justify-between gap-3">
                            <span className="text-stone-400">Cluster:</span>
                            <span className="font-medium text-amber-300">
                              {CLUSTER_CONFIG[hoveredCustomerPoint.clusterId]?.label || hoveredCustomerPoint.clusterId}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-stone-400">Recency:</span>
                            <span className="font-mono text-stone-100">{hoveredCustomerPoint.recency} days ago</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-stone-400">Frequency:</span>
                            <span className="font-mono text-stone-100">{hoveredCustomerPoint.frequency} orders</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-stone-400">Total Spend:</span>
                            <span className="font-mono font-medium text-emerald-400">{formatCurrency(hoveredCustomerPoint.monetary)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scatter Legend */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" /> Customer Data Point
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-dashed border-stone-600 inline-flex items-center justify-center text-[8px] font-bold">+</span>
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
          <p className="text-sm text-stone-500 py-8 text-center">Loading customer segments or no data available.</p>
        )}
      </div>

      {/* SECTION 4: Interactive Multi-Dimensional OLAP Slice & Dice (CUBE & ROLLUP) */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs mt-8 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                <Box className="w-3.5 h-3.5 text-amber-600" />
                PostgreSQL GROUP BY CUBE & ROLLUP
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-mono">DWM Section 4 Engine</span>
            </div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight font-display flex items-center gap-2">
              Multi-Dimensional OLAP Analytics (Slice, Dice, Roll-Up & Drill-Down)
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-3xl">
              Execute dynamic multi-dimensional queries across Star Schema facts (<code className="text-stone-800 font-mono">fact_sales</code>) and dimensions (<code className="text-stone-800 font-mono">dim_time</code>, <code className="text-stone-800 font-mono">dim_product</code>, <code className="text-stone-800 font-mono">dim_customer</code>). Drill down through temporal hierarchies, slice by single dimensions, or dice across multiple coordinate criteria simultaneously.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition shadow-xs"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showSqlPreview ? 'Hide OLAP SQL' : 'View OLAP SQL & Theory'}</span>
            </button>
            <button
              onClick={fetchOlapCube}
              disabled={olapLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${olapLoading ? 'animate-spin' : ''}`} />
              <span>{olapLoading ? 'Computing Cube...' : 'Execute OLAP'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible SQL Query & Academic OLAP Theory Inspector */}
        {showSqlPreview && (
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-stone-50 to-purple-50/50 p-5 text-xs text-stone-700 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-stone-900 font-display">Academic Concept: Multi-Dimensional OLAP Operations</span>
              </div>
              <span className="font-mono text-[11px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                Mode: {olapCubeMode.toUpperCase()} | Grain: {olapTimeGrain.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
              <div className="bg-white/90 p-3 rounded-lg border border-stone-200/70">
                <span className="font-bold text-stone-900 block mb-1">1. CUBE Operation (2ⁿ Subsets)</span>
                <p className="text-stone-600 leading-relaxed">
                  Computes all 2ⁿ possible groupings of the specified n dimensions. Generates simultaneous cross-tabular aggregations, sub-totals, and grand totals tagged via PostgreSQL <code className="text-indigo-600 font-mono">GROUPING()</code> bitmasks.
                </p>
              </div>
              <div className="bg-white/90 p-3 rounded-lg border border-stone-200/70">
                <span className="font-bold text-stone-900 block mb-1">2. ROLLUP Operation (n+1 Levels)</span>
                <p className="text-stone-600 leading-relaxed">
                  Generates hierarchical aggregations along a directed path: <code className="text-indigo-600 font-mono">Year ➔ Quarter ➔ Month ➔ Total</code>. Enables strategic executives to zoom in (drill-down) or zoom out (roll-up).
                </p>
              </div>
              <div className="bg-white/90 p-3 rounded-lg border border-stone-200/70">
                <span className="font-bold text-stone-900 block mb-1">3. Slicing vs. Dicing</span>
                <p className="text-stone-600 leading-relaxed">
                  <strong>Slice:</strong> Fixing 1 dimension (e.g. <code className="text-indigo-600 font-mono">Category = Electronics</code>).<br />
                  <strong>Dice:</strong> Extracting a sub-cube across 2+ dimensions simultaneously (e.g. <code className="text-indigo-600 font-mono">Category = Electronics AND Quarter = Q3 AND PriceTier = LUXURY</code>).
                </p>
              </div>
            </div>

            <div className="bg-stone-950 text-stone-100 p-4 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed border border-stone-800">
              <span className="text-emerald-400 font-semibold">-- Active PostgreSQL Star Schema Analytical Query</span>
              <pre className="mt-1 text-stone-300">
{`SELECT 
  ${olapCubeMode === 'rollup' ? 'dt.year, dt.quarter_name, dt.month_short_name' : olapCubeMode === 'customer_cube' ? 'dc.activity_tier, dp.category_name' : 'dp.category_name, dp.price_tier'},
  GROUPING(...) AS subtotal_flags,
  SUM(fs.net_revenue) AS net_revenue,
  SUM(fs.quantity_sold) AS units_sold,
  COUNT(DISTINCT fs.order_id) AS order_count
FROM fact_sales fs
JOIN dim_time dt ON fs.time_id = dt.time_id
JOIN dim_product dp ON fs.product_id = dp.product_id
LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
${[
  olapCategoryId !== 'all' ? `dp.category_id = ${olapCategoryId}` : null,
  olapQuarter !== 'all' ? `dt.quarter = ${olapQuarter}` : null,
  olapPriceTier !== 'all' ? `dp.price_tier = '${olapPriceTier}'` : null,
  olapActivityTier !== 'all' ? `dc.activity_tier = '${olapActivityTier}'` : null
].filter(Boolean).length > 0 ? `WHERE ${[
  olapCategoryId !== 'all' ? `dp.category_id = ${olapCategoryId}` : null,
  olapQuarter !== 'all' ? `dt.quarter = ${olapQuarter}` : null,
  olapPriceTier !== 'all' ? `dp.price_tier = '${olapPriceTier}'` : null,
  olapActivityTier !== 'all' ? `dc.activity_tier = '${olapActivityTier}'` : null
].filter(Boolean).join(' AND ')}` : '-- (No Dice coordinate constraints; full cube space)'}
GROUP BY ${olapCubeMode === 'rollup' ? 'ROLLUP(dt.year, dt.quarter_name, dt.month_short_name)' : olapCubeMode === 'customer_cube' ? 'CUBE(dc.activity_tier, dp.category_name)' : 'CUBE(dp.category_name, dp.price_tier)'};`}
              </pre>
            </div>
          </div>
        )}

        {/* OLAP Multi-Dimension Toolbar */}
        <div className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-4 space-y-4 shadow-xs">
          {/* Row 1: Temporal Roll-Up / Drill-Down Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                1. Temporal Drill-Down & Roll-Up Level:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'year', label: 'Yearly Roll-Up', desc: 'Highest strategic view' },
                { key: 'quarter', label: 'Quarterly', desc: 'Quarterly milestones' },
                { key: 'month', label: 'Monthly', desc: 'Standard business cadence' },
                { key: 'week', label: 'Weekly', desc: 'Tactical trend cycles' },
                { key: 'day', label: 'Daily Drill-Down', desc: 'Atomic day-level resolution' }
              ].map((grain) => (
                <button
                  key={grain.key}
                  onClick={() => setOlapTimeGrain(grain.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    olapTimeGrain === grain.key
                      ? 'bg-stone-900 text-white shadow-xs font-semibold'
                      : 'bg-white border border-stone-200/80 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                  title={grain.desc}
                >
                  {grain.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Cube Mode & Metric Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-stone-200/60">
            {/* Cube Aggregation Mode */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">2. Aggregation Operator:</span>
              <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white p-0.5 shadow-xs text-xs">
                {[
                  { key: 'cube', label: 'Product CUBE', desc: 'CUBE(Category, PriceTier)' },
                  { key: 'rollup', label: 'Temporal ROLLUP', desc: 'ROLLUP(Year, Quarter, Month)' },
                  { key: 'customer_cube', label: 'Customer Matrix', desc: 'CUBE(ActivityTier, Category)' },
                  { key: 'slice', label: 'Filtered Flat Slice', desc: 'Standard grouping without subtotals' }
                ].map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => setOlapCubeMode(mode.key)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      olapCubeMode === mode.key
                        ? 'bg-amber-500 text-stone-900 font-semibold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                    title={mode.desc}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">3. Target Fact Metric:</span>
              <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white p-0.5 shadow-xs text-xs">
                {[
                  { key: 'net_revenue', label: 'Net Revenue ($)' },
                  { key: 'gross_revenue', label: 'Gross Revenue ($)' },
                  { key: 'units_sold', label: 'Units Sold (#)' },
                  { key: 'order_count', label: 'Orders Count (#)' }
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setOlapMetric(m.key)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      olapMetric === m.key
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Slicing & Dicing Coordinate Selectors */}
          <div className="pt-3 border-t border-stone-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                4. Dice Filters (Constrain Multi-Dimensional Sub-Cube):
              </span>
              {(olapCategoryId !== 'all' || olapQuarter !== 'all' || olapPriceTier !== 'all' || olapActivityTier !== 'all') && (
                <button
                  onClick={() => {
                    setOlapCategoryId('all');
                    setOlapQuarter('all');
                    setOlapPriceTier('all');
                    setOlapActivityTier('all');
                  }}
                  className="text-[11px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <X className="w-3 h-3" /> Reset All Dice Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Slice */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Category Slice (<code>dim_product</code>)
                </label>
                <select
                  value={olapCategoryId}
                  onChange={(e) => setOlapCategoryId(e.target.value)}
                  className="w-full bg-white border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Categories ({olapData?.metadata?.categories?.length || 0})</option>
                  {(olapData?.metadata?.categories || []).map(cat => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName} ({cat.productCount} prods)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quarter Slice */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Quarter Slice (<code>dim_time</code>)
                </label>
                <select
                  value={olapQuarter}
                  onChange={(e) => setOlapQuarter(e.target.value)}
                  className="w-full bg-white border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Quarters (Q1 - Q4)</option>
                  {(olapData?.metadata?.quarters || []).map(q => (
                    <option key={q.quarter} value={q.quarter}>
                      {q.quarterName} (Quarter {q.quarter})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Tier Slice */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Price Hierarchy (<code>dim_product</code>)
                </label>
                <select
                  value={olapPriceTier}
                  onChange={(e) => setOlapPriceTier(e.target.value)}
                  className="w-full bg-white border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Price Tiers</option>
                  {(olapData?.metadata?.priceTiers || []).map(tier => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Activity Tier */}
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Customer Cohort (<code>dim_customer</code>)
                </label>
                <select
                  value={olapActivityTier}
                  onChange={(e) => setOlapActivityTier(e.target.value)}
                  className="w-full bg-white border border-stone-200 text-stone-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Customer Tiers</option>
                  {(olapData?.metadata?.activityTiers || []).map(tier => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Dice Filter Chips */}
            {(olapCategoryId !== 'all' || olapQuarter !== 'all' || olapPriceTier !== 'all' || olapActivityTier !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-stone-200/50">
                <span className="text-[11px] text-stone-500 font-medium">Active Sub-Cube Coordinates:</span>
                {olapCategoryId !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300">
                    Category: {olapData?.metadata?.categories?.find(c => String(c.categoryId) === String(olapCategoryId))?.categoryName || olapCategoryId}
                    <button onClick={() => setOlapCategoryId('all')} className="hover:text-red-700 ml-0.5 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {olapQuarter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-900 border border-indigo-300">
                    Quarter: Q{olapQuarter}
                    <button onClick={() => setOlapQuarter('all')} className="hover:text-red-700 ml-0.5 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {olapPriceTier !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Tier: {olapPriceTier}
                    <button onClick={() => setOlapPriceTier('all')} className="hover:text-red-700 ml-0.5 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {olapActivityTier !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-900 border border-purple-300">
                    Customer: {olapActivityTier}
                    <button onClick={() => setOlapActivityTier('all')} className="hover:text-red-700 ml-0.5 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* OLAP Sliced Sub-Cube KPI Strip */}
        {olapData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
              <span className="text-[11px] text-stone-500 font-medium block">Diced Net Revenue</span>
              <span className="text-base font-bold text-stone-900 font-mono">
                {formatCurrency(olapData.summary.netRevenue)}
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                Gross: {formatCurrency(olapData.summary.grossRevenue)}
              </span>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
              <span className="text-[11px] text-stone-500 font-medium block">Units Sold in Cube</span>
              <span className="text-base font-bold text-indigo-700 font-mono">
                {formatNumber(olapData.summary.unitsSold)}
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                Across {olapData.summary.productsTransacted} products
              </span>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
              <span className="text-[11px] text-stone-500 font-medium block">Orders in Sub-Cube</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {formatNumber(olapData.summary.orderCount)}
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                By {olapData.summary.activeCustomers} customers
              </span>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3">
              <span className="text-[11px] text-stone-500 font-medium block">Sub-Cube AOV</span>
              <span className="text-base font-bold text-amber-700 font-mono">
                {formatCurrency(olapData.summary.averageOrderValue)}
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                Revenue per order
              </span>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 rounded-lg p-3 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-stone-500 font-medium block">Aggregated Cells</span>
              <span className="text-base font-bold text-purple-700 font-mono">
                {olapData.cubeCells?.length || 0} Cells
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                {olapData.cubeCells?.filter(c => c.isSubtotal)?.length || 0} subtotals + 1 grand
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Visualizations: Sliced Time-Series Trend & Category Share */}
        {olapData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sliced Time-Series Trend SVG Chart */}
            <div className="lg:col-span-2 bg-stone-50/60 border border-stone-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      Diced Temporal Trend ({grainLabels[olapTimeGrain] || olapTimeGrain})
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Visualizing metric: <strong className="text-stone-700 font-mono">{olapMetric.replace('_', ' ').toUpperCase()}</strong> over time hierarchy
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-white border border-stone-200 font-mono text-stone-600">
                    {olapData.timeSeries?.length || 0} Periods
                  </span>
                </div>

                {/* SVG Bar Chart for Sliced TimeSeries */}
                <div className="py-4">
                  {(!olapData.timeSeries || olapData.timeSeries.length === 0) ? (
                    <p className="text-xs text-stone-400 text-center py-8">No time-series records for this coordinate selection.</p>
                  ) : (
                    (() => {
                      const getMetricVal = (row) => {
                        if (olapMetric === 'gross_revenue') return row.grossRevenue;
                        if (olapMetric === 'units_sold') return row.unitsSold;
                        if (olapMetric === 'order_count') return row.orderCount;
                        return row.netRevenue;
                      };

                      const maxVal = Math.max(...olapData.timeSeries.map(getMetricVal), 1);
                      const chartH = 140;
                      const barWidth = Math.min(42, Math.max(14, Math.floor(480 / Math.max(olapData.timeSeries.length, 1))));

                      return (
                        <div className="space-y-2">
                          <div className="h-44 flex items-end gap-2 overflow-x-auto pb-6 pt-2 px-2 border-b border-stone-200">
                            {olapData.timeSeries.map((row, idx) => {
                              const val = getMetricVal(row);
                              const heightPct = Math.max(6, Math.round((val / maxVal) * 100));
                              const isHovered = hoveredOlapCell?.periodKey === row.periodKey;

                              return (
                                <div
                                  key={idx}
                                  className="flex-1 min-w-[28px] max-w-[50px] flex flex-col items-center h-full justify-end group cursor-pointer relative"
                                  onMouseEnter={() => setHoveredOlapCell(row)}
                                  onMouseLeave={() => setHoveredOlapCell(null)}
                                >
                                  {/* Bar */}
                                  <div
                                    className={`w-full rounded-t-md transition-all duration-300 ${
                                      isHovered
                                        ? 'bg-amber-600 shadow-sm'
                                        : 'bg-amber-400 hover:bg-amber-500'
                                    }`}
                                    style={{ height: `${heightPct}%` }}
                                  />
                                  {/* X Label */}
                                  <span className="text-[10px] text-stone-500 truncate w-full text-center mt-1.5 font-mono select-none">
                                    {row.label?.split(' ')[0] || row.periodKey}
                                  </span>

                                  {/* Hover Tooltip */}
                                  {isHovered && (
                                    <div className="absolute bottom-full mb-2 z-20 bg-stone-900 text-white rounded-md p-2 text-[10px] shadow-lg border border-stone-700 whitespace-nowrap pointer-events-none">
                                      <p className="font-semibold text-amber-300">{row.label}</p>
                                      <p className="font-mono text-stone-200 mt-0.5">
                                        Net: {formatCurrency(row.netRevenue)}
                                      </p>
                                      <p className="font-mono text-stone-400">
                                        {row.unitsSold} units • {row.orderCount} orders
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-stone-400 pt-1">
                            <span>Drill level: <code>dim_time.{olapTimeGrain}</code></span>
                            <span className="font-mono text-stone-600 font-medium">
                              Peak: {olapMetric.includes('revenue') ? formatCurrency(maxVal) : formatNumber(maxVal)}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Sliced Product & Category Contribution */}
            <div className="bg-stone-50/60 border border-stone-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      Category Contribution
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Sub-cube distribution across categories
                    </p>
                  </div>
                </div>

                <div className="space-y-3 my-2">
                  {(() => {
                    // Aggregate pivotData by category
                    const catTotals = {};
                    (olapData.pivotData || []).forEach(p => {
                      catTotals[p.categoryName] = (catTotals[p.categoryName] || 0) + (
                        olapMetric === 'gross_revenue' ? p.netRevenue : // fallback if gross not in pivot
                        olapMetric === 'units_sold' ? p.unitsSold :
                        olapMetric === 'order_count' ? p.orderCount :
                        p.netRevenue
                      );
                    });

                    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
                    const subTotalSum = sortedCats.reduce((sum, [, val]) => sum + val, 0) || 1;

                    if (sortedCats.length === 0) {
                      return <p className="text-xs text-stone-400 text-center py-8">No category slice data.</p>;
                    }

                    return sortedCats.slice(0, 5).map(([catName, val], idx) => {
                      const sharePct = Math.round((val / subTotalSum) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-stone-800 truncate max-w-[140px]">{catName}</span>
                            <span className="font-mono text-stone-700 font-semibold">
                              {olapMetric.includes('revenue') ? formatCurrency(val) : formatNumber(val)} ({sharePct}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(4, sharePct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="border-t border-stone-200/60 pt-2 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Metric: <code>{olapMetric}</code></span>
                <span className="text-stone-600 font-medium">Auto-Normalized</span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive OLAP Cross-Tabulation Matrix / Heatmap */}
        <div className="border border-stone-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-stone-50 px-5 py-3.5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-600" />
                OLAP Cross-Tabulation Matrix (Heatmap Pivot Grid)
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Click any coordinate cell to slice the cube directly. Shading indicates relative metric magnitude.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-stone-500">
                <span className="w-2.5 h-2.5 rounded bg-amber-50 border border-stone-200" /> Lowest
              </span>
              <span className="text-stone-300">➔</span>
              <span className="flex items-center gap-1 text-stone-500">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Highest
              </span>
            </div>
          </div>

          {/* Matrix Content */}
          <div className="overflow-x-auto">
            {olapLoading ? (
              <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                Aggregating OLAP Cube with SQL CUBE/ROLLUP...
              </div>
            ) : olapError ? (
              <div className="py-8 text-center text-red-600 text-xs">
                Failed to compute OLAP cube data. Please verify database connectivity.
              </div>
            ) : olapCubeMode === 'rollup' ? (
              /* Temporal ROLLUP Hierarchical View */
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-stone-100/80 text-stone-700 uppercase tracking-wider font-semibold border-b border-stone-200 font-mono text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Hierarchy Path (Year ➔ Quarter ➔ Month)</th>
                    <th className="px-4 py-3 text-center">Aggregation Level</th>
                    <th className="px-4 py-3 text-right">Net Revenue</th>
                    <th className="px-4 py-3 text-right">Gross Revenue</th>
                    <th className="px-4 py-3 text-right">Units Sold</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Buyers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {(olapData?.cubeCells || []).map((cell, idx) => {
                    const isGrand = cell.isGrandTotal;
                    const isSub = cell.isSubtotal;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isGrand
                            ? 'bg-amber-100/60 font-bold text-stone-900 border-t-2 border-amber-300'
                            : isSub
                            ? 'bg-stone-50/80 font-semibold text-stone-800'
                            : 'hover:bg-amber-50/30 text-stone-700'
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                          <span
                            className="inline-block"
                            style={{ marginLeft: `${(3 - cell.aggregationLevel) * 16}px` }}
                          />
                          {isGrand ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-900">
                              ★ GRAND TOTAL
                            </span>
                          ) : isSub ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-200 text-stone-800">
                              ↳ Subtotal: {cell.dim1} {cell.dim2 || ''}
                            </span>
                          ) : (
                            <span className="font-mono text-stone-800">
                              {cell.dim1} • {cell.dim2} • {cell.dim3}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-[11px] text-stone-500">
                          Level {cell.aggregationLevel}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-stone-900">
                          {formatCurrency(cell.netRevenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-stone-600">
                          {formatCurrency(cell.grossRevenue)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-indigo-700">
                          {formatNumber(cell.unitsSold)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-stone-700">
                          {formatNumber(cell.orderCount)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-stone-500">
                          {formatNumber(cell.customerCount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Product CUBE / Customer Matrix Cross-Tabular Grid */
              (() => {
                const isCustomerMode = olapCubeMode === 'customer_cube';
                // Distinct Row keys
                const rowKeySet = new Set();
                const colKeySet = new Set();
                const cellLookup = {};

                (olapData?.pivotData || []).forEach(item => {
                  const r = item.categoryName;
                  const c = item.priceTier;
                  rowKeySet.add(r);
                  colKeySet.add(c);
                  cellLookup[`${r}__${c}`] = item;
                });

                // Also check cubeCells for subtotals
                const rowSubtotals = {};
                const colSubtotals = {};
                let matrixGrandTotal = null;

                (olapData?.cubeCells || []).forEach(cell => {
                  if (cell.isGrandTotal) {
                    matrixGrandTotal = cell;
                  } else if (cell.isDim1Subtotal && !cell.isDim2Subtotal) {
                    // Subtotal for dim2 across all dim1
                    colSubtotals[cell.dim2] = cell;
                  } else if (!cell.isDim1Subtotal && cell.isDim2Subtotal) {
                    // Subtotal for dim1 across all dim2
                    rowSubtotals[cell.dim1] = cell;
                  }
                });

                const rowKeys = Array.from(rowKeySet).sort();
                const colKeys = Array.from(colKeySet).sort();

                // Compute max metric across individual cells for heatmap shading
                const getCellValue = (item) => {
                  if (!item) return 0;
                  if (olapMetric === 'gross_revenue') return item.grossRevenue || item.netRevenue;
                  if (olapMetric === 'units_sold') return item.unitsSold;
                  if (olapMetric === 'order_count') return item.orderCount;
                  return item.netRevenue;
                };

                const cellValues = Object.values(cellLookup).map(getCellValue);
                const maxVal = Math.max(...cellValues, 1);

                return (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider font-semibold border-b border-stone-200 font-mono text-[11px]">
                      <tr>
                        <th className="px-4 py-3 min-w-[160px]">
                          {isCustomerMode ? 'Customer Tier' : 'Product Category'}
                        </th>
                        {colKeys.map(col => (
                          <th key={col} className="px-4 py-3 text-right">
                            {col}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right bg-stone-200/60 text-stone-900 font-bold">
                          Category Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {rowKeys.map(rowKey => {
                        const rowSub = rowSubtotals[rowKey];
                        return (
                          <tr key={rowKey} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-stone-900">
                              {rowKey}
                            </td>
                            {colKeys.map(colKey => {
                              const cellItem = cellLookup[`${rowKey}__${colKey}`];
                              const val = getCellValue(cellItem);
                              const intensity = val > 0 ? Math.min(100, Math.round((val / maxVal) * 100)) : 0;

                              // Heatmap background color styling
                              let cellBg = '';
                              let cellText = 'text-stone-700';
                              if (val > 0) {
                                if (intensity >= 75) {
                                  cellBg = 'bg-amber-500 text-white font-bold';
                                  cellText = 'text-stone-900';
                                } else if (intensity >= 40) {
                                  cellBg = 'bg-amber-300/80 font-semibold';
                                } else if (intensity >= 15) {
                                  cellBg = 'bg-amber-100';
                                } else {
                                  cellBg = 'bg-amber-50/60';
                                }
                              }

                              return (
                                <td
                                  key={colKey}
                                  onClick={() => {
                                    if (cellItem) {
                                      // Click coordinates to dice!
                                      const cat = olapData?.metadata?.categories?.find(c => c.categoryName === rowKey);
                                      if (cat) setOlapCategoryId(cat.categoryId);
                                      setOlapPriceTier(colKey);
                                    }
                                  }}
                                  className={`px-4 py-2.5 text-right font-mono transition-colors cursor-pointer ${cellBg} ${cellText}`}
                                  title={`Click to Dice by Category: ${rowKey} AND Tier: ${colKey}`}
                                >
                                  {cellItem ? (
                                    <span>
                                      {olapMetric.includes('revenue') ? formatCurrency(val) : formatNumber(val)}
                                    </span>
                                  ) : (
                                    <span className="text-stone-300 font-normal">—</span>
                                  )}
                                </td>
                              );
                            })}
                            {/* Row Subtotal */}
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-stone-900 bg-stone-100/60">
                              {rowSub ? (
                                olapMetric.includes('revenue') ? formatCurrency(getCellValue(rowSub)) : formatNumber(getCellValue(rowSub))
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Tier Subtotals Bottom Row */}
                      <tr className="bg-stone-100/90 font-semibold border-t-2 border-stone-300 text-stone-800">
                        <td className="px-4 py-3 uppercase tracking-wider text-[11px] font-bold text-stone-700">
                          Tier Subtotal
                        </td>
                        {colKeys.map(colKey => {
                          const colSub = colSubtotals[colKey];
                          const val = getCellValue(colSub);
                          return (
                            <td key={colKey} className="px-4 py-3 text-right font-mono font-bold text-stone-900">
                              {colSub ? (
                                olapMetric.includes('revenue') ? formatCurrency(val) : formatNumber(val)
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}
                        {/* Grand Total Corner Cell */}
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-amber-950 bg-amber-200 border-l border-amber-300">
                          {matrixGrandTotal ? (
                            olapMetric.includes('revenue') ? formatCurrency(getCellValue(matrixGrandTotal)) : formatNumber(getCellValue(matrixGrandTotal))
                          ) : (
                            formatCurrency(olapData?.summary?.netRevenue || 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                );
              })()
            )}
          </div>

          <div className="bg-stone-50 px-4 py-2.5 border-t border-stone-200 text-[11px] text-stone-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              OLAP Operator: <strong className="text-stone-700 font-mono">{olapCubeMode.toUpperCase()}</strong> | Granularity: <strong className="text-stone-700 font-mono">{olapTimeGrain}</strong>
            </span>
            <span className="font-mono text-stone-600">
              Interactive Slicing & Dicing Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

