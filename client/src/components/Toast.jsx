import { CheckCircle2, XCircle, X } from 'lucide-react';

const STYLES = {
  success: 'border-l-4 border-emerald-500',
  error: 'border-l-4 border-red-500',
};

export default function Toast({ message, type = 'success', onClose }) {
  const Icon = type === 'error' ? XCircle : CheckCircle2;
  const iconColor = type === 'error' ? 'text-red-500' : 'text-emerald-500';

  return (
    <div
      role="status"
      className={`card ${STYLES[type]} flex w-80 items-start gap-3 px-4 py-3 shadow-cardHover animate-[fadeIn_0.15s_ease-out]`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm text-ink">{message}</p>
      <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss notification">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
