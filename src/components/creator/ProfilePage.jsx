import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';
import XAccountCard from './XAccountCard';
import TelegramCard from './TelegramCard';
import WalletCard from './WalletCard';

/**
 * ProfilePage - Creator profile with avatar, name, and connection cards.
 *
 * Fetches the user row from Supabase to populate connection state, then
 * passes it down to each card. Cards call `onRefresh` after mutations to
 * keep everything in sync.
 */
export default function ProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  const fetchUserData = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // PGRST116 = no rows found — user may not exist in DB yet
        if (fetchError.code === 'PGRST116') {
          setUserData(null);
          return;
        }
        throw fetchError;
      }

      setUserData(data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchUserData();
    }
  }, [isUserLoaded, user, fetchUserData]);

  // Derive display values
  const displayName =
    userData?.full_name ||
    user?.fullName ||
    user?.firstName ||
    'Creator';

  const displayEmail =
    userData?.email ||
    user?.primaryEmailAddress?.emailAddress ||
    '';

  const avatarUrl = userData?.x_avatar_url || user?.imageUrl || null;

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ---- Render ----

  if (!isUserLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent" />
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <p className="text-red-400 font-medium mb-2">Something went wrong</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-border)]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-muted)] flex items-center justify-center text-lg font-bold text-[var(--color-accent-primary)] border-2 border-[var(--color-border)]">
            {initials}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
            {displayName}
          </h1>
          {displayEmail && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {displayEmail}
            </p>
          )}
        </div>
      </div>

      {/* Connection cards */}
      <div className="grid grid-cols-1 gap-4">
        <XAccountCard userData={userData} onRefresh={fetchUserData} />
        <TelegramCard userData={userData} onRefresh={fetchUserData} />
        <WalletCard userData={userData} onRefresh={fetchUserData} />
      </div>
    </div>
  );
}
