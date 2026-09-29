import { useState, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Percent,
  Star,
  Activity,
  Zap,
  Tag,
  CheckCircle2,
  Info,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

const DEFAULT_RULES = {
  diversityBoost: 0.15,
  minRatingThreshold: 3.5,
  maxDiscountHighlight: 0.5,
  interactionWeights: {
    VIEW: 1.0,
    SEARCH: 1.5,
    WISHLIST_ADD: 3.0,
    CART_ADD: 4.0,
    RATING: 3.5,
    REVIEW: 4.0,
    PURCHASE: 5.0,
  },
  categoryWeights: {
    fashion: 1.0,
    electronics: 1.0,
    'home-kitchen': 1.0,
    beauty: 1.0,
    sports: 1.0,
    grocery: 1.0,
    gaming: 1.0,
    books: 1.0,
  },
};

export default function AdminBusinessRules() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getBusinessRules();
      if (res) {
        setRules({
          ...DEFAULT_RULES,
          ...res,
          interactionWeights: { ...DEFAULT_RULES.interactionWeights, ...(res.interactionWeights || {}) },
          categoryWeights: { ...DEFAULT_RULES.categoryWeights, ...(res.categoryWeights || {}) },
        });
      }
    } catch (err) {
      console.error('Failed to load business rules:', err);
      showToast('Failed to load business rules from PostgreSQL.', 'error');
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateBusinessRules(rules);
      showToast('Business rules updated and saved to PostgreSQL successfully.', 'success');
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save business rules:', err);
      showToast('Failed to update business rules configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRules(DEFAULT_RULES);
    setHasChanges(true);
    showToast('Reset to default Cartify AI scoring weights.', 'info');
  };

  const updateField = (field, val) => {
    setRules((prev) => ({ ...prev, [field]: val }));
    setHasChanges(true);
  };

  const updateWeight = (group, key, val) => {
    setRules((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: parseFloat(val) || 0,
      },
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-flex items-center gap-2 text-muted text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          Loading business rules from PostgreSQL system_configs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              system_configs Table Active
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-mono">Live Ranking Tuning</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink font-display">
            Recommendation Business Rules
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Configure multi-modal ranking weights, interaction telemetry scoring multipliers, and diversity thresholds applied to the Attention Fusion engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="btn btn-secondary text-xs h-9 px-3.5 gap-2 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`btn text-xs h-9 px-4 gap-2 ${
              hasChanges
                ? 'btn-primary'
                : 'btn-secondary opacity-50 cursor-not-allowed'
            }`}
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs text-amber-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You have unsaved changes to the recommendation parameters. Click <strong>Save Changes</strong> to update live ranking.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary text-xs px-3 py-1 shrink-0"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Global Hyperparameters */}
      <div className="card border-border-subtle p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Global Recommendation Hyperparameters
          </h2>
          <p className="text-xs text-muted mt-0.5">
            High-level policy constraints applied to candidate generation and re-ranking layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Diversity Boost */}
          <div className="border border-border-subtle rounded-lg p-4 bg-card-elevated space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">Diversity Boost</label>
              <span className="font-mono text-xs font-bold text-ink bg-card px-2 py-0.5 rounded border border-border-subtle">
                {(rules.diversityBoost * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.40"
              step="0.01"
              value={rules.diversityBoost}
              onChange={(e) => updateField('diversityBoost', parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-2xs text-muted leading-relaxed">
              Injects exploratory cross-department candidates to prevent filter-bubble stagnation.
            </p>
          </div>

          {/* Min Rating Threshold */}
          <div className="border border-border-subtle rounded-lg p-4 bg-card-elevated space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Min Rating Cutoff
              </label>
              <span className="font-mono text-xs font-bold text-ink bg-card px-2 py-0.5 rounded border border-border-subtle">
                ★ {rules.minRatingThreshold.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="2.5"
              max="4.5"
              step="0.1"
              value={rules.minRatingThreshold}
              onChange={(e) => updateField('minRatingThreshold', parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-2xs text-muted leading-relaxed">
              Products below this rating threshold will be deprioritized in primary discovery carousels.
            </p>
          </div>

          {/* Max Discount Highlight */}
          <div className="border border-border-subtle rounded-lg p-4 bg-card-elevated space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                Max Discount Multiplier
              </label>
              <span className="font-mono text-xs font-bold text-ink bg-card px-2 py-0.5 rounded border border-border-subtle">
                {(rules.maxDiscountHighlight * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={rules.maxDiscountHighlight}
              onChange={(e) => updateField('maxDiscountHighlight', parseFloat(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <p className="text-2xs text-muted leading-relaxed">
              Maximum ceiling for deal boost multipliers applied to promotional candidate scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Interaction Telemetry Weights */}
      <div className="card border-border-subtle p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Interaction Telemetry Scoring Weights
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Explicit scoring weights applied to user interaction telemetry events when training NCF and computing Attention Fusion affinity matrices.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(rules.interactionWeights || {}).map(([eventType, weight]) => {
            return (
              <div key={eventType} className="border border-border-subtle rounded-lg p-4 bg-card-elevated space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-mono font-bold tracking-wider uppercase text-muted">
                    {eventType}
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink bg-card px-1.5 py-0.5 rounded border border-border-subtle">
                    {weight.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.5"
                  value={weight}
                  onChange={(e) => updateWeight('interactionWeights', eventType, e.target.value)}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-3xs text-muted font-mono">
                  <span>0.5x</span>
                  <span>6.0x</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Weights */}
      <div className="card border-border-subtle p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            Department Ranking Multipliers
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Boost or balance individual departments across homepage discovery and category suggestions.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(rules.categoryWeights || {}).map(([catSlug, multiplier]) => {
            return (
              <div key={catSlug} className="border border-border-subtle rounded-lg p-3 bg-card-elevated space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-medium text-ink">{catSlug.replace('-', ' ')}</span>
                  <span className="font-mono font-bold text-ink text-2xs bg-card px-1.5 py-0.5 rounded border border-border-subtle">
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={multiplier}
                  onChange={(e) => updateWeight('categoryWeights', catSlug, e.target.value)}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log Guarantee */}
      <div className="card border-border-subtle p-4 flex items-start gap-3 text-xs text-muted">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ink">Governance & Audit Logging:</span> Every change to business rules is recorded in the PostgreSQL <code className="font-mono text-ink bg-card-elevated px-1.5 py-0.5 rounded border border-border-subtle">audit_logs</code> table with previous values, modified fields, timestamp, and administrator identity.
        </div>
      </div>
    </div>
  );
}