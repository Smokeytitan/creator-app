import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-caption font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 text-sm rounded-lg
          bg-[var(--color-bg-tertiary)]
          border ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'}
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-tertiary)]
          transition-colors duration-150
          focus:outline-none focus:border-[var(--color-accent-primary)]
          focus:ring-2 focus:ring-[var(--color-accent-muted)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-caption text-[var(--color-error)]">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-caption text-[var(--color-text-tertiary)]">{helperText}</p>
      )}
    </div>
  );
});

export default Input;
