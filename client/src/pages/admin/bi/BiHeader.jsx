import {
  RefreshCw,
  Database
} from 'lucide-react';
import { grainLabels } from './biShared.js';

/**
 * Section 1: BI dashboard header, time-grain switcher, and ETL refresh control.
 *
 * Presentational component. All data fetching and state ownership live in
 * AdminBIDashboard.jsx; this module only renders.
 */
export default function BiHeader({
  loading,
  etlRefreshing,
  timeGrain,
  setTimeGrain,
  etlHealth,
  handleTriggerETL
}) {
  return (
    <>
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
    </>
  );
}
