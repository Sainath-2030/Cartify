import { PackageSearch } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  actionText,
  onAction,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-card px-6 py-16 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card-elevated border border-border-subtle text-muted">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink mt-1">{title}</h3>
      {description && <p className="max-w-md text-xs text-muted leading-relaxed">{description}</p>}
      {action ? (
        <div className="mt-2">{action}</div>
      ) : actionText && onAction ? (
        <div className="mt-2">
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
