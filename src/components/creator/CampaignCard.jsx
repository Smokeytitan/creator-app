import { Link } from 'react-router-dom';
import { FileText, Image, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * CampaignCard - Displays a campaign summary in a grid card layout.
 *
 * @param {Object} props
 * @param {Object} props.campaign - Campaign row from the `campaigns` table
 */
export default function CampaignCard({ campaign }) {
  const {
    id,
    title,
    description,
    status,
    brief,
    media_urls,
    created_at,
  } = campaign;

  const truncated =
    description && description.length > 100
      ? description.slice(0, 100).trimEnd() + '...'
      : description;

  const mediaCount = Array.isArray(media_urls) ? media_urls.length : 0;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      to={`/campaigns/${id}`}
      className="block bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-border-hover)] transition-all group"
    >
      {/* Header: title + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-accent-primary)] transition-colors line-clamp-2">
          {title || 'Untitled Campaign'}
        </h3>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Description */}
      {truncated && (
        <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          {truncated}
        </p>
      )}

      {/* Footer indicators */}
      <div className="flex items-center gap-3 flex-wrap">
        {brief && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent-primary)] bg-[var(--color-accent-muted)] px-2 py-1 rounded-md font-medium">
            <FileText className="w-3 h-3" />
            Brief available
          </span>
        )}

        {mediaCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-md font-medium">
            <Image className="w-3 h-3" />
            {mediaCount} {mediaCount === 1 ? 'file' : 'files'}
          </span>
        )}

        {formattedDate && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] ml-auto">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
        )}
      </div>
    </Link>
  );
}
