import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, LinkIcon } from 'lucide-react';

const DISMISS_KEY = 'dismissedXBanner';

/**
 * ConnectXBanner - Dismissible banner shown when the creator has not
 * connected their X account. Persists dismissal in localStorage.
 */
export default function ConnectXBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-[var(--color-accent-muted)] border border-[var(--color-accent-primary)]/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-accent-primary)]/20 flex items-center justify-center">
          <LinkIcon className="w-4 h-4 text-[var(--color-accent-primary)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Connect your X account to participate in campaigns
          </p>
          <Link
            to="/profile"
            className="text-xs text-[var(--color-accent-primary)] hover:underline mt-0.5 inline-block"
          >
            Go to Profile settings
          </Link>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
