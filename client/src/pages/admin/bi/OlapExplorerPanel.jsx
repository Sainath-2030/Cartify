import {
  BarChart3,
  PieChart,
  RefreshCw,
  Activity,
  Filter,
  Target,
  Box,
  SlidersHorizontal,
  Table,
  Code2,
  X
} from 'lucide-react';
import { formatCurrency, formatNumber, grainLabels } from './biShared.js';

/**
 * Section 4: Interactive multi-dimensional OLAP slice, dice, drill-down and roll-up.
 *
 * Presentational component. All data fetching and state ownership live in
 * AdminBIDashboard.jsx; this module only renders.
 */
export default function OlapExplorerPanel({
  olapLoading,
  olapData,
  olapError,
  olapTimeGrain,
  setOlapTimeGrain,
  olapCubeMode,
  setOlapCubeMode,
  olapMetric,
  setOlapMetric,
  olapCategoryId,
  setOlapCategoryId,
  olapQuarter,
  setOlapQuarter,
  olapPriceTier,
  setOlapPriceTier,
  olapActivityTier,
  setOlapActivityTier,
  hoveredOlapCell,
  setHoveredOlapCell,
  showSqlPreview,
  setShowSqlPreview,
  fetchOlapCube
}) {
  return (
    <>
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
  <div className="bg-card-elevated border border-border-subtle rounded-xl p-4 space-y-4 shadow-xs">
    {/* Row 1: Temporal Roll-Up / Drill-Down Switcher */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-bold text-ink uppercase tracking-wider">
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
                ? 'bg-accent text-stone-900 shadow-xs font-bold'
                : 'bg-card border border-border-subtle text-muted hover:bg-card-elevated hover:text-ink'
            }`}
            title={grain.desc}
          >
            {grain.label}
          </button>
        ))}
      </div>
    </div>

    {/* Row 2: Cube Mode & Metric Switcher */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
      {/* Cube Aggregation Mode */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-ink">2. Aggregation Operator:</span>
        <div className="inline-flex items-center rounded-lg border border-border-subtle bg-card p-0.5 shadow-xs text-xs">
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
                  ? 'bg-amber-500 text-stone-900 font-bold shadow-xs'
                  : 'text-muted hover:text-ink hover:bg-card-elevated'
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
        <span className="text-xs font-semibold text-ink">3. Target Fact Metric:</span>
        <div className="inline-flex items-center rounded-lg border border-border-subtle bg-card p-0.5 shadow-xs text-xs">
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
                  : 'text-muted hover:text-ink hover:bg-card-elevated'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Row 3: Slicing & Dicing Coordinate Selectors */}
    <div className="pt-3 border-t border-border-subtle">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
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
            className="text-[11px] text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition cursor-pointer"
          >
            <X className="w-3 h-3" /> Reset All Dice Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Category Slice */}
        <div>
          <label className="block text-[11px] font-medium text-muted mb-1">
            Category Slice (<code>dim_product</code>)
          </label>
          <select
            value={olapCategoryId}
            onChange={(e) => setOlapCategoryId(e.target.value)}
            className="w-full bg-card border border-border-subtle text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
          <label className="block text-[11px] font-medium text-muted mb-1">
            Quarter Slice (<code>dim_time</code>)
          </label>
          <select
            value={olapQuarter}
            onChange={(e) => setOlapQuarter(e.target.value)}
            className="w-full bg-card border border-border-subtle text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
          <label className="block text-[11px] font-medium text-muted mb-1">
            Price Hierarchy (<code>dim_product</code>)
          </label>
          <select
            value={olapPriceTier}
            onChange={(e) => setOlapPriceTier(e.target.value)}
            className="w-full bg-card border border-border-subtle text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
          <label className="block text-[11px] font-medium text-muted mb-1">
            Customer Cohort (<code>dim_customer</code>)
          </label>
          <select
            value={olapActivityTier}
            onChange={(e) => setOlapActivityTier(e.target.value)}
            className="w-full bg-card border border-border-subtle text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-border-subtle">
          <span className="text-[11px] text-muted font-medium">Active Sub-Cube Coordinates:</span>
          {olapCategoryId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
              Category: {olapData?.metadata?.categories?.find(c => String(c.categoryId) === String(olapCategoryId))?.categoryName || olapCategoryId}
              <button onClick={() => setOlapCategoryId('all')} className="hover:text-red-500 ml-0.5 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {olapQuarter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Quarter: Q{olapQuarter}
              <button onClick={() => setOlapQuarter('all')} className="hover:text-red-500 ml-0.5 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {olapPriceTier !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Tier: {olapPriceTier}
              <button onClick={() => setOlapPriceTier('all')} className="hover:text-red-500 ml-0.5 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {olapActivityTier !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Customer: {olapActivityTier}
              <button onClick={() => setOlapActivityTier('all')} className="hover:text-red-500 ml-0.5 cursor-pointer">
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
      <div className="bg-card border border-border-subtle rounded-lg p-3">
        <span className="text-[11px] text-muted font-medium block">Diced Net Revenue</span>
        <span className="text-base font-bold text-ink font-mono">
          {formatCurrency(olapData.summary.netRevenue)}
        </span>
        <span className="text-[10px] text-muted block mt-0.5">
          Gross: {formatCurrency(olapData.summary.grossRevenue)}
        </span>
      </div>
      <div className="bg-card border border-border-subtle rounded-lg p-3">
        <span className="text-[11px] text-muted font-medium block">Units Sold in Cube</span>
        <span className="text-base font-bold text-indigo-400 font-mono">
          {formatNumber(olapData.summary.unitsSold)}
        </span>
        <span className="text-[10px] text-muted block mt-0.5">
          Across {olapData.summary.productsTransacted} products
        </span>
      </div>
      <div className="bg-card border border-border-subtle rounded-lg p-3">
        <span className="text-[11px] text-muted font-medium block">Orders in Sub-Cube</span>
        <span className="text-base font-bold text-emerald-400 font-mono">
          {formatNumber(olapData.summary.orderCount)}
        </span>
        <span className="text-[10px] text-muted block mt-0.5">
          By {olapData.summary.activeCustomers} customers
        </span>
      </div>
      <div className="bg-card border border-border-subtle rounded-lg p-3">
        <span className="text-[11px] text-muted font-medium block">Sub-Cube AOV</span>
        <span className="text-base font-bold text-amber-500 font-mono">
          {formatCurrency(olapData.summary.averageOrderValue)}
        </span>
        <span className="text-[10px] text-muted block mt-0.5">
          Revenue per order
        </span>
      </div>
      <div className="bg-card border border-border-subtle rounded-lg p-3 col-span-2 sm:col-span-1">
        <span className="text-[11px] text-muted font-medium block">Aggregated Cells</span>
        <span className="text-base font-bold text-purple-400 font-mono">
          {olapData.cubeCells?.length || 0} Cells
        </span>
        <span className="text-[10px] text-muted block mt-0.5">
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
      <div className="bg-card-elevated border border-border-subtle rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                Category Contribution
              </h4>
              <p className="text-xs text-muted mt-0.5">
                Sub-cube distribution across categories
              </p>
            </div>
          </div>

          <div className="space-y-3 my-2">
            {(() => {
              // Aggregate pivotData by category
              const catTotals = {};
              (olapData.pivotData || []).forEach(p => {
                const cat = p.categoryName || p.colDim || 'Unknown';
                catTotals[cat] = (catTotals[cat] || 0) + (
                  olapMetric === 'gross_revenue' ? p.netRevenue : // fallback if gross not in pivot
                  olapMetric === 'units_sold' ? p.unitsSold :
                  olapMetric === 'order_count' ? p.orderCount :
                  p.netRevenue
                );
              });

              const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
              const subTotalSum = sortedCats.reduce((sum, [, val]) => sum + val, 0) || 1;

              if (sortedCats.length === 0) {
                return <p className="text-xs text-muted text-center py-8">No category slice data.</p>;
              }

              return sortedCats.slice(0, 5).map(([catName, val], idx) => {
                const sharePct = Math.round((val / subTotalSum) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink truncate max-w-[140px]">{catName}</span>
                      <span className="font-mono text-ink font-semibold">
                        {olapMetric.includes('revenue') ? formatCurrency(val) : formatNumber(val)} ({sharePct}%)
                      </span>
                    </div>
                    <div className="w-full bg-card h-2 rounded-full overflow-hidden border border-border-subtle">
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

        <div className="border-t border-border-subtle pt-2 text-[11px] text-muted flex items-center justify-between">
          <span>Metric: <code>{olapMetric}</code></span>
          <span className="text-ink font-medium">Auto-Normalized</span>
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
            const r = item.rowDim || item.categoryName;
            const c = item.colDim || item.priceTier;
            if (r && c) {
              rowKeySet.add(r);
              colKeySet.add(c);
              cellLookup[`${r}__${c}`] = item;
            }
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
              <thead className="bg-card-elevated text-muted uppercase tracking-wider font-semibold border-b border-border-subtle font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3 min-w-[160px] text-ink">
                    {isCustomerMode ? 'Customer Tier' : 'Product Category'}
                  </th>
                  {colKeys.map(col => (
                    <th key={col} className="px-4 py-3 text-right text-muted">
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right bg-card-elevated text-ink font-bold">
                    {isCustomerMode ? 'Customer Subtotal' : 'Category Subtotal'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-card">
                {rowKeys.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(colKeys.length + 2, 3)} className="px-4 py-8 text-center text-muted text-xs">
                      No cross-tabulation records available for the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  rowKeys.map(rowKey => {
                    const rowSub = rowSubtotals[rowKey];
                    return (
                      <tr key={rowKey} className="hover:bg-card-elevated/70 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-ink">
                          {rowKey}
                        </td>
                        {colKeys.map(colKey => {
                          const cellItem = cellLookup[`${rowKey}__${colKey}`];
                          const val = getCellValue(cellItem);
                          const intensity = val > 0 ? Math.min(100, Math.round((val / maxVal) * 100)) : 0;

                          // Heatmap background color styling
                          let cellBg = '';
                          let cellText = 'text-muted';
                          if (val > 0) {
                            if (intensity >= 75) {
                              cellBg = 'bg-amber-500 text-stone-950 font-bold';
                              cellText = 'text-stone-950';
                            } else if (intensity >= 40) {
                              cellBg = 'bg-amber-400/80 text-stone-950 font-semibold';
                              cellText = 'text-stone-950';
                            } else if (intensity >= 15) {
                              cellBg = 'bg-amber-500/25 text-ink';
                              cellText = 'text-ink';
                            } else {
                              cellBg = 'bg-amber-500/10 text-muted';
                              cellText = 'text-muted';
                            }
                          }

                          return (
                            <td
                              key={colKey}
                              onClick={() => {
                                if (cellItem) {
                                  if (isCustomerMode) {
                                    setOlapActivityTier(rowKey);
                                    const cat = olapData?.metadata?.categories?.find(c => c.categoryName === colKey);
                                    if (cat) setOlapCategoryId(cat.categoryId);
                                  } else {
                                    const cat = olapData?.metadata?.categories?.find(c => c.categoryName === rowKey);
                                    if (cat) setOlapCategoryId(cat.categoryId);
                                    setOlapPriceTier(colKey);
                                  }
                                }
                              }}
                              className={`px-4 py-2.5 text-right font-mono transition-colors cursor-pointer ${cellBg} ${cellText}`}
                              title={isCustomerMode ? `Click to Dice by Tier: ${rowKey} AND Category: ${colKey}` : `Click to Dice by Category: ${rowKey} AND Tier: ${colKey}`}
                            >
                              {cellItem ? (
                                <span>
                                  {olapMetric.includes('revenue') ? formatCurrency(val) : formatNumber(val)}
                                </span>
                              ) : (
                                <span className="text-muted/40 font-normal">—</span>
                              )}
                            </td>
                          );
                        })}
                        {/* Row Subtotal */}
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-ink bg-card-elevated/40">
                          {rowSub ? (
                            olapMetric.includes('revenue') ? formatCurrency(getCellValue(rowSub)) : formatNumber(getCellValue(rowSub))
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Tier Subtotals Bottom Row */}
                {rowKeys.length > 0 && (
                  <tr className="bg-card-elevated font-semibold border-t-2 border-border-strong text-ink">
                    <td className="px-4 py-3 uppercase tracking-wider text-[11px] font-bold text-muted">
                      {isCustomerMode ? 'Category Subtotal' : 'Tier Subtotal'}
                    </td>
                    {colKeys.map(colKey => {
                      const colSub = colSubtotals[colKey];
                      const val = getCellValue(colSub);
                      return (
                        <td key={colKey} className="px-4 py-3 text-right font-mono font-bold text-ink">
                          {colSub ? (
                            olapMetric.includes('revenue') ? formatCurrency(val) : formatNumber(val)
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })}
                    {/* Grand Total Corner Cell */}
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-amber-950 bg-amber-400 border-l border-amber-500">
                      {matrixGrandTotal ? (
                        olapMetric.includes('revenue') ? formatCurrency(getCellValue(matrixGrandTotal)) : formatNumber(getCellValue(matrixGrandTotal))
                      ) : (
                        formatCurrency(olapData?.summary?.netRevenue || 0)
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          );
        })()
      )}
    </div>

    <div className="bg-card-elevated px-4 py-2.5 border-t border-border-subtle text-[11px] text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <span>
        OLAP Operator: <strong className="text-ink font-mono">{olapCubeMode.toUpperCase()}</strong> | Granularity: <strong className="text-ink font-mono">{olapTimeGrain}</strong>
      </span>
      <span className="font-mono text-muted">
        Interactive Slicing & Dicing Enabled
      </span>
    </div>
  </div>
</div>

    </>
  );
}
