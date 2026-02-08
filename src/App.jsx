import { Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import CreatorRosterPage from './components/roster/CreatorRosterPage';
import CreatorProspectsPage from './components/roster/CreatorProspectsPage';
import { Campaigns } from './components/Campaigns';
import Analytics from './components/Analytics';
import SignInPage from './components/auth/SignInPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import CreatorLayout from './components/layouts/CreatorLayout';
import CampaignFeed from './components/creator/CampaignFeed';
import CampaignDetail from './components/creator/CampaignDetail';
import ProfilePage from './components/creator/ProfilePage';
import UserManagement from './components/admin/UserManagement';

export default function App({ bypassAuth = false }) {
  if (bypassAuth) {
    return <AppWithoutAuth />;
  }
  return <AppWithAuth />;
}

// Component for bypassed auth mode (dev mode without Clerk keys)
function AppWithoutAuth() {
  return (
    <Routes>
      {/* Sign-in page (accessible but not enforced) */}
      <Route path="/sign-in" element={<SignInPage />} />

      {/* Creator routes - bypass auth */}
      <Route element={<CreatorLayout bypassAuth={true} />}>
        <Route index element={<CampaignFeed />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin routes - bypass auth */}
      <Route path="admin" element={<AdminLayout bypassAuth={true} />}>
        <Route index element={<Navigate to="/admin/roster" replace />} />
        <Route path="roster" element={<AdminRosterRoute />} />
        <Route path="prospects" element={<AdminProspectsRoute />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="analytics" element={<AdminAnalyticsRoute />} />


        <Route path="users" element={<UserManagement />} />
      </Route>

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Component with Clerk authentication
function AppWithAuth() {
  const { isLoaded } = useAuth();

  // Show loading while Clerk is initializing
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

  return (
    <Routes>
      {/* Public route: sign-in */}
      <Route path="/sign-in" element={<SignInPage />} />

      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Creator routes */}
        <Route element={<CreatorLayout />}>
          <Route index element={<CampaignFeed />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin routes */}
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/roster" replace />} />
          <Route path="roster" element={<AdminRosterRoute />} />
          <Route path="prospects" element={<AdminProspectsRoute />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="analytics" element={<AdminAnalyticsRoute />} />
  
  
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// --- Admin route wrapper components ---
// These extract data from AdminLayout's outlet context and pass as props

function AdminRosterRoute() {
  const { creators, setCreators } = useOutletContext();
  return <CreatorRosterPage creators={creators} setCreators={setCreators} />;
}

function AdminProspectsRoute() {
  const { prospects, setProspects, creators, setCreators } = useOutletContext();
  return <CreatorProspectsPage prospects={prospects} setProspects={setProspects} setCreators={setCreators} />;
}

function AdminAnalyticsRoute() {
  const { creators, requests } = useOutletContext();
  return <Analytics creators={creators} requests={requests} />;
}


