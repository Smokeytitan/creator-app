import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, Loader2, Unlink } from 'lucide-react';

/**
 * XAccountCard - Displays X (Twitter) connection status and connect/disconnect controls.
 *
 * @param {Object}  props
 * @param {Object}  props.userData      - The user row from the `users` table
 * @param {Function} props.onRefresh    - Callback to re-fetch user data after changes
 */
export default function XAccountCard({ userData, onRefresh }) {
  const { user } = useUser();
  const toast = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = !!userData?.x_handle;

  const handleConnect = async () => {
    if (!user) return;
    setIsConnecting(true);

    try {
      const response = await fetch(
        `/api/oauth/twitter/connect?userId=${user.id}`
      );
      const data = await response.json();

      if (data.error) {
        toast.error(`Failed to start X connection: ${data.error}`);
        setIsConnecting(false);
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error('Error connecting X:', err);
      toast.error('Failed to connect X account. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setIsDisconnecting(true);

    try {
      const response = await fetch(
        `/api/connections/delete?platform=twitter&userId=${user.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('X account disconnected');
      onRefresh?.();
    } catch (err) {
      console.error('Error disconnecting X:', err);
      toast.error('Failed to disconnect X account. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            X (Twitter)
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Required for campaign participation
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
            {userData.x_avatar_url ? (
              <img
                src={userData.x_avatar_url}
                alt={userData.x_name || userData.x_handle}
                className="w-10 h-10 rounded-full object-cover border border-[var(--color-border)]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
                {(userData.x_handle || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              {userData.x_name && (
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {userData.x_name}
                </div>
              )}
              <div className="text-sm text-[var(--color-text-secondary)]">
                @{userData.x_handle}
              </div>
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
            Connect your X account so you can be assigned to campaigns and
            submit content.
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
              'Connect X Account'
            )}
          </button>
        </>
      )}
    </div>
  );
}
