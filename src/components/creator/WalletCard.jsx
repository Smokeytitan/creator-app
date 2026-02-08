import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { Wallet, Loader2, Save } from 'lucide-react';

/**
 * WalletCard - Polygon wallet address management.
 *
 * Loads the current wallet address from the user row and allows saving
 * a new one directly via Supabase.
 *
 * @param {Object}   props
 * @param {Object}   props.userData  - The user row from the `users` table
 * @param {Function} props.onRefresh - Callback to re-fetch user data
 */
export default function WalletCard({ userData, onRefresh }) {
  const { user } = useUser();
  const toast = useToast();

  const [address, setAddress] = useState(userData?.polygon_wallet_address || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync external changes
  useEffect(() => {
    if (userData?.polygon_wallet_address !== undefined) {
      setAddress(userData.polygon_wallet_address || '');
    }
  }, [userData?.polygon_wallet_address]);

  const isDirty = address !== (userData?.polygon_wallet_address || '');

  const isValidAddress = (addr) => {
    if (!addr) return true; // empty is valid (clearing)
    // Basic Ethereum/Polygon address validation
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSave = async () => {
    if (!user) return;

    const trimmed = address.trim();

    if (trimmed && !isValidAddress(trimmed)) {
      toast.error(
        'Invalid wallet address. It should start with 0x followed by 40 hex characters.'
      );
      return;
    }

    setIsSaving(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client is not configured');
      }

      const { error } = await supabase
        .from('users')
        .update({ polygon_wallet_address: trimmed || null })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(
        trimmed ? 'Wallet address saved' : 'Wallet address removed'
      );
      onRefresh?.();
    } catch (err) {
      console.error('Error saving wallet address:', err);
      toast.error('Failed to save wallet address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Polygon Wallet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Used for campaign payouts
          </p>
        </div>
        <Wallet className="w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0" />
      </div>

      {/* Input */}
      <div className="mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="w-full input-polygon px-3 py-2.5 text-sm font-mono"
          spellCheck={false}
          autoComplete="off"
        />
        {address && !isValidAddress(address.trim()) && (
          <p className="text-xs text-red-400 mt-1.5">
            Address should start with 0x followed by 40 hex characters
          </p>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !isDirty}
        className="btn-editorial-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save
          </>
        )}
      </button>
    </div>
  );
}
