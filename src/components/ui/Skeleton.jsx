export default function Skeleton({ className = '', variant = 'text' }) {
  const baseClasses = 'animate-pulse bg-[var(--color-bg-tertiary)] rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    heading: 'h-6 w-48',
    card: 'h-32 w-full rounded-xl',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-9 w-24 rounded-lg',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant] || variantClasses.text} ${className}`} />
  );
}

export function SkeletonRow({ columns = 4 }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)]">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={i === 0 ? 'w-40' : 'w-24'} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}
