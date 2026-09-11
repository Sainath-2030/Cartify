import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center bg-surface">
      <p className="text-6xl font-extrabold text-accent">404</p>
      <h1 className="text-xl font-bold text-ink">Page not found</h1>
      <p className="max-w-sm text-xs text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
