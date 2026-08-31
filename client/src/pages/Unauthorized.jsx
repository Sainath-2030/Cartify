import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-ink">You don't have access to this page</h1>
      <p className="max-w-sm text-sm text-muted">
        This area is restricted to a different Cartify role. If you believe this is a mistake, contact an administrator.
      </p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  );
}