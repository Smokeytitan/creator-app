import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-9 py-2 text-sm rounded-lg
          bg-[var(--color-bg-tertiary)]
          border border-[var(--color-border)]
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-tertiary)]
          transition-colors duration-150
          focus:outline-none focus:border-[var(--color-accent-primary)]
          focus:ring-2 focus:ring-[var(--color-accent-muted)]
        "
        {...props}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
