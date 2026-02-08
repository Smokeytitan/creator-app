import { Clock } from 'lucide-react';

/**
 * ComingSoonCard - Placeholder card for platforms not yet available.
 *
 * @param {Object} props
 * @param {string} props.name     - Platform display name (e.g. "TikTok")
 * @param {string} props.subtitle - Short description
 */
export default function ComingSoonCard({ name, subtitle }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 opacity-60">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {name}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {subtitle}
          </p>
        </div>
        <Clock className="w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0" />
      </div>

      <button
        disabled
        className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-sm font-medium text-[var(--color-text-tertiary)] cursor-not-allowed"
      >
        Coming Soon
      </button>
    </div>
  );
}
