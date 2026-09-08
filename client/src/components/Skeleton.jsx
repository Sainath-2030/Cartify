export default function Skeleton({
  variant = 'rectangular',
  className = '',
  width,
  height,
}) {
  let baseStyle = 'animate-pulse bg-card-elevated';

  if (variant === 'circular') {
    baseStyle += ' rounded-full';
  } else if (variant === 'text') {
    baseStyle += ' rounded-md h-4 my-1';
  } else {
    baseStyle += ' rounded-lg';
  }

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return <div className={`${baseStyle} ${className}`} style={style} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-3 flex flex-col gap-3">
      <Skeleton variant="rectangular" className="aspect-square w-full rounded-xl bg-card-elevated" />
      <Skeleton variant="text" className="w-1/3 h-3" />
      <Skeleton variant="text" className="w-full h-4" />
      <div className="mt-auto flex items-center justify-between pt-2">
        <Skeleton variant="text" className="w-1/4 h-5" />
        <Skeleton variant="rectangular" className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="border-b border-border-subtle animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" className="w-full h-4" />
        </td>
      ))}
    </tr>
  );
}
