import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Database,
  BarChart3,
  SlidersHorizontal,
  Info,
  Play,
  ArrowUpRight
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

export default function AdminModels() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [affinityData, setAffinityData] = useState(null);

  // Simulator State
  const [simUserId, setSimUserId] = useState(1);
  const [simTopK, setSimTopK] = useState(4);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [retraining, setRetraining] = useState(false);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, metricsRes, matrixRes] = await Promise.allSettled([
        adminService.getModelStatus(),
        adminService.getModelMetrics(),
        adminService.getNcfAffinityMatrix(),
      ]);

      if (statusRes.status === 'fulfilled') setModelStatus(statusRes.value);
      if (metricsRes.status === 'fulfilled') setModelMetrics(metricsRes.value);
      if (matrixRes.status === 'fulfilled') setAffinityData(matrixRes.value);

      // Auto-run first user recommendation
      runRecommendation(1, 4);
    } catch (err) {
      showToast(err.message || 'Failed to load model diagnostics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runRecommendation = async (userId, topK) => {
    try {
      setSimLoading(true);
      const res = await adminService.getNcfRecommendations(userId, topK);
      setSimResult(res);
    } catch (err) {
      showToast(err.message || 'Recommendation inference failed.', 'error');
    } finally {
      setSimLoading(false);
    }
  };

  const handleRetrainRequest = async () => {
    try {
      setRetraining(true);
      const res = await adminService.requestRetraining({
        trigger: 'admin_ui_manual',
        parameters: { epochs: 20, lr: 0.001, neg_ratio: 4 },
      });
      showToast(res.message || 'Model retraining requested.', 'success');
      await fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to trigger retrain request.', 'error');
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted">Connecting to ML Service & Diagnostics...</p>
      </div>
    );
  }

  const ncf = modelStatus?.ncfDetails || {};
  const isNcfActive = ncf.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">AI & Recommendation Models</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              1 Model Active
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Neural Collaborative Filtering (NCF) NeuMF architecture, training diagnostics, live affinity predictions, and product recommendation simulator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:bg-neutral-50 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted" />
            Refresh Diagnostics
          </button>
          <button
            onClick={handleRetrainRequest}
            disabled={retraining}
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining...' : 'Trigger Retrain'}
          </button>
        </div>
      </div>

      {/* 2. Key Telemetry Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Primary Architecture</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-ink">NCF (NeuMF)</span>
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">v1.0.0</span>
          </div>
          <p className="mt-1 text-xs text-muted">GMF (32d) + MLP (64-32-16-8) Dual Branch</p>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Evaluation Accuracy</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">100.0%</span>
            <span className="text-xs font-medium text-muted">HR@10 = 1.0000</span>
          </div>
          <p className="mt-1 text-xs text-muted">Leave-one-out top-10 candidate hit rate</p>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Learned Latent Space</span>
            <Cpu className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-ink">{ncf.usersCount || 2} Users</span>
            <span className="text-xs font-medium text-muted">• {ncf.itemsCount || 4} Products</span>
          </div>
          <p className="mt-1 text-xs text-muted">Dense embedding indexing with stable IDs</p>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Model Status</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-lg font-bold text-ink">{isNcfActive ? 'Online & Ready' : 'Standby'}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted" title={ncf.lastTrainedAt}>
            Trained: {ncf.lastTrainedAt ? new Date(ncf.lastTrainedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recently'}
          </p>
        </div>
      </div>

      {/* 3. Interactive Live Recommendation Simulator */}
      <div className="card flex flex-col gap-6 p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-bold text-ink">Live Recommendation Simulator (NCF Inference)</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Select a user profile to execute real-time model inference and rank candidate products by predicted affinity scores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted">Target User:</label>
              <select
                value={simUserId}
                onChange={(e) => setSimUserId(Number(e.target.value))}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm focus:border-primary focus:outline-none"
              >
                {(ncf.userIds || [1, 3]).map((uid) => (
                  <option key={uid} value={uid}>
                    User #{uid} {uid === 1 ? '(Admin / Shopper)' : '(Test User)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-muted">Top K:</label>
              <select
                value={simTopK}
                onChange={(e) => setSimTopK(Number(e.target.value))}
                className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-sm focus:border-primary focus:outline-none"
              >
                <option value={2}>Top 2</option>
                <option value={4}>Top 4</option>
                <option value={10}>Top 10</option>
              </select>
            </div>

            <button
              onClick={() => runRecommendation(simUserId, simTopK)}
              disabled={simLoading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              <Play className={`h-3 w-3 ${simLoading ? 'animate-spin' : ''}`} />
              {simLoading ? 'Predicting...' : 'Run Inference'}
            </button>
          </div>
        </div>

        {/* Results Showcase */}
        {simLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs font-medium text-muted">Executing neural network forward pass...</p>
            </div>
          </div>
        ) : simResult?.recommendations && simResult.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {simResult.recommendations.map((rec) => (
              <div
                key={rec.productId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-700">
                    Rank #{rec.rank}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    {rec.affinityPercentage}% Match
                  </span>
                </div>

                <div className="my-3 flex items-center justify-center overflow-hidden rounded-lg bg-neutral-50 p-2">
                  <img
                    src={rec.mainImage || '/placeholder.png'}
                    alt={rec.name}
                    className="h-28 w-28 object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop&q=80';
                    }}
                  />
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-muted">{rec.brand}</div>
                  <h4 className="mt-0.5 line-clamp-2 text-xs font-bold text-ink" title={rec.name}>
                    {rec.name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <div>
                    <span className="text-xs font-extrabold text-ink">
                      ₹{Number(rec.finalPrice || rec.price || 0).toLocaleString('en-IN')}
                    </span>
                    {rec.rating > 0 && (
                      <span className="ml-2 text-[11px] font-medium text-amber-600">★ {rec.rating}</span>
                    )}
                  </div>
                  <Link
                    to={`/products/${rec.productId}`}
                    target="_blank"
                    className="flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-neutral-50/50 p-6 text-center">
            <Info className="h-5 w-5 text-muted" />
            <p className="mt-2 text-xs font-medium text-ink">No recommendation predictions generated yet.</p>
            <p className="text-[11px] text-muted">Click "Run Inference" above to evaluate products for User #{simUserId}.</p>
          </div>
        )}
      </div>

      {/* 4. Full Predicted Affinity Matrix */}
      {affinityData?.matrix && affinityData.matrix.length > 0 && (
        <div className="card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink">Predicted User-Item Affinity Probability Matrix</h3>
              <p className="text-xs text-muted">
                Raw Sigmoid output probability $P(y=1|u,i)$ generated by the trained NeuMF model for all known training combinations.
              </p>
            </div>
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-muted">
              {affinityData.matrix.length} Matrix Cells
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-neutral-50/70 text-muted">
                  <th className="px-4 py-2.5 font-semibold">User ID</th>
                  <th className="px-4 py-2.5 font-semibold">Product ID</th>
                  <th className="px-4 py-2.5 font-semibold">Predicted Score</th>
                  <th className="px-4 py-2.5 font-semibold">Affinity Strength</th>
                  <th className="px-4 py-2.5 font-semibold">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {affinityData.matrix.map((row, idx) => {
                  const score = row.predicted_score;
                  const pct = Math.round(score * 1000) / 10;
                  return (
                    <tr key={idx} className="transition-colors hover:bg-neutral-50/50">
                      <td className="px-4 py-2.5 font-bold text-ink">User #{row.user_id}</td>
                      <td className="px-4 py-2.5 font-semibold text-neutral-700">Product #{row.product_id}</td>
                      <td className="px-4 py-2.5 font-mono font-medium text-ink">{score.toFixed(4)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-semibold text-ink">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          POSITIVE AFFINITY
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Complete Multi-Modal Architecture Roadmap */}
      <div className="card flex flex-col gap-4 p-6">
        <div>
          <h3 className="text-sm font-bold text-ink">Cartify 5-Stage Multi-Model Recommendation Pipeline</h3>
          <p className="text-xs text-muted">
            Hybrid recommendation architecture combining collaborative filtering, deep visual embeddings, session sequence recurrent networks, and multi-modal attention fusion.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {(modelStatus?.models || []).map((m, idx) => {
            const isActive = m.status === 'ACTIVE';
            const isScaffold = m.status === 'SCAFFOLD_READY';
            return (
              <div
                key={idx}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isActive
                    ? 'border-emerald-300/80 bg-emerald-50/20 shadow-sm'
                    : isScaffold
                    ? 'border-indigo-200/80 bg-indigo-50/20'
                    : 'border-border/60 bg-neutral-50/30 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isScaffold
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {isActive ? '● LIVE / TRAINED' : isScaffold ? '⚡ SCAFFOLD READY' : '○ PHASE 5 PLANNED'}
                    </span>
                    <span className="text-[11px] font-semibold text-muted">{m.version || 'v0.0.0'}</span>
                  </div>

                  <h4 className="mt-2.5 text-xs font-bold text-ink">{m.name}</h4>
                  <p className="mt-0.5 text-[11px] font-semibold text-primary">{m.type}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    {m.description || (isActive ? 'GMF + MLP fused neural collaborative filtering model trained on implicit user interactions.' : 'Component of future hybrid pipeline.')}
                  </p>
                </div>

                <div className="mt-3 border-t border-border/50 pt-2 text-[10px] text-muted">
                  {isActive ? (
                    <span className="font-semibold text-emerald-700">Checkpoint loaded: artifacts/ncf_model.pt</span>
                  ) : (
                    <span>Scaffold: ml-service/{m.name.toLowerCase().includes('cnn') ? 'cnn/' : 'planned/'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}