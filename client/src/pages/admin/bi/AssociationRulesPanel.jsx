import { Network, Settings2, Table, Layers } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useTheme } from '../../../hooks/useTheme.js';
import { getChartTheme, axisTick, tooltipStyle } from './biShared.js';

/**
 * Section 2 & Section 7: Market Basket Analysis - Higher-Order Apriori
 * Frequent itemset and association rule explorer with L2/L3/L4 support.
 *
 * Presentational component. All data fetching and state ownership live in
 * AdminBIDashboard.jsx; this module only renders.
 */
export default function AssociationRulesPanel({
  associationRules,
  associationRulesMeta,
  minSupport,
  setMinSupport,
  minConfidence,
  setMinConfidence,
  rulesLimit,
  setRulesLimit,
  maxItemsetSize,
  setMaxItemsetSize
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const chart = getChartTheme(isDark);

  const meta = associationRulesMeta || {};
  const frequentCounts = meta.frequentItemsetCounts || {};
  const isTruncated = meta.isTruncated || false;

  const displayedRules = rulesLimit === 'all'
    ? associationRules
    : associationRules.slice(0, rulesLimit);

  // Itemset size badge colors (Tailwind classes for chips/table)
  const itemsetSizeColors = {
    2: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    3: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    4: 'bg-violet-500/15 text-violet-400 border-violet-500/30'
  };

  // Matching raw hex values for Recharts SVG fills, which cannot use class strings.
  const itemsetSizeHex = { 2: '#38bdf8', 3: '#fbbf24', 4: '#a78bfa' };
  const itemsetHex = (size) => itemsetSizeHex[size] || '#22d3ee';

  return (
    <>
{/* Market Basket Analysis & Association Rules (Higher-Order Apriori Engine) */}
<div className="card border-border-subtle p-6 shadow-xs mt-6">
  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Layers className="w-3.5 h-3.5" />
          Section 7: Higher-Order Itemsets
        </span>
        <span className="text-xs text-muted">•</span>
        <span className="text-xs text-muted font-mono">Apriori L{maxItemsetSize} Mining</span>
      </div>
      <h3 className="text-lg font-semibold text-ink flex items-center gap-2 font-display">
        <Network className="w-5 h-5 text-accent" />
        Market Basket Analysis (Apriori Association Rules)
      </h3>
      <p className="text-sm text-muted mt-1">
        Mining transactional purchase records to discover itemsets frequently bought together.
        Higher-order rules (L3/L4) reveal compound cross-sell opportunities invisible to 2-itemset analysis.
      </p>
    </div>

    <div className="flex-shrink-0 bg-card-elevated p-4 rounded-lg border border-border-subtle min-w-[300px]">
      <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-3 uppercase tracking-wider">
        <Settings2 className="w-3.5 h-3.5 text-accent" /> Rule Hyperparameters
      </h4>
      <div className="space-y-4">
        {/* Section 7: Itemset Order Selector */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted font-medium">Max Itemset Size</span>
            <span className="font-mono text-ink font-semibold">L{maxItemsetSize}</span>
          </div>
          <div className="flex rounded-lg border border-border-subtle overflow-hidden">
            {[2, 3, 4].map(k => (
              <button
                key={k}
                onClick={() => setMaxItemsetSize(k)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                  maxItemsetSize === k
                    ? 'bg-accent text-accent-ink font-semibold'
                    : 'bg-card text-muted hover:text-ink hover:bg-card-elevated'
                }`}
              >
                {k}-itemsets
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted mt-1 leading-relaxed">
            {maxItemsetSize === 2 && 'Original Apriori: simple A→B rules only.'}
            {maxItemsetSize === 3 && 'Discovers A,B→C triple patterns (recommended).'}
            {maxItemsetSize === 4 && 'Compound rules; may be sparse on small baskets.'}
          </p>
        </div>

        <div className="border-t border-border-subtle pt-3">
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
            className="input-field select-field text-xs py-1.5 w-full"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value="all">All Rules</option>
          </select>
        </div>
      </div>

      {/* Frequent Itemset Counts (if available) */}
      {Object.keys(frequentCounts).length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-2 font-medium">
            Frequent Itemset Counts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(frequentCounts).map(([k, count]) => (
              <span
                key={k}
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                  parseInt(k) <= maxItemsetSize
                    ? itemsetSizeColors[k] || 'bg-card-elevated text-ink border-border-subtle'
                    : 'bg-card-elevated text-muted border-border-subtle opacity-50'
                }`}
              >
                L{k}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Truncation Warning */}
  {isTruncated && (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
      <strong>Note:</strong> Candidate generation was capped at 50,000 itemsets for performance.
      Results may be incomplete. Try increasing minSupport.
    </div>
  )}

  {/* Lift vs Confidence Scatter Plot */}
  {associationRules.length > 0 && (
    <div className="mb-6 card border-border-subtle p-4 shadow-xs">
      <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent" />
        Rule Quality Scatter: Lift vs Confidence
      </h4>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 10, right: 30, left: 50, bottom: 10 }}
            data={displayedRules.map(r => ({
              confidence: r.confidence,
              lift: r.lift,
              support: r.support,
              itemsetSize: r.itemsetSize,
              antecedent: r.antecedentNames.join(', '),
              consequent: r.consequentNames.join(', '),
              color: itemsetHex(r.itemsetSize),
              size: r.itemsetSize * 6
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis
              type="number"
              dataKey="confidence"
              name="Confidence"
              tick={axisTick(isDark)}
              tickFormatter={v => (v * 100).toFixed(0) + '%'}
              domain={[0, 1]}
            />
            <YAxis
              type="number"
              dataKey="lift"
              name="Lift"
              tick={axisTick(isDark)}
              tickFormatter={v => v.toFixed(2) + 'x'}
              domain={[0, 'dataMax']}
            />
            <Tooltip
              formatter={(value, name) => [
                name === 'lift' ? value.toFixed(2) + 'x' : (value * 100).toFixed(1) + '%',
                name === 'lift' ? 'Lift' : 'Confidence'
              ]}
              contentStyle={tooltipStyle(isDark)}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload;
                return item ? `${item.antecedent} → ${item.consequent}` : '';
              }}
            />
            <Scatter
              name="Rules"
              dataKey="lift"
              fill="#22d3ee"
              shape="circle"
            >
              {displayedRules.map((rule, i) => (
                <Cell
                  key={i}
                  fill={itemsetHex(rule.itemsetSize)}
                  stroke={chart.axis}
                  strokeWidth={0.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted mt-2">
        Each dot = one rule. Size/color = itemset order (L2/L3/L4). Hover for details. Top-right quadrant = high confidence + high lift.
      </p>
    </div>
  )}

  {/* Rules Table */}
  <div className="overflow-x-auto rounded-lg border border-border-subtle">
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-card-elevated text-muted text-xs uppercase tracking-wider font-semibold border-b border-border-subtle">
        <tr>
          <th className="px-4 py-3">Antecedent (If bought...)</th>
          <th className="px-4 py-3">Consequent (...then buys)</th>
          <th className="px-4 py-3 text-center">Order</th>
          <th className="px-4 py-3 text-right">Support</th>
          <th className="px-4 py-3 text-right">Confidence</th>
          <th className="px-4 py-3 text-right">Lift</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle text-ink bg-card">
        {associationRules.length === 0 ? (
          <tr>
            <td colSpan="6" className="px-4 py-8 text-center text-muted text-sm">
              No rules discovered for these thresholds. Try lowering minSupport or minConfidence,
              or increase maxItemsetSize.
            </td>
          </tr>
        ) : (
          displayedRules.map((rule, idx) => (
            <tr key={idx} className="hover:bg-card-elevated transition-colors">
              <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate" title={rule.antecedentNames.join(', ')}>
                {rule.antecedentNames.join(', ')}
              </td>
              <td className="px-4 py-3 font-medium text-accent max-w-[200px] truncate" title={rule.consequentNames.join(', ')}>
                {rule.consequentNames.join(', ')}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                  itemsetSizeColors[rule.itemsetSize] || 'bg-card-elevated text-muted border-border-subtle'
                }`}>
                  {rule.antecedentSize}→{rule.consequentSize}
                </span>
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

  <div className="mt-3 text-xs text-muted flex justify-between items-center">
    <span>
      {rulesLimit !== 'all' && associationRules.length > rulesLimit
        ? `Showing top ${rulesLimit} of ${associationRules.length} rules`
        : `${associationRules.length} rules`}
      {meta.totalTransactions && ` • ${meta.totalTransactions} transactions analyzed`}
    </span>
    <span className="font-mono">
      Max L{maxItemsetSize} • MinSupp {(minSupport * 100).toFixed(1)}% • MinConf {(minConfidence * 100).toFixed(0)}%
    </span>
  </div>
</div>
    </>
  );
}
