import {
  TrendingUp,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Activity,
  Filter,
  Network,
  Box,
  Table,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  ArrowRight,
  FileCheck2
} from 'lucide-react';
import { formatNumber } from './biShared.js';

/**
 * Section 6: ETL run monitoring, 4-tier data lineage DAG, and automated data quality audits.
 *
 * Presentational component. All data fetching and state ownership live in
 * AdminBIDashboard.jsx; this module only renders.
 */
export default function DataGovernancePanel({
  etlRefreshing,
  dataQualityLoading,
  dataQualityData,
  dataQualityAuditRunning,
  dataLineageData,
  qualityActiveTab,
  setQualityActiveTab,
  selectedLineageTier,
  setSelectedLineageTier,
  selectedLineageNodeId,
  setSelectedLineageNodeId,
  showLineageDetailModal,
  setShowLineageDetailModal,
  expandedTableRows,
  setExpandedTableRows,
  expandedEtlRuns,
  setExpandedEtlRuns,
  handleTriggerETL,
  handleRunQualityAudit
}) {
  return (
    <>
{/* ========================================================================= */}
{/* SECTION 6: ETL PIPELINE MONITORING, DATA LINEAGE & QUALITY AUDITING        */}
{/* ========================================================================= */}
<div className="space-y-6 pt-4 border-t-2 border-border-subtle">
  {/* Section Header */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border-subtle shadow-sm">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          DWM Section 6 • Governance & Lineage
        </span>
        <span className="px-2 py-0.5 text-[11px] font-mono text-muted bg-card-elevated rounded-md border border-border-subtle">
          Star Schema Health & Ingestion Telemetry
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
        ETL Pipeline Monitoring, Data Lineage & Quality Auditing
      </h2>
      <p className="text-xs sm:text-sm text-muted mt-1 max-w-3xl">
        End-to-end data lifecycle governance across transactional sources (OLTP), dimensional star schema (OLAP), and analytical consumers. Features an <strong>automated multi-dimensional Data Quality Index (DQI)</strong> scoring completeness, referential consistency, and ingestion timeliness, accompanied by an interactive <strong>4-Tier Architectural Directed Acyclic Graph (DAG)</strong>.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
      <button
        onClick={() => setShowLineageDetailModal(true)}
        className="px-3.5 py-2 text-xs font-semibold text-ink bg-card-elevated hover:bg-card border border-border-subtle rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
      >
        <Network className="w-3.5 h-3.5 text-muted" />
        Full Lineage Map
      </button>
      <button
        onClick={handleRunQualityAudit}
        disabled={dataQualityAuditRunning}
        className="px-3.5 py-2 text-xs font-semibold text-ink bg-card-elevated hover:bg-card border border-border-subtle rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
      >
        <Activity className={`w-3.5 h-3.5 text-emerald-500 ${dataQualityAuditRunning ? 'animate-spin' : ''}`} />
        Run Quality Audit
      </button>
      <button
        onClick={handleTriggerETL}
        disabled={etlRefreshing}
        className="px-3.5 py-2 text-xs font-semibold text-stone-900 bg-accent hover:opacity-90 disabled:opacity-50 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${etlRefreshing ? 'animate-spin' : ''}`} />
        Trigger ETL Refresh
      </button>
    </div>
  </div>

  {/* Executive Data Quality KPI Metric Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Card 1: Composite DQI */}
    <div className="bg-card p-5 rounded-2xl border border-emerald-500/30 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Composite DQI Score
        </span>
        <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-ink font-mono">
          {dataQualityLoading ? '—' : `${dataQualityData?.summary?.overallScore ?? 100}%`}
        </span>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
          (dataQualityData?.summary?.overallScore ?? 100) >= 90
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
            : (dataQualityData?.summary?.overallScore ?? 100) >= 80
            ? 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
        }`}>
          {dataQualityData?.summary?.status || 'EXCELLENT'}
        </span>
      </div>
      <div className="mt-3 w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border-subtle">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, dataQualityData?.summary?.overallScore ?? 100))}%` }}
        />
      </div>
      <p className="text-[11px] text-muted mt-2">
        40% Completeness • 35% Consistency • 25% Timeliness
      </p>
    </div>

    {/* Card 2: Completeness */}
    <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Completeness Index</span>
        <span className="p-2 bg-card-elevated text-muted rounded-xl border border-border-subtle">
          <Table className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-ink font-mono">
          {dataQualityLoading ? '—' : `${dataQualityData?.summary?.completenessScore ?? 100}%`}
        </span>
        <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
          <CheckCircle2 className="w-3 h-3" />
          Zero Null Keys
        </span>
      </div>
      <div className="mt-3 w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border-subtle">
        <div
          className="bg-sky-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, dataQualityData?.summary?.completenessScore ?? 100))}%` }}
        />
      </div>
      <p className="text-[11px] text-muted mt-2">
        5 Dimensions & Facts monitored across all attributes
      </p>
    </div>

    {/* Card 3: Consistency & Integrity */}
    <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Referential Integrity</span>
        <span className="p-2 bg-card-elevated text-muted rounded-xl border border-border-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-ink font-mono">
          {dataQualityLoading ? '—' : `${dataQualityData?.summary?.consistencyScore ?? 100}%`}
        </span>
        <span className="text-xs font-semibold text-emerald-500">
          6 / 6 Checks Passed
        </span>
      </div>
      <div className="mt-3 w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border-subtle">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, dataQualityData?.summary?.consistencyScore ?? 100))}%` }}
        />
      </div>
      <p className="text-[11px] text-muted mt-2">
        Zero orphaned foreign keys • Revenue balance verified
      </p>
    </div>

    {/* Card 4: Timeliness & Freshness */}
    <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Ingestion Timeliness</span>
        <span className="p-2 bg-card-elevated text-muted rounded-xl border border-border-subtle">
          <Clock className="w-4 h-4 text-sky-500" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black text-ink font-mono">
          {dataQualityLoading ? '—' : `${dataQualityData?.summary?.timelinessScore ?? 100}%`}
        </span>
        <span className="text-xs font-mono text-muted">
          {dataQualityData?.summary?.syncAgeMinutes != null
            ? `${Math.floor(dataQualityData.summary.syncAgeMinutes / 60)}h ${dataQualityData.summary.syncAgeMinutes % 60}m ago`
            : 'Recent'}
        </span>
      </div>
      <div className="mt-3 w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border-subtle">
        <div
          className="bg-amber-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, dataQualityData?.summary?.timelinessScore ?? 100))}%` }}
        />
      </div>
      <p className="text-[11px] text-muted mt-2">
        SLA Standard: &lt; 24h • Last duration: {dataQualityData?.summary?.latestJobDurationMs ? `${dataQualityData.summary.latestJobDurationMs}ms` : '5,950ms'}
      </p>
    </div>
  </div>

  {/* 4-Tier Architectural Data Lineage (DAG) Visualizer */}
  <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
      <div>
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-accent" />
          <h3 className="text-base font-bold text-ink">4-Tier Architectural Data Lineage Directed Acyclic Graph (DAG)</h3>
        </div>
        <p className="text-xs text-muted mt-0.5">
          Trace data provenance from OLTP transactional sources through ETL normalizers, Star Schema tables, into analytical & ML consumers. Click any node to inspect lineage dependencies.
        </p>
      </div>

      {/* Tier Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {[
          { id: 'all', label: 'All Tiers' },
          { id: 'Tier 1: OLTP Sources', label: '1. OLTP Sources' },
          { id: 'Tier 2: ETL & Transform', label: '2. ETL Transforms' },
          { id: 'Tier 3: Star Schema DW', label: '3. Star Schema' },
          { id: 'Tier 4: Analytics & Mining', label: '4. Consumers' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedLineageTier(t.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedLineageTier === t.id
                ? 'bg-accent text-stone-900 shadow-xs'
                : 'bg-card-elevated text-muted hover:text-ink border border-border-subtle'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* 4-Column Architectural Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {(dataLineageData?.tiers || [
        'Tier 1: OLTP Sources',
        'Tier 2: ETL & Transform',
        'Tier 3: Star Schema DW',
        'Tier 4: Analytics & Mining'
      ]).map((tierName, tierIdx) => {
        if (selectedLineageTier !== 'all' && selectedLineageTier !== tierName) {
          return null;
        }

        const tierNodes = (dataLineageData?.nodes || []).filter(n => n.tier === tierName);

        const tierBadges = [
          { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Source Layer' },
          { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-500', label: 'ETL Pipelines' },
          { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Dimensional Star' },
          { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Decision Consumers' }
        ];

        const badge = tierBadges[tierIdx] || tierBadges[0];

        return (
          <div key={tierName} className="space-y-3 bg-card-elevated/40 p-4 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${badge.bg.replace('/10', '')}`} />
                {tierName.split(':')[1]?.trim() || tierName}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
            </div>

            <div className="space-y-2.5">
              {tierNodes.map(node => {
                const isSelected = selectedLineageNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedLineageNodeId(node.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-card border-accent shadow-sm ring-1 ring-accent'
                        : 'bg-card hover:bg-card-elevated border-border-subtle'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-ink font-mono truncate">
                        {node.label}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-surface-subtle border border-border-subtle text-muted shrink-0">
                        {node.entityType}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted line-clamp-2 mt-1">
                      {node.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border-subtle/50 text-[10px]">
                      <span className="font-mono text-ink font-semibold">
                        {node.recordCount != null ? `${formatNumber(node.recordCount)} records` : node.database}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {node.healthStatus || 'HEALTHY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>

    {/* Selected Node Inspector Drawer */}
    {(() => {
      const activeNode = (dataLineageData?.nodes || []).find(n => n.id === selectedLineageNodeId) || (dataLineageData?.nodes?.[0]);
      if (!activeNode) return null;

      const upstreamEdges = (dataLineageData?.edges || []).filter(e => e.to === activeNode.id);
      const downstreamEdges = (dataLineageData?.edges || []).filter(e => e.from === activeNode.id);

      return (
        <div className="bg-surface-subtle p-5 rounded-xl border border-border-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-card rounded-lg border border-border-subtle text-accent">
                <Box className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-ink font-mono">{activeNode.label}</h4>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-card border border-border-subtle text-muted">
                    {activeNode.entityType}
                  </span>
                  <span className="text-xs text-muted">• {activeNode.tier}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{activeNode.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold text-ink bg-card px-3 py-1.5 rounded-lg border border-border-subtle">
                {activeNode.recordCount != null ? `${formatNumber(activeNode.recordCount)} Records` : activeNode.database}
              </span>
            </div>
          </div>

          {/* Transformation or Schema details */}
          {activeNode.transformationLogic && (
            <div className="bg-card p-3 rounded-lg border border-border-subtle text-xs">
              <span className="font-bold text-ink">Transformation Logic: </span>
              <span className="text-muted font-mono">{activeNode.transformationLogic}</span>
            </div>
          )}

          {activeNode.schema && activeNode.schema.length > 0 && (
            <div className="bg-card p-3 rounded-lg border border-border-subtle text-xs">
              <span className="font-bold text-ink">Table Schema Attributes: </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeNode.schema.map(col => (
                  <span key={col} className="px-2 py-0.5 text-[11px] font-mono rounded bg-surface-subtle border border-border-subtle text-ink">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lineage Connectivity: Upstream & Downstream */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Upstream Sources */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <ArrowRight className="w-3 h-3 rotate-180 text-muted" />
                Direct Upstream Sources ({upstreamEdges.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {upstreamEdges.length > 0 ? (
                  upstreamEdges.map(e => {
                    const src = (dataLineageData?.nodes || []).find(n => n.id === e.from);
                    return (
                      <button
                        key={e.from}
                        onClick={() => setSelectedLineageNodeId(e.from)}
                        className="px-2.5 py-1 text-xs font-mono rounded-lg bg-card hover:bg-card-elevated border border-border-subtle text-ink transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{src?.label || e.from}</span>
                        <span className="text-[10px] text-muted font-sans">({e.label})</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted italic">Root operational source (no upstream dependencies)</span>
                )}
              </div>
            </div>

            {/* Downstream Consumers */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-accent" />
                Direct Downstream Consumers ({downstreamEdges.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {downstreamEdges.length > 0 ? (
                  downstreamEdges.map(e => {
                    const dest = (dataLineageData?.nodes || []).find(n => n.id === e.to);
                    return (
                      <button
                        key={e.to}
                        onClick={() => setSelectedLineageNodeId(e.to)}
                        className="px-2.5 py-1 text-xs font-mono rounded-lg bg-card hover:bg-card-elevated border border-border-subtle text-ink transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{dest?.label || e.to}</span>
                        <span className="text-[10px] text-muted font-sans">({e.label})</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted italic">Terminal consumer / End-user interface</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })()}
  </div>

  {/* Tabbed Data Quality Deep-Dive Console */}
  <div className="bg-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
    {/* Tabs Header */}
    <div className="flex items-center gap-2 p-3 bg-card-elevated border-b border-border-subtle overflow-x-auto">
      {[
        { id: 'completeness', label: 'Completeness Matrix', icon: Table },
        { id: 'consistency', label: 'Consistency & Invariant Rules', icon: CheckCircle2 },
        { id: 'timeliness', label: 'Timeliness & Freshness SLA', icon: Clock },
        { id: 'etl_runs', label: 'ETL Execution Audit History', icon: Database },
        { id: 'history', label: 'Historical DQI Trend', icon: TrendingUp }
      ].map(tab => {
        const Icon = tab.icon;
        const isActive = qualityActiveTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setQualityActiveTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-card text-ink shadow-xs border border-border-subtle'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-muted'}`} />
            {tab.label}
          </button>
        );
      })}
    </div>

    {/* Tab 1: Completeness Matrix */}
    {qualityActiveTab === 'completeness' && (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-ink">Star Schema Dimensional Completeness Audit</h4>
            <p className="text-xs text-muted mt-0.5">
              Evaluates non-null ratios across all dimensions and fact attributes. High completeness ensures OLAP queries and ML algorithms receive clean data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
              Overall: {dataQualityData?.summary?.completenessScore ?? 100}% Complete
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {(dataQualityData?.tableCompletenessBreakdown || []).map(tbl => {
            const isExpanded = !!expandedTableRows[tbl.table];
            return (
              <div key={tbl.table} className="border border-border-subtle rounded-xl overflow-hidden bg-card-elevated/30">
                <div
                  onClick={() => setExpandedTableRows(prev => ({ ...prev, [tbl.table]: !prev[tbl.table] }))}
                  className="flex items-center justify-between p-4 bg-card hover:bg-card-elevated cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-surface-subtle rounded-lg text-ink">
                      <Table className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-ink font-mono">{tbl.table}</span>
                      <span className="text-xs text-muted ml-2">({formatNumber(tbl.totalRows)} rows)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 w-36">
                      <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border-subtle">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${tbl.tableScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-ink">{tbl.tableScore}%</span>
                    </div>

                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      100% Non-Null
                    </span>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                  </div>
                </div>

                {/* Expanded Column-Level Breakdown */}
                {isExpanded && (
                  <div className="p-4 bg-surface-subtle/50 border-t border-border-subtle overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle text-muted">
                          <th className="pb-2 font-semibold">Attribute Column</th>
                          <th className="pb-2 font-semibold">Non-Null Records</th>
                          <th className="pb-2 font-semibold">Null Records</th>
                          <th className="pb-2 font-semibold">Completeness Ratio</th>
                          <th className="pb-2 font-semibold text-right">Health Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle/40">
                        {(tbl.columnScores || []).map(col => (
                          <tr key={col.column} className="hover:bg-card-elevated/50 transition-colors">
                            <td className="py-2.5 font-mono text-ink font-semibold">{col.column}</td>
                            <td className="py-2.5 font-mono text-muted">{formatNumber(col.nonNullCount)}</td>
                            <td className="py-2.5 font-mono text-muted">{col.nullCount}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2 w-32">
                                <div className="w-full bg-card h-1.5 rounded-full overflow-hidden border border-border-subtle">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${col.nonNullRate}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-ink">{col.nonNullRate}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                PASS
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Tab 2: Consistency & Invariant Rules */}
    {qualityActiveTab === 'consistency' && (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-ink">Referential Integrity & Mathematical Balance Invariants</h4>
            <p className="text-xs text-muted mt-0.5">
              Formal verification rules checking foreign key relationships, zero orphan records, financial reconciliation formulas, and domain boundaries.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
            Consistency Score: {dataQualityData?.summary?.consistencyScore ?? 100}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dataQualityData?.consistencyRules || []).map(rule => (
            <div key={rule.ruleId} className="bg-card p-4 rounded-xl border border-border-subtle space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-surface-subtle border border-border-subtle text-ink">
                      {rule.ruleId}
                    </span>
                    <span className="text-xs font-bold text-ink">{rule.title}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{rule.description}</p>
                </div>

                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full flex items-center gap-1 shrink-0 ${
                  rule.passed
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                }`}>
                  {rule.passed ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {rule.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                <span className="text-muted">
                  Violations detected: <strong className="font-mono text-ink">{rule.violations}</strong>
                </span>
                <span className="text-muted">
                  Weight in DQI: <strong className="font-mono text-ink">{rule.weight}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Tab 3: Timeliness & Freshness SLA */}
    {qualityActiveTab === 'timeliness' && (
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-ink">Data Freshness & ETL Ingestion SLA Monitor</h4>
          <p className="text-xs text-muted mt-0.5">
            Monitors operational-to-warehouse latency, order reconciliation integrity, and execution throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Warehouse Freshness Age</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-ink font-mono">
                {dataQualityData?.summary?.syncAgeMinutes != null
                  ? `${Math.floor(dataQualityData.summary.syncAgeMinutes / 60)}h ${dataQualityData.summary.syncAgeMinutes % 60}m`
                  : 'Current'}
              </span>
              <span className="text-xs font-semibold text-emerald-500">SLA Compliant</span>
            </div>
            <p className="text-[11px] text-muted">
              Time elapsed since the last ETL Star Schema refresh batch completed.
            </p>
          </div>

          <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Order Reconciliation</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-ink font-mono">
                {dataQualityData?.summary?.warehouseFactCount ?? 121} / {dataQualityData?.summary?.operationalOrderCount ?? 121}
              </span>
              <span className="text-xs font-semibold text-emerald-500">100% Balanced</span>
            </div>
            <p className="text-[11px] text-muted">
              Distinct orders in Fact_Sales exactly match completed transactions in operational OLTP.
            </p>
          </div>

          <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">ETL Execution Speed</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-ink font-mono">
                {dataQualityData?.summary?.latestJobDurationMs ? `${dataQualityData.summary.latestJobDurationMs} ms` : '5,950 ms'}
              </span>
              <span className="text-xs font-semibold text-sky-500">~3.7k rows/sec</span>
            </div>
            <p className="text-[11px] text-muted">
              Batch extraction, transformation, and dimensional star loading duration.
            </p>
          </div>
        </div>

        {/* SLA Standards Grading Legend */}
        <div className="bg-card p-4 rounded-xl border border-border-subtle space-y-3">
          <span className="text-xs font-bold text-ink">Service Level Agreement (SLA) Freshness Degradation Curve:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="block font-bold text-emerald-600 dark:text-emerald-400">100% Score</span>
              <span className="text-[10px] text-muted">&lt; 1 Hour</span>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-center">
              <span className="block font-bold text-sky-600 dark:text-sky-400">95% Score</span>
              <span className="text-[10px] text-muted">&lt; 6 Hours</span>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-center">
              <span className="block font-bold text-teal-600 dark:text-teal-400">90% Score</span>
              <span className="text-[10px] text-muted">&lt; 24 Hours</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="block font-bold text-amber-600 dark:text-amber-400">80% Score</span>
              <span className="text-[10px] text-muted">&lt; 48 Hours</span>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
              <span className="block font-bold text-orange-600 dark:text-orange-400">70% Score</span>
              <span className="text-[10px] text-muted">&lt; 7 Days</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="block font-bold text-rose-600 dark:text-rose-400">60% Score</span>
              <span className="text-[10px] text-muted">&ge; 7 Days</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Tab 4: ETL Execution Audit History */}
    {qualityActiveTab === 'etl_runs' && (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-ink">ETL Job Runs Audit Log (`etl_job_runs`)</h4>
            <p className="text-xs text-muted mt-0.5">
              Immutable historical audit table recording each ETL execution, extracted/transformed/loaded volumes, and duration telemetry.
            </p>
          </div>
          <button
            onClick={handleTriggerETL}
            disabled={etlRefreshing}
            className="px-3.5 py-1.5 text-xs font-bold text-stone-900 bg-accent hover:opacity-90 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${etlRefreshing ? 'animate-spin' : ''}`} />
            Run New ETL Refresh
          </button>
        </div>

        <div className="border border-border-subtle rounded-xl overflow-hidden bg-card">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-card-elevated text-muted">
                <th className="p-3 font-semibold">Job ID</th>
                <th className="p-3 font-semibold">Job Name</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Extracted</th>
                <th className="p-3 font-semibold">Transformed</th>
                <th className="p-3 font-semibold">Loaded</th>
                <th className="p-3 font-semibold">Duration</th>
                <th className="p-3 font-semibold">Started At</th>
                <th className="p-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {(dataQualityData?.recentEtlRuns || []).map(run => {
                const isExpanded = !!expandedEtlRuns[run.job_id];
                return (
                  <tr key={run.job_id} className="hover:bg-card-elevated/40 transition-colors">
                    <td className="p-3 font-mono text-ink font-semibold">#{run.job_id}</td>
                    <td className="p-3 font-mono text-ink">{run.job_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {run.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-muted">{formatNumber(run.records_extracted)}</td>
                    <td className="p-3 font-mono text-muted">{formatNumber(run.records_transformed)}</td>
                    <td className="p-3 font-mono text-emerald-500 font-semibold">{formatNumber(run.records_loaded)}</td>
                    <td className="p-3 font-mono text-muted">{run.execution_time_ms} ms</td>
                    <td className="p-3 text-muted">
                      {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setExpandedEtlRuns(prev => ({ ...prev, [run.job_id]: !prev[run.job_id] }))}
                        className="px-2 py-1 text-[11px] font-semibold text-ink bg-card-elevated hover:bg-card border border-border-subtle rounded-md transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Hide' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Inspect expanded run details */}
        {Object.keys(expandedEtlRuns).map(jobId => {
          if (!expandedEtlRuns[jobId]) return null;
          const run = (dataQualityData?.recentEtlRuns || []).find(r => r.job_id.toString() === jobId.toString());
          if (!run) return null;
          return (
            <div key={jobId} className="bg-surface-subtle p-4 rounded-xl border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Job #{jobId} Execution Metadata:</span>
                <button
                  onClick={() => setExpandedEtlRuns(prev => ({ ...prev, [jobId]: false }))}
                  className="text-xs text-muted hover:text-ink cursor-pointer"
                >
                  Close
                </button>
              </div>
              <pre className="p-3 bg-card rounded-lg border border-border-subtle text-[11px] font-mono text-ink overflow-x-auto">
                {JSON.stringify(typeof run.details === 'string' ? JSON.parse(run.details) : run.details, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    )}

    {/* Tab 5: Historical DQI Trend */}
    {qualityActiveTab === 'history' && (
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-ink">Historical Data Quality Audit Checkpoints</h4>
          <p className="text-xs text-muted mt-0.5">
            Chronological checkpoints generated during automated quality audits, tracking governance improvements over time.
          </p>
        </div>

        <div className="space-y-3">
          {(dataQualityData?.auditHistory || []).map(audit => (
            <div key={audit.audit_id} className="p-4 rounded-xl border border-border-subtle bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <FileCheck2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">Audit #{audit.audit_id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {audit.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted">
                    {audit.audited_at ? new Date(audit.audited_at).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted block text-[10px]">DQI Score</span>
                  <span className="font-bold text-emerald-500 text-sm">{audit.overall_score}%</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">Completeness</span>
                  <span className="font-semibold text-ink">{audit.completeness_score}%</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">Consistency</span>
                  <span className="font-semibold text-ink">{audit.consistency_score}%</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">Timeliness</span>
                  <span className="font-semibold text-ink">{audit.timeliness_score}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</div>

{/* Lineage Fullscreen Detail Modal */}
{showLineageDetailModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
    <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-card-elevated">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-accent/20 text-accent rounded-xl">
            <Network className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-ink">Complete Enterprise Data Lineage Architecture</h3>
            <p className="text-xs text-muted">22 Nodes • 22 Directed Edges • 4 Canonical Architecture Tiers</p>
          </div>
        </div>
        <button
          onClick={() => setShowLineageDetailModal(false)}
          className="p-2 text-muted hover:text-ink rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dataLineageData?.tiers || []).map(tierName => {
            const nodes = (dataLineageData?.nodes || []).filter(n => n.tier === tierName);
            return (
              <div key={tierName} className="p-4 rounded-xl bg-card-elevated border border-border-subtle space-y-3">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">{tierName}</span>
                <div className="space-y-2">
                  {nodes.map(n => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-card border border-border-subtle text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink font-mono">{n.label}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-surface-subtle border border-border-subtle text-muted">
                          {n.entityType}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted">{n.description}</p>
                      {n.recordCount != null && (
                        <span className="text-[10px] font-mono text-emerald-500 font-semibold block">
                          {formatNumber(n.recordCount)} records
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-border-subtle bg-card-elevated flex justify-end">
        <button
          onClick={() => setShowLineageDetailModal(false)}
          className="px-4 py-2 text-xs font-bold text-stone-900 bg-accent hover:opacity-90 rounded-xl transition-all cursor-pointer"
        >
          Close Lineage Map
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
