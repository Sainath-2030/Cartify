import {
  Users,
  RefreshCw,
  Filter,
  Lightbulb,
  Target
} from 'lucide-react';
import { formatCurrency, CLUSTER_CONFIG } from './biShared.js';

/**
 * Section 3: RFM K-Means customer segmentation with interactive behavioural cohort map.
 *
 * Presentational component. All data fetching and state ownership live in
 * AdminBIDashboard.jsx; this module only renders.
 */
export default function CustomerSegmentsPanel({
  customerSegments,
  customerSegmentsError,
  fetchCustomerSegments,
  selectedClusterFilter,
  setSelectedClusterFilter,
  hoveredCustomerPoint,
  setHoveredCustomerPoint
}) {
  return (
    <>
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
              {hoveredCustomerPoint && (() => {
                const plotY = getPlotY(hoveredCustomerPoint.monetary);
                const isNearTop = plotY < 85;
                return (
                  <div
                    className="absolute pointer-events-none z-10 bg-card-elevated text-ink rounded-lg shadow-xl p-3 text-xs border border-border-strong max-w-xs transition-transform"
                    style={{
                      left: `${(getPlotX(hoveredCustomerPoint.recency) / chartWidth) * 100}%`,
                      top: `${(plotY / chartHeight) * 100}%`,
                      transform: isNearTop ? 'translate(-50%, 15px)' : 'translate(-50%, -125%)'
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
              );
            })()}
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
    </>
  );
}
