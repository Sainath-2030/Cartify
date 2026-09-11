import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const STYLES = {
  success: {
    border: 'border-success/30 bg-card text-ink',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  error: {
    border: 'border-error/30 bg-card text-ink',
    icon: XCircle,
    iconColor: 'text-error',
  },
  warning: {
    border: 'border-warning/30 bg-card text-ink',
    icon: AlertCircle,
    iconColor: 'text-warning',
  },
  info: {
    border: 'border-accent/30 bg-card text-ink',
    icon: Info,
    iconColor: 'text-accent',
  },
};

export default function Toast({ message, type = 'success', onClose }) {
  const currentStyle = STYLES[type] || STYLES.info;
  const Icon = currentStyle.icon;

  return (
    <div
      role="status"
      className={`rounded-2xl border ${currentStyle.border} flex w-88 max-w-sm items-start gap-3 p-3.5 shadow-dropdown transition-all duration-200`}
    >
      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${currentStyle.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug text-ink">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-muted hover:bg-card-elevated hover:text-ink transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
