import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle, XCircle, Search, UserCheck, Link2 } from 'lucide-react';

/**
 * UserManagement — Admin page for approving users and linking them to creator records.
 *
 * Reads from the `users` table and the `creators` table (for linking).
 * Approval sets `users.approved = true` and optionally links `users.creator_id`.
 */
export default function UserManagement() {
  const { getToken } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [creators, setCreators] = useState([]); // un-linked creators
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state for linking a creator
  const [linkingUser, setLinkingUser] = useState(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase not configured');

      // Fetch users and unlinked creators in parallel
      const [usersRes, creatorsRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, email, full_name, role, approved, approved_at, creator_id, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('creators')
          .select('id, name, handle')
          .is('user_id', null) // Only unlinked creators (user_id column on creators)
          .order('name'),
      ]);

      if (usersRes.error) throw usersRes.error;
      // creators table might not have user_id column yet — fallback to all creators
      if (creatorsRes.error) {
        console.warn('Could not filter unlinked creators, fetching all:', creatorsRes.error.message);
        const fallback = await supabase.from('creators').select('id, name, handle').order('name');
        setCreators(fallback.data || []);
      } else {
        setCreators(creatorsRes.data || []);
      }

      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, creatorId) => {
    setApproving(true);
    try {
      const token = await getToken();

      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, creatorId: creatorId || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed');
      }

      toast.success('User approved');
      setLinkingUser(null);
      setSelectedCreatorId('');
      await loadData();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(err.message);
    } finally {
      setApproving(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">User Management</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {users.length} users &middot; {users.filter((u) => u.approved).length} approved
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Creator Link</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Signed Up</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {user.full_name || 'No name'}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                      {user.role || 'creator'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.approved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <XCircle className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.creator_id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-accent-primary)]">
                        <Link2 className="h-3 w-3" />
                        #{user.creator_id}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-tertiary)]">Not linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!user.approved ? (
                      <button
                        onClick={() => {
                          setLinkingUser(user);
                          setSelectedCreatorId('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Approve
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve + Link Creator Dialog */}
      {linkingUser && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setLinkingUser(null)}>
          <div
            className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
              Approve User
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              <strong>{linkingUser.full_name || linkingUser.email}</strong>
            </p>

            {/* Quick approve without linking */}
            <button
              onClick={() => handleApprove(linkingUser.id, null)}
              disabled={approving}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors mb-4"
            >
              {approving ? 'Approving...' : 'Approve'}
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[var(--color-bg-primary)] text-xs text-[var(--color-text-tertiary)]">
                  or link to an existing creator record
                </span>
              </div>
            </div>

            <select
              value={selectedCreatorId}
              onChange={(e) => setSelectedCreatorId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] mb-3"
            >
              <option value="">Select a creator...</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (@{c.handle})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLinkingUser(null)}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]/80"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(linkingUser.id, selectedCreatorId || null)}
                disabled={approving || !selectedCreatorId}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
              >
                {approving ? 'Approving...' : 'Approve & Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
