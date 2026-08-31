export default function Skeleton({
  variant = 'rectangular',
  className = '',
  width,
  height,
}) {
  let baseStyle = 'animate-pulse bg-zinc-200/80';

  if (variant === 'circular') {
    baseStyle += ' rounded-full';
  } else if (variant === 'text') {
    baseStyle += ' rounded-md h-4 my-1';
  } else {
    baseStyle += ' rounded-xl';
  }

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return <div className={`${baseStyle} ${className}`} style={style} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <Skeleton variant="rectangular" className="aspect-square w-full rounded-xl bg-zinc-100" />
      <Skeleton variant="text" className="w-1/3 h-3" />
      <Skeleton variant="text" className="w-full h-4" />
      <div className="mt-auto flex items-center justify-between pt-2">
        <Skeleton variant="text" className="w-1/4 h-5" />
        <Skeleton variant="rectangular" className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="border-b border-zinc-100 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" className="w-full h-4" />
        </td>
      ))}
    </tr>
  );
}
