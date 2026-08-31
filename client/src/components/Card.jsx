export default function Card({
  children,
  className = '',
  hover = false,
  interactive = false,
  padding = 'p-6',
  as: Component = 'div',
  ...props
}) {
  const baseClass = interactive ? 'card-interactive' : hover ? 'card-hover' : 'card';
  return (
    <Component className={`${baseClass} ${padding} ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '', border = true }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${border ? 'border-b border-surface-border pb-4 mb-4' : 'mb-3'} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-h3 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-caption mt-0.5 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '', border = true }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${border ? 'border-t border-surface-border pt-4 mt-4' : 'mt-3'} ${className}`}>
      {children}
    </div>
  );
}
