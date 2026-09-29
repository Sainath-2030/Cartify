import { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Play,
  CheckCircle2,
  Clock,
  Cpu,
  BrainCircuit,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
  History,
  AlertCircle,
  FileText,
  User,
  Zap
} from 'lucide-react';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../hooks/useToast.js';

export default function AdminRetraining() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);

  // Form state
  const [selectedModel, setSelectedModel] = useState('all');
  const [triggerType, setTriggerType] = useState('manual');
  const [epochs, setEpochs] = useState(20);
  const [negSampling, setNegSampling] = useState(4);
  const [recentJob, setRecentJob] = useState(null);

  const fetchRetrainingData = useCallback(async () => {
    try {
      setLoading(true);
      const [logsRes, statusRes] = await Promise.all([
        adminService.getAuditLogs(25).catch(() => []),
        adminService.getModelStatus().catch(() => null),
      ]);
      setAuditLogs(Array.isArray(logsRes) ? logsRes : (logsRes?.data || []));
      setModelStatus(statusRes);
    } catch (err) {
      console.error('Failed to load retraining data:', err);
      showToast('Failed to load retraining and audit history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRetrainingData();
  }, [fetchRetrainingData]);

  const handleTriggerRetrain = async (e) => {
    e.preventDefault();
    try {
      setDispatching(true);
      const res = await adminService.requestRetraining({
        trigger: triggerType,
        model: selectedModel,
        parameters: {
          epochs: parseInt(epochs, 10),
          negativeSamplingRatio: parseInt(negSampling, 10),
          batchSize: 256,
        },
      });

      const jobData = res.data || res;
      setRecentJob(jobData);
      showToast('Retraining job registered and queued in audit log.', 'success');
      // Refresh audit logs to show newly inserted log entry
      fetchRetrainingData();
    } catch (err) {
      console.error('Retrain request error:', err);
      showToast('Failed to dispatch retraining request.', 'error');
    } finally {
      setDispatching(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      showToast('Computing offline Leave-One-Out multi-model benchmarks...', 'info');
      const res = await adminService.triggerModelEvaluation();
      showToast('Offline model evaluation benchmark completed successfully!', 'success');
      fetchRetrainingData();
    } catch (err) {
      console.error('Evaluation trigger failed:', err);
      showToast('Failed to execute offline benchmark evaluation.', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All 5 Recommendation Models Online
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted font-mono">Offline Training & Retraining Dispatcher</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink font-display">
            Model Retraining & Pipeline Control
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Dispatch asynchronous retraining jobs across NCF, CNN, GRU, Autoencoder, and Attention Fusion models, and trigger offline cross-validation evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="btn btn-secondary text-xs h-9 px-3.5 gap-2 shadow-xs disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin text-accent' : ''}`} />
            {evaluating ? 'Evaluating...' : 'Recalculate Benchmarks'}
          </button>
          <button
            onClick={fetchRetrainingData}
            disabled={loading}
            className="btn btn-secondary p-2.5"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Model Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { name: 'Attention Fusion', tag: 'Hybrid Softmax', file: 'fusion_model.pt' },
          { name: 'NCF (NeuMF)', tag: 'Collaborative', file: 'ncf_model.pt' },
          { name: 'CNN (ResNet-18)', tag: 'Visual Features', file: 'cnn_embeddings.npy' },
          { name: 'GRU (RNN)', tag: 'Session Sequence', file: 'gru_model.pt' },
          { name: 'Autoencoder', tag: 'CDAE Latent', file: 'autoencoder_model.pt' },
        ].map((m, i) => (
          <div key={i} className="card p-4 border-border-subtle shadow-xs flex flex-col justify-between hover:border-border-strong transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-3xs font-mono font-bold uppercase tracking-wider text-muted">{m.tag}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <h3 className="font-semibold text-xs text-ink mt-1.5">{m.name}</h3>
              <p className="font-mono text-3xs text-muted mt-0.5 truncate">{m.file}</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-3xs text-emerald-400 font-semibold">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Deployed
              </span>
              <span className="font-mono text-muted font-normal">v1.0</span>
            </div>
          </div>
        ))}
      </div>

      {/* Retraining Dispatch Form */}
      <div className="card border-border-subtle overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            Dispatch Model Retraining Job
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Queue an asynchronous offline training run against latest PostgreSQL interaction telemetry and catalogue snapshots.
          </p>
        </div>

        <form onSubmit={handleTriggerRetrain} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Target Model */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink">Target ML Component</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="input-field select-field text-xs"
              >
                <option value="all">Complete Pipeline (Attention Fusion + All Sub-models)</option>
                <option value="fusion">Attention Fusion Aggregator Only</option>
                <option value="ncf">NCF (Neural Collaborative Filtering)</option>
                <option value="gru">GRU (Sequential Session RNN)</option>
                <option value="autoencoder">CDAE (Collaborative Denoising Autoencoder)</option>
                <option value="cnn">CNN (ResNet-18 Visual Embeddings)</option>
              </select>
            </div>

            {/* Trigger Reason */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink">Trigger Origin</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="input-field select-field text-xs"
              >
                <option value="manual">Manual Admin Trigger</option>
                <option value="scheduled_batch">Scheduled Nightly Batch Cron</option>
                <option value="telemetry_drift_detected">Telemetry Drift Threshold Exceeded</option>
                <option value="catalogue_bulk_import">New Dataset Ingestion Sync</option>
              </select>
            </div>

            {/* Hyperparameter: Epochs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink">Training Epochs</label>
              <input
                type="number"
                min="5"
                max="100"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-2xs text-muted">
              <ShieldCheck className="w-4 h-4 text-muted" />
              <span>Job parameter contract validated and logged to <code className="font-mono text-ink bg-card-elevated px-1.5 py-0.5 rounded border border-border-subtle">audit_logs</code>.</span>
            </div>

            <button
              type="submit"
              disabled={dispatching}
              className="btn btn-primary text-xs shrink-0"
            >
              <Play className={`w-3.5 h-3.5 ${dispatching ? 'animate-spin' : ''}`} />
              {dispatching ? 'Dispatching...' : 'Dispatch Retraining Request'}
            </button>
          </div>
        </form>

        {recentJob && (
          <div className="bg-emerald-500/15 border-t border-emerald-500/30 p-4 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Job <strong>{recentJob.requestId}</strong> successfully registered ({recentJob.trigger}) by <strong>{recentJob.requestedBy}</strong>.
              </span>
            </div>
            <span className="font-mono text-2xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
              STATUS: {recentJob.status || 'QUEUED'}
            </span>
          </div>
        )}
      </div>

      {/* Audit Log & History Table */}
      <div className="card border-border-subtle overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              Administrative Audit Log & Retraining History
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Chronological log of administrative actions, model retraining triggers, and configuration edits in PostgreSQL.
            </p>
          </div>
          <span className="font-mono text-xs text-muted">{auditLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card-elevated text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border-subtle">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Action</th>
                <th className="py-3 px-5">Target Entity</th>
                <th className="py-3 px-5">Actor</th>
                <th className="py-3 px-5">Metadata Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-ink">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-muted text-xs">
                    No recent audit logs recorded.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent';
                  const isRetrain = log.action === 'MODEL_RETRAIN_REQUEST';
                  const isConfig = log.action === 'BUSINESS_RULES_UPDATE';

                  return (
                    <tr key={log.id} className="hover:bg-card-elevated transition-colors">
                      <td className="py-3 px-5 font-mono text-2xs text-muted whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-mono font-semibold ${
                            isRetrain
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : isConfig
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-card-elevated text-muted border border-border-subtle'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-mono text-2xs text-muted">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                      </td>
                      <td className="py-3 px-5 text-ink font-medium">
                        {log.user_email || 'System Admin'}
                      </td>
                      <td className="py-3 px-5 font-mono text-3xs text-muted max-w-md truncate">
                        {typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : String(log.metadata || '-')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}