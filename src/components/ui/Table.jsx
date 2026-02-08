export default function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead>
      <tr className={`border-b border-[var(--color-border)] ${className}`}>
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-overline text-[var(--color-text-tertiary)] font-medium ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '', onClick, ...props }) {
  return (
    <tr
      className={`
        border-b border-[var(--color-border)]
        transition-colors duration-150
        ${onClick ? 'hover:bg-[var(--color-bg-tertiary)] cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-[var(--color-text-secondary)] ${className}`}>
      {children}
    </td>
  );
}
