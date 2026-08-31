import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const STYLES = {
  success: {
    border: 'border-emerald-500/30 bg-white text-emerald-950',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    border: 'border-red-500/30 bg-white text-red-950',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
  warning: {
    border: 'border-amber-500/30 bg-white text-amber-950',
    icon: AlertCircle,
    iconColor: 'text-amber-600',
  },
  info: {
    border: 'border-sky-500/30 bg-white text-sky-950',
    icon: Info,
    iconColor: 'text-sky-600',
  },
};

export default function Toast({ message, type = 'success', onClose }) {
  const currentStyle = STYLES[type] || STYLES.info;
  const Icon = currentStyle.icon;

  return (
    <div
      role="status"
      className={`rounded-2xl border ${currentStyle.border} flex w-88 max-w-sm items-start gap-3 p-4 shadow-xl transition-all duration-200`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${currentStyle.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug text-zinc-900">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
