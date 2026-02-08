import { useUser, useClerk } from '@clerk/clerk-react';
import { Clock, LogOut } from 'lucide-react';

/**
 * PendingApprovalPage - Shown to creators whose account has not yet been approved.
 *
 * Displays the user's email, a clear status message, and a sign-out button.
 * Uses the existing design tokens for consistent styling.
 */
export default function PendingApprovalPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress || 'your account';

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-8 text-center">
        {/* Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-accent-muted)]">
          <Clock size={32} className="text-[var(--color-accent-primary)]" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          Account Pending Approval
        </h1>

        {/* Description */}
        <p className="text-[var(--color-text-secondary)] mb-2">
          Your account is currently under review. An administrator will approve your access shortly.
        </p>

        {/* Email display */}
        <p className="text-sm text-[var(--color-text-tertiary)] mb-8">
          Signed in as <span className="font-medium text-[var(--color-text-secondary)]">{email}</span>
        </p>

        {/* Sign out button */}
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-semibold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
