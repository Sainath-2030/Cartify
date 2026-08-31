import { Construction } from 'lucide-react';

export default function ComingSoon({ title, description }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Construction className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-muted">
        Planned for a future section
      </span>
    </div>
  );
}