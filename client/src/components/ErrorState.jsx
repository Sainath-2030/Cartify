import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an issue processing your request. Please try again or navigate back to the catalogue.',
  onRetry,
  onBack,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/40 px-6 py-16 text-center ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100/80 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-h3 text-ink mt-1 font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-zinc-600 leading-relaxed">{description}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry} icon={RotateCw}>
            Try again
          </Button>
        )}
        {onBack && (
          <Button variant="secondary" onClick={onBack} icon={ArrowLeft}>
            Go back
          </Button>
        )}
      </div>
    </div>
  );
}
