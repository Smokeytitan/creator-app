import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser, useAuth, UserButton } from '@clerk/clerk-react';
import { Megaphone, User } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import PendingApprovalPage from '../creator/PendingApprovalPage';

/**
 * CreatorLayout - Layout wrapper for the creator-facing portal.
 *
 * Features:
 * - Header with logo, nav links (Campaigns, Profile), ThemeToggle, Clerk UserButton
 * - Admin link if user has ADMIN role in Clerk publicMetadata
 * - Checks user's `approved` status from Supabase. If not approved, shows PendingApprovalPage.
 * - Renders <Outlet /> for child route content when approved
 *
 * When bypassAuth is true (dev mode), skips the approval check and always renders children.
 */
export default function CreatorLayout({ bypassAuth = false }) {
  if (bypassAuth) {
    return <CreatorLayoutShell bypassAuth={true} isAdmin={false} isApproved={true} approvalLoading={false} />;
  }

  return <CreatorLayoutWithAuth />;
}

function CreatorLayoutWithAuth() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(true);

  useEffect(() => {
    async function checkApproval() {
      if (!user) {
        setApprovalLoading(false);
        return;
      }

      // Check Clerk publicMetadata for admin role
      if (user.publicMetadata?.role === 'ADMIN') {
        setIsAdmin(true);
        setIsApproved(true);
        setApprovalLoading(false);
        return;
      }

      // Check approval via API (uses service role key, bypasses RLS)
      try {
        const token = await getToken();
        const res = await fetch('/api/creator/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const { user: profile } = await res.json();
          setIsApproved(!!profile?.approved || profile?.role === 'admin');
          setIsAdmin(profile?.role === 'admin');
        } else {
          console.error('[CreatorLayout] Profile API returned', res.status);
          setIsApproved(false);
        }
      } catch (err) {
        console.error('[CreatorLayout] Failed to check approval:', err);
        setIsApproved(false);
      }

      setApprovalLoading(false);
    }

    checkApproval();
  }, [user, getToken]);

  return (
    <CreatorLayoutShell
      bypassAuth={false}
      isAdmin={isAdmin}
      isApproved={isApproved}
      approvalLoading={approvalLoading}
    />
  );
}

function CreatorLayoutShell({ bypassAuth, isAdmin, isApproved, approvalLoading }) {
  const location = useLocation();

  // Show loading state while checking approval
  if (approvalLoading) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent"></div>
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show pending approval page if not approved
  if (!isApproved) {
    return <PendingApprovalPage />;
  }

  const navLinks = [
    { to: '/', label: 'Campaigns', icon: Megaphone },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-primary)] transition-colors overflow-x-hidden">
      {/* Header */}
      <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-3 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
                <span className="text-white text-lg font-bold">P</span>
              </div>
              <h1 className="text-display text-lg text-[var(--color-text-primary)] tracking-tight">
                Creator Portal
              </h1>
            </Link>
          </div>

          {/* Navigation + Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = link.to === '/'
                  ? location.pathname === '/' || location.pathname.startsWith('/campaigns')
                  : location.pathname.startsWith(link.to);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}

              {/* Admin link (only for admins) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Theme Toggle + User Button */}
            <div className="flex items-center gap-2 ml-1">
              <ThemeToggle />
              {!bypassAuth && <UserButton afterSignOutUrl="/sign-in" />}
              {bypassAuth && (
                <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                  Dev Mode
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <Outlet />
    </div>
  );
}
