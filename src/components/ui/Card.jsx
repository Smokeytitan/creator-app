const variants = {
  default: 'border-[var(--color-border)]',
  interactive: 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] cursor-pointer',
  highlighted: 'border-[var(--color-border)] border-l-[var(--color-accent-primary)] border-l-2',
};

export default function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        bg-[var(--color-bg-secondary)] border rounded-xl
        transition-colors duration-150
        ${variants[variant] || variants.default}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-[var(--color-border)] ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
