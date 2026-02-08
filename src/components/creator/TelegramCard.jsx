import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '../../contexts/ToastContext';
import {
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  Loader2,
  Unlink,
} from 'lucide-react';

const BOT_USERNAME = 'PolygonCampaignsBot';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * TelegramCard - Telegram linking and notification preferences.
 *
 * If not connected, the user can generate a linking code and open the Telegram
 * bot deep-link. Polls the status endpoint until the link is confirmed.
 *
 * If connected, shows the username and a notification toggle.
 *
 * @param {Object}   props
 * @param {Object}   props.userData   - The user row from the `users` table
 * @param {Function} props.onRefresh  - Callback to re-fetch user data
 */
export default function TelegramCard({ userData, onRefresh }) {
  const { user } = useUser();
  const toast = useToast();

  const [isLinking, setIsLinking] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [linkCode, setLinkCode] = useState(null);
  const [notifyOptIn, setNotifyOptIn] = useState(userData?.notify_opt_in ?? true);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const pollIntervalRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const isConnected = !!userData?.telegram_chat_id;

  // Sync notifyOptIn when userData changes externally
  useEffect(() => {
    if (userData?.notify_opt_in !== undefined) {
      setNotifyOptIn(userData.notify_opt_in);
    }
  }, [userData?.notify_opt_in]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // ---------- Polling ----------

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/creator/telegram/status');
        const data = await response.json();

        if (data.success && data.connected) {
          stopPolling();
          setIsWaiting(false);
          setLinkCode(null);
          toast.success('Telegram linked successfully!');
          onRefresh?.();
        }
      } catch (err) {
        console.error('Error polling Telegram status:', err);
      }
    }, POLL_INTERVAL_MS);

    // Auto-stop after timeout
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setIsWaiting(false);
      setLinkCode(null);
      toast.warning('Telegram linking timed out. Please try again.');
    }, POLL_TIMEOUT_MS);
  }, [stopPolling, onRefresh, toast]);

  // ---------- Handlers ----------

  const handleLinkTelegram = async () => {
    setIsLinking(true);

    try {
      const response = await fetch('/api/creator/telegram/generate-code', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success && data.code) {
        setLinkCode(data.code);
        // Open Telegram deep link
        window.open(
          `https://t.me/${BOT_USERNAME}?start=${data.code}`,
          '_blank'
        );
        setIsWaiting(true);
        startPolling();
      } else {
        toast.error('Failed to generate linking code. Please try again.');
      }
    } catch (err) {
      console.error('Error generating Telegram code:', err);
      toast.error('Failed to generate linking code. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleToggleNotifications = async () => {
    setIsUpdatingPrefs(true);

    try {
      const response = await fetch('/api/creator/telegram/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyOptIn: !notifyOptIn }),
      });
      const data = await response.json();

      if (data.success) {
        setNotifyOptIn(data.notifyOptIn);
        toast.success(
          data.notifyOptIn
            ? 'Notifications enabled'
            : 'Notifications disabled'
        );
      } else {
        toast.error('Failed to update notification preferences.');
      }
    } catch (err) {
      console.error('Error updating Telegram preferences:', err);
      toast.error('Failed to update preferences. Please try again.');
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);

    try {
      const response = await fetch('/api/creator/telegram/unlink', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Telegram account unlinked');
        onRefresh?.();
      } else {
        toast.error('Failed to unlink Telegram.');
      }
    } catch (err) {
      console.error('Error unlinking Telegram:', err);
      toast.error('Failed to unlink Telegram. Please try again.');
    } finally {
      setIsUnlinking(false);
    }
  };

  // ---------- Render ----------

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Telegram
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Get notified when campaigns launch
          </p>
        </div>
        {isConnected ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0" />
        )}
      </div>

      {isConnected ? (
        /* Connected state */
        <>
          <div className="mb-4">
            {userData.telegram_username && (
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                @{userData.telegram_username}
              </div>
            )}
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              {notifyOptIn ? 'Notifications enabled' : 'Notifications disabled'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Notification toggle */}
            <button
              onClick={handleToggleNotifications}
              disabled={isUpdatingPrefs}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingPrefs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : notifyOptIn ? (
                <Bell className="w-4 h-4 text-green-500" />
              ) : (
                <BellOff className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              )}
              <span>
                {isUpdatingPrefs
                  ? 'Updating...'
                  : notifyOptIn
                    ? 'Disable Notifications'
                    : 'Enable Notifications'}
              </span>
            </button>

            {/* Unlink button */}
            <button
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUnlinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              {isUnlinking ? 'Unlinking...' : 'Unlink'}
            </button>
          </div>
        </>
      ) : isWaiting ? (
        /* Waiting for bot confirmation */
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent-primary)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Waiting for you to confirm in Telegram...
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Tap &quot;Start&quot; in the Telegram bot to complete linking.
          </p>

          {linkCode && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-3 font-mono">
              Code: {linkCode}
            </p>
          )}

          <button
            onClick={handleLinkTelegram}
            className="mt-3 text-xs text-[var(--color-accent-primary)] hover:underline"
          >
            Re-open Telegram
          </button>
        </div>
      ) : (
        /* Not connected state */
        <>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Link your Telegram account to receive notifications when new
            campaigns launch.
          </p>
          <button
            onClick={handleLinkTelegram}
            disabled={isLinking}
            className="btn-editorial-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening Telegram...
              </>
            ) : (
              'Link Telegram'
            )}
          </button>
        </>
      )}
    </div>
  );
}
