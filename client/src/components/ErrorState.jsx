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
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-error/30 bg-card px-6 py-16 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/15 text-error">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink mt-1">{title}</h3>
      {description && <p className="max-w-md text-xs text-muted leading-relaxed">{description}</p>}
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
