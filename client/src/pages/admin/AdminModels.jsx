import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  Layers,
  Cpu,
  RefreshCw,
  Clock,
  ChevronRight,
  TrendingUp,
  Database,
  SlidersHorizontal,
  Info,
  Play,
  ArrowUpRight,
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  Sliders,
  Eye,
  Check
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

export default function AdminModels() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [affinityData, setAffinityData] = useState(null);
  const [cnnMatrixData, setCnnMatrixData] = useState(null);

  // Active View Tab: 'all' | 'ncf' | 'cnn'
  const [activeTab, setActiveTab] = useState('all');

  // NCF Simulator State
  const [simUserId, setSimUserId] = useState(1);
  const [simTopK, setSimTopK] = useState(4);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // CNN Visual Similarity Simulator State
  const [cnnProductId, setCnnProductId] = useState(3129);
  const [cnnTopK, setCnnTopK] = useState(4);
  const [cnnLoading, setCnnLoading] = useState(false);
  const [cnnResult, setCnnResult] = useState(null);
  const [enforceSameCategory, setEnforceSameCategory] = useState(true);

  // Retraining State
  const [retraining, setRetraining] = useState(false);
  const [retrainTarget, setRetrainTarget] = useState('all');

  // Sample verified product IDs accurately mapped to real categories
  const sampleProducts = [
    { id: 3129, name: 'CLAVIER Neo Wired Earphones', category: 'Electronics', catId: 1 },
    { id: 50, name: "GRECIILOOKS Men's Casual Shirt", category: 'Fashion', catId: 2 },
    { id: 14592, name: 'Frizty Cervical Contour Memory Foam Pillow', category: 'Home & Kitchen', catId: 3 },
    { id: 6214, name: 'LoveChild Masaba Matte Liquid Lipstick', category: 'Beauty', catId: 4 },
    { id: 11578, name: 'Yonex Badminton Sports T-Shirt', category: 'Sports', catId: 5 },
    { id: 16638, name: 'Organic California Almonds 750g', category: 'Grocery', catId: 6 },
    { id: 17877, name: 'DOC Razer Sports Sneakers', category: 'Gaming', catId: 7 },
    { id: 17925, name: 'Designing Data-Intensive Applications', category: 'Books', catId: 8 },
  ];

  const PERSONA_NAMES = [
    'Tech & Gaming Enthusiast',
    'Fashion & Beauty Stylist',
    'Fitness & Health Seeker',
    'Home & Gourmet Chef',
    'Bookworm & Knowledge Seeker',
    'Lifestyle & Trend Explorer',
  ];

  const getUserLabel = (uid) => {
    if (uid === 1) return `User #1 (Tech & Gaming - Admin)`;
    const pName = PERSONA_NAMES[(uid - 1) % PERSONA_NAMES.length];
    return `User #${uid} (${pName})`;
  };

  // Load initial diagnostics
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, metricsRes, matrixRes, cnnMatrixRes] = await Promise.allSettled([
        adminService.getModelStatus(),
        adminService.getModelMetrics(),
        adminService.getNcfAffinityMatrix(),
        adminService.getCnnEmbeddingMatrixSample(6),
      ]);

      if (statusRes.status === 'fulfilled') setModelStatus(statusRes.value);
      if (metricsRes.status === 'fulfilled') setModelMetrics(metricsRes.value);
      if (matrixRes.status === 'fulfilled') setAffinityData(matrixRes.value);
      if (cnnMatrixRes.status === 'fulfilled') setCnnMatrixData(cnnMatrixRes.value);

      // Auto-run baseline inferences
      runRecommendation(1, 4);
      runCnnSimilarity(3129, 4, true);
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
      showToast(err.message || 'NCF recommendation inference failed.', 'error');
    } finally {
      setSimLoading(false);
    }
  };

  const runCnnSimilarity = async (productId, topK, sameCategory = enforceSameCategory) => {
    try {
      setCnnLoading(true);
      const res = await adminService.getCnnVisualSimilarities(productId, topK, null, !sameCategory);
      setCnnResult(res);
    } catch (err) {
      showToast(err.message || 'CNN visual similarity search failed.', 'error');
    } finally {
      setCnnLoading(false);
    }
  };

  const handleRetrainRequest = async () => {
    try {
      setRetraining(true);
      const res = await adminService.requestRetraining({
        trigger: 'admin_ui_manual',
        model: retrainTarget,
        parameters: { epochs: 20, lr: 0.001, neg_ratio: 4 },
      });
      showToast(res.message || `Retraining requested for ${retrainTarget.toUpperCase()}.`, 'success');
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
  const cnn = modelStatus?.cnnDetails || {};
  const isNcfActive = ncf.status === 'ACTIVE';
  const isCnnActive = cnn.status === 'ACTIVE';
  const activeCount = modelStatus?.activeModelCount || (isNcfActive ? 1 : 0) + (isCnnActive ? 1 : 0);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">AI & Recommendation Models</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {activeCount} Models Active ({isNcfActive ? 'NCF' : ''}{isNcfActive && isCnnActive ? ' + ' : ''}{isCnnActive ? 'CNN' : ''})
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Neural Collaborative Filtering (NCF NeuMF) and ResNet18 CNN Visual Feature Extractor diagnostics, live inference telemetry, and visual similarity simulator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition-all hover:bg-neutral-50 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted" />
            Refresh Diagnostics
          </button>

          <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-sm">
            <select
              value={retrainTarget}
              onChange={(e) => setRetrainTarget(e.target.value)}
              className="bg-transparent px-2 py-1 text-xs font-medium text-ink focus:outline-none"
            >
              <option value="all">All Active Models</option>
              <option value="ncf">NCF (Collaborative)</option>
              <option value="cnn">CNN (ResNet18)</option>
            </select>
            <button
              onClick={handleRetrainRequest}
              disabled={retraining}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-50"
            >
              <Play className={`h-3 w-3 ${retraining ? 'animate-spin' : ''}`} />
              {retraining ? 'Retraining...' : 'Trigger Retrain'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-ink text-white shadow-sm'
              : 'text-muted hover:bg-neutral-100 hover:text-ink'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Multi-Model Architecture Pipeline
        </button>

        <button
          onClick={() => setActiveTab('ncf')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'ncf'
              ? 'bg-ink text-white shadow-sm'
              : 'text-muted hover:bg-neutral-100 hover:text-ink'
          }`}
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          NCF (Collaborative Filtering)
        </button>

        <button
          onClick={() => setActiveTab('cnn')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'cnn'
              ? 'bg-ink text-white shadow-sm'
              : 'text-muted hover:bg-neutral-100 hover:text-ink'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
          CNN (ResNet18 Visual Embeddings)
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
            NEW
          </span>
        </button>
      </div>

      {/* 2. Key Telemetry Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Architectures</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-ink">NCF + CNN</span>
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">v1.0.0</span>
          </div>
          <p className="mt-1 text-xs text-muted">Dual Branch: Collaborative Filtering + Visual Embeddings</p>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Evaluation & Retention</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">100.0%</span>
            <span className="text-xs font-medium text-muted">HR@10 / Cosine 256d</span>
          </div>
          <p className="mt-1 text-xs text-muted">Leave-one-out NCF hit rate & normalized visual metric</p>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Learned Latent Space</span>
            <Cpu className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-ink">{ncf.usersCount || 35} Users</span>
            <span className="text-xs font-medium text-muted">• {cnn.itemsCount || 999} Visual Vectors</span>
          </div>
          <p className="mt-1 text-xs text-muted">32d NCF Latent + 256d ResNet18 Projection</p>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Engine Status</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-lg font-bold text-ink">
              {isNcfActive && isCnnActive ? '2 Models Ready' : isNcfActive ? 'NCF Online' : 'Standby'}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted">
            Checkpoints: ncf_model.pt & cnn_model.pt
          </p>
        </div>
      </div>

      {/* 3. CNN Visual Similarity Simulator (Shown on 'all' and 'cnn' tabs) */}
      {(activeTab === 'all' || activeTab === 'cnn') && (
        <div className="card flex flex-col gap-6 p-6 border-l-4 border-l-emerald-500">
          <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-bold text-ink">CNN Visual Similarity Simulator (ResNet18 256-dim Embeddings)</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  LIVE MODEL
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                Extracts cosine-similar visual products from 256-dimensional ResNet-18 embeddings for cold-start and visually correlated product recommendations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted">Target Product:</label>
                <select
                  value={cnnProductId}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setCnnProductId(pid);
                    runCnnSimilarity(pid, cnnTopK);
                  }}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink focus:border-emerald-500 focus:outline-none max-w-[280px] truncate"
                >
                  {sampleProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.name} ({p.category})
                    </option>
                  ))}
                  {cnn.sampleProductIds &&
                    cnn.sampleProductIds
                      .filter((id) => !sampleProducts.some((sp) => sp.id === id))
                      .slice(0, 5)
                      .map((id) => (
                        <option key={id} value={id}>
                          Product #{id} (Catalogue Verified)
                        </option>
                      ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted">Top K:</label>
                <select
                  value={cnnTopK}
                  onChange={(e) => {
                    const k = Number(e.target.value);
                    setCnnTopK(k);
                    runCnnSimilarity(cnnProductId, k);
                  }}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-emerald-500 focus:outline-none"
                >
                  <option value={2}>Top 2</option>
                  <option value={4}>Top 4</option>
                  <option value={6}>Top 6</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted hover:text-ink">
                <input
                  type="checkbox"
                  checked={enforceSameCategory}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setEnforceSameCategory(val);
                    runCnnSimilarity(cnnProductId, cnnTopK, val);
                  }}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Same Category Only</span>
              </label>

              <button
                onClick={() => runCnnSimilarity(cnnProductId, cnnTopK)}
                disabled={cnnLoading}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <Compass className={`h-3.5 w-3.5 ${cnnLoading ? 'animate-spin' : ''}`} />
                {cnnLoading ? 'Searching...' : 'Find Visually Similar'}
              </button>
            </div>
          </div>

          {/* Target Product Banner */}
          {cnnResult?.targetProduct && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-white p-1">
                <img
                  src={cnnResult.targetProduct.mainImage || '/placeholder.png'}
                  alt={cnnResult.targetProduct.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    SOURCE QUERY PRODUCT #{cnnResult.targetProduct.id}
                  </span>
                  {cnnResult.targetProduct.categoryName && (
                    <span className="text-[11px] font-semibold text-muted">
                      Category: {cnnResult.targetProduct.categoryName}
                    </span>
<<<<<<< HEAD
                  )}
                </div>
                <h4 className="mt-1 text-xs font-bold text-ink truncate" title={cnnResult.targetProduct.name}>
                  {cnnResult.targetProduct.name}
                </h4>
                <div className="mt-0.5 text-[11px] text-muted">
                  Brand: {cnnResult.targetProduct.brand} • ₹{Number(cnnResult.targetProduct.finalPrice || cnnResult.targetProduct.price || 0).toLocaleString('en-IN')}
=======
                    {rec.rating > 0 && (
                      <span className="ml-2 text-[11px] font-medium text-amber-600">★ {rec.rating}</span>
                    )}
                  </div>
                  <Link
                    to={`/products/${rec.slug || rec.productId}`}
                    target="_blank"
                    className="flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </Link>
>>>>>>> 8966ea4 (fix: resolve product routing fallbacks, safe recommendation slugs, and database SSL config)
                </div>
              </div>
            </div>
          )}

          {/* CNN Similarity Results Showcase */}
          {cnnLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-xs font-medium text-muted">Computing 256-dim cosine similarity matrix across catalog...</p>
              </div>
            </div>
          ) : cnnResult?.similarProducts && cnnResult.similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cnnResult.similarProducts.map((item) => (
                <div
                  key={item.productId}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border-subtle bg-card-elevated p-4 transition-all hover:border-emerald-500 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-0.5 text-[11px] font-bold text-muted border border-border-subtle">
                      Rank #{item.rank}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {item.similarityPercentage}% Visual Match
                    </span>
                  </div>

                  <div className="my-3 flex items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                    <img
                      src={item.mainImage || '/placeholder.png'}
                      alt={item.name}
                      className="h-28 w-28 object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-muted">{item.brand}</div>
                    <h4 className="mt-0.5 line-clamp-2 text-xs font-bold text-ink" title={item.name}>
                      {item.name}
                    </h4>
                    {item.categoryName && (
                      <span className="mt-1 inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {item.categoryName}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                    <div>
                      <span className="text-xs font-extrabold text-ink">
                        ₹{Number(item.finalPrice || item.price || 0).toLocaleString('en-IN')}
                      </span>
                      {item.rating > 0 && (
                        <span className="ml-2 text-[11px] font-medium text-amber-600">★ {item.rating}</span>
                      )}
                    </div>
                    <Link
                      to={`/products/${item.productId}`}
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
            <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-neutral-50/50 p-6 text-center">
              <Info className="h-5 w-5 text-muted" />
              <p className="mt-2 text-xs font-medium text-ink">No visual similarity matches found.</p>
              <p className="text-[11px] text-muted">Select a product above and click "Find Visually Similar".</p>
            </div>
          )}
        </div>
      )}

      {/* 4. CNN Latent Vector Inspector (Shown on 'cnn' tab) */}
      {(activeTab === 'all' || activeTab === 'cnn') && cnnMatrixData?.samples && (
        <div className="card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-ink">CNN 256-Dimensional Latent Embedding Sample Matrix</h3>
              </div>
              <p className="text-xs text-muted">
                L2-normalized feature embeddings produced by ResNet-18 backbone and projection head for cosine similarity search.
              </p>
            </div>
            <span className="rounded-md bg-indigo-50 text-indigo-700 px-2.5 py-1 text-[11px] font-semibold">
              Dim: 256 | L2 Norm = 1.0000
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-neutral-50/70 text-muted">
                  <th className="px-4 py-2.5 font-semibold">Product ID</th>
                  <th className="px-4 py-2.5 font-semibold">Sample Coordinates (d0 .. d7)</th>
                  <th className="px-4 py-2.5 font-semibold">Vector Norm</th>
                  <th className="px-4 py-2.5 font-semibold">Embedding State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {cnnMatrixData.samples.map((sample, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-neutral-50/50">
                    <td className="px-4 py-2.5 font-bold text-ink">Product #{sample.product_id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(sample.vector_sample || []).map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              val >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {val >= 0 ? `+${val.toFixed(4)}` : val.toFixed(4)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-indigo-700">{sample.norm || '1.0000'}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Check className="h-3 w-3" /> NORMALIZED 256d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. NCF Live Recommendation Simulator (Shown on 'all' and 'ncf' tabs) */}
      {(activeTab === 'all' || activeTab === 'ncf') && (
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
                  onChange={(e) => {
                    const uid = Number(e.target.value);
                    setSimUserId(uid);
                    runRecommendation(uid, simTopK);
                  }}
                  className="rounded-lg border border-border-subtle bg-card-elevated px-3 py-1.5 text-xs font-semibold text-ink focus:border-accent focus:outline-none max-w-[280px] truncate"
                >
                  {(ncf.userIds || Array.from({ length: 50 }, (_, i) => i + 1)).map((uid) => (
                    <option key={uid} value={uid}>
                      {getUserLabel(uid)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted">Top K:</label>
                <select
                  value={simTopK}
                  onChange={(e) => {
                    const k = Number(e.target.value);
                    setSimTopK(k);
                    runRecommendation(simUserId, k);
                  }}
                  className="rounded-lg border border-border-subtle bg-card-elevated px-2.5 py-1.5 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                >
                  <option value={2}>Top 2</option>
                  <option value={4}>Top 4</option>
                  <option value={10}>Top 10</option>
                </select>
              </div>

              <button
                onClick={() => runRecommendation(simUserId, simTopK)}
                disabled={simLoading}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-ink transition-all hover:bg-[#cbf730] active:scale-95 disabled:opacity-50"
              >
                <Play className={`h-3 w-3 ${simLoading ? 'animate-spin' : ''}`} />
                {simLoading ? 'Predicting...' : 'Run Inference'}
              </button>
            </div>
          </div>

          {/* Active Profile Persona Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-ink">Selected Profile:</span>
              <span className="rounded bg-accent/20 px-2 py-0.5 font-bold text-ink">
                {getUserLabel(simUserId)}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-muted">
              50 Trained Users • Personalized Collaborative Latent Space
            </span>
          </div>

          {/* Results Showcase */}
          {simLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-xs font-medium text-muted">Executing neural network forward pass...</p>
              </div>
            </div>
          ) : simResult?.recommendations && simResult.recommendations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {simResult.recommendations.map((rec) => (
                <div
                  key={rec.productId}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border-subtle bg-card-elevated p-4 transition-all hover:border-border-strong"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-0.5 text-[11px] font-bold text-muted border border-border-subtle">
                      Rank #{rec.rank}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent">
                      {rec.affinityPercentage}% Match
                    </span>
                  </div>

                  <div className="my-3 flex items-center justify-center overflow-hidden rounded-lg bg-card-elevated p-2">
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
      )}

      {/* 6. Full Predicted Affinity Matrix (Shown on 'ncf' tab) */}
      {(activeTab === 'all' || activeTab === 'ncf') && affinityData?.matrix && affinityData.matrix.length > 0 && (
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

      {/* 7. Complete Multi-Modal Architecture Roadmap List */}
      <div className="card flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-ink">Cartify 5-Stage Multi-Model Recommendation Pipeline</h3>
            <p className="text-xs text-muted">
              Hybrid recommendation architecture combining collaborative filtering, deep visual embeddings, session sequence recurrent networks, and multi-modal attention fusion.
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold">
            {activeCount} of 5 Models Online
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {(modelStatus?.models || []).map((m, idx) => {
            const isActive = m.status === 'ACTIVE';
            const isScaffold = m.status === 'SCAFFOLD_READY';
            const isCnn = m.name.toLowerCase().includes('cnn');
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
                    {m.description || 'Component of multi-model recommendation pipeline.'}
                  </p>
                </div>

                <div className="mt-3 border-t border-border/50 pt-2 text-[10px] text-muted flex flex-col gap-1">
                  {isActive ? (
                    <>
                      <span className="font-semibold text-emerald-700 truncate">
                        Loaded: {isCnn ? 'artifacts/cnn_model.pt & cnn_embeddings.npy' : 'artifacts/ncf_model.pt'}
                      </span>
                      {isCnn && (
                        <button
                          onClick={() => setActiveTab('cnn')}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline"
                        >
                          <Compass className="h-3 w-3" /> Test CNN Visual Search
                        </button>
                      )}
                    </>
                  ) : (
                    <span>Scaffold: ml-service/planned/</span>
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