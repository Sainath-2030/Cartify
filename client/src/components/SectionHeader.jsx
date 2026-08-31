import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeader({
  title,
  subtitle,
  linkText,
  linkTo,
  className = '',
  action,
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 ${className}`}>
      <div>
        <h2 className="text-h2">{title}</h2>
        {subtitle && <p className="text-body-muted mt-1">{subtitle}</p>}
      </div>

      {linkTo && linkText && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors group"
        >
          <span>{linkText}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}
