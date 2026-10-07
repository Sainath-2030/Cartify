import { Component } from 'react';

/**
 * Panel-level error boundary for the BI dashboard sections.
 *
 * Without this, a single render-time throw inside one panel unmounts the whole
 * React tree and the user sees a blank black screen with no way to recover.
 * Each section is wrapped independently so a failure degrades to a visible,
 * theme-aware error card while the rest of the dashboard keeps working.
 */
export default class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.label || 'Panel'}] render error:`, error, info);
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="card border-red-500/40 bg-red-500/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {this.props.label || 'This section'} failed to render
            </h3>
            <p className="text-xs text-muted mt-1">
              The rest of the dashboard is unaffected. You can retry this section or
              switch tabs.
            </p>
            <pre className="mt-3 text-[11px] font-mono text-red-400 bg-black/20 border border-red-500/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-40">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
          <button
            onClick={this.handleRetry}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-border-subtle bg-card-elevated text-xs font-medium text-ink hover:border-border-strong transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}
