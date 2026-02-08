import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute - Auth guard for routes that require authentication.
 *
 * If Clerk is still loading, shows a spinner.
 * If the user is not signed in, redirects to /sign-in.
 * If bypassAuth is true (dev mode without Clerk keys), always renders children.
 */
export default function ProtectedRoute({ bypassAuth = false }) {
  // In bypass mode, skip all auth checks
  if (bypassAuth) {
    return <Outlet />;
  }

  return <ProtectedRouteWithAuth />;
}

function ProtectedRouteWithAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent"></div>
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
