import { Loader2 } from 'lucide-react';

export default function Loader({ label = 'Loading…', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-muted">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-[60vh] items-center justify-center">{content}</div>;
  }

  return content;
}
