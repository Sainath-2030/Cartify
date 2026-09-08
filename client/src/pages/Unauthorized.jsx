import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center bg-surface">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/15 text-error border border-error/30">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-ink">You don't have access to this page</h1>
      <p className="max-w-sm text-xs text-muted">
        This area is restricted to a different Cartify role. If you believe this is a mistake, contact an administrator.
      </p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}