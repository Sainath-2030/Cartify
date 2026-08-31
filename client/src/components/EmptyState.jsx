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
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-6 py-16 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-h3 text-ink mt-1 font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-zinc-500 leading-relaxed">{description}</p>}
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
