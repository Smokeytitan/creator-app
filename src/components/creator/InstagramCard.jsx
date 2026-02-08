import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, Loader2, Unlink } from 'lucide-react';

/**
 * InstagramCard - Displays Instagram connection status and connect/disconnect controls.
 *
 * Instagram connections are stored in the `social_connections` table (not `users`),
 * so this component fetches from the /api/connections/list endpoint.
 *
 * @param {Object}   props
 * @param {Function} props.onRefresh - Callback to re-fetch parent user data
 */
export default function InstagramCard({ onRefresh }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToast();

  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = !!connection;

  const loadConnection = async () => {
    if (!user) return;

    try {
      const token = await getToken();
      const response = await fetch('/api/connections/list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const { connections } = await response.json();
      const ig = connections?.find((c) => c.platform === 'instagram');
      setConnection(ig || null);
    } catch (err) {
      console.error('Error loading Instagram connection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnection();
  }, [user]);

  // Handle OAuth callback redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('instagram_connected') === 'true') {
      setTimeout(() => loadConnection(), 500);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('instagram_error')) {
      const error = params.get('instagram_error');
      const details = params.get('details');
      toast.error(
        `Instagram connection failed: ${error}${details ? ' — ' + details : ''}`
      );
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  const handleConnect = async () => {
    if (!user) return;
    setIsConnecting(true);

    try {
      const response = await fetch(
        `/api/oauth/instagram/connect?userId=${user.id}`
      );
      const data = await response.json();

      if (data.error) {
        toast.error(`Failed to start Instagram connection: ${data.error}`);
        setIsConnecting(false);
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Error connecting Instagram:', err);
      toast.error('Failed to connect Instagram. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setIsDisconnecting(true);

    try {
      const token = await getToken();
      const response = await fetch(
        '/api/connections/delete?platform=instagram',
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Instagram disconnected');
      setConnection(null);
      onRefresh?.();
    } catch (err) {
      console.error('Error disconnecting Instagram:', err);
      toast.error('Failed to disconnect Instagram. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-tertiary)]" />
          <span className="text-sm text-[var(--color-text-secondary)]">
            Loading Instagram...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Instagram
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Connect to fetch engagement metrics
          </p>
        </div>
        {isConnected ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0" />
        )}
      </div>

      {/* Connected state */}
      {isConnected ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {(connection.platform_username || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                @{connection.platform_username}
              </div>
              {connection.connected_at && (
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  Connected{' '}
                  {new Date(connection.connected_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unlink className="w-4 h-4" />
                Disconnect
              </>
            )}
          </button>
        </>
      ) : (
        /* Not connected state */
        <>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Connect your Instagram Business account to automatically fetch
            engagement metrics when submitting content.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-editorial-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Instagram'
            )}
          </button>
        </>
      )}
    </div>
  );
}
