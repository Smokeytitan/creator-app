import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabaseClient';
import CampaignCard from './CampaignCard';
import ConnectXBanner from './ConnectXBanner';
import { Inbox } from 'lucide-react';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

/**
 * CampaignFeed - Creator's homepage showing campaigns assigned to them.
 *
 * Flow:
 *   1. useUser() -> userId
 *   2. users table -> creator_id
 *   3. campaign_creators where creator_id matches -> campaign ids
 *   4. campaigns table -> full campaign rows
 *
 * Shows ConnectXBanner if user hasn't connected their X account.
 */
export default function CampaignFeed() {
  const { user, isLoaded: isUserLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [creatorId, setCreatorId] = useState(null);
  const [hasXConnected, setHasXConnected] = useState(true); // default true to avoid flash
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!isUserLoaded || !user) return;

    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client is not configured');
        }

        // Step 1: Get user row to find creator_id and x_handle
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('creator_id, x_handle')
          .eq('id', user.id)
          .single();

        if (userError) {
          // User might not exist yet in our DB
          if (userError.code === 'PGRST116') {
            setCreatorId(null);
            setHasXConnected(false);
            setCampaigns([]);
            return;
          }
          throw userError;
        }

        setHasXConnected(!!userRow?.x_handle);

        if (!userRow?.creator_id) {
          setCreatorId(null);
          setCampaigns([]);
          return;
        }

        setCreatorId(userRow.creator_id);

        // Step 2: Find campaign IDs assigned to this creator
        const { data: assignments, error: assignError } = await supabase
          .from('campaign_creators')
          .select('campaign_id')
          .eq('creator_id', userRow.creator_id);

        if (assignError) throw assignError;

        if (!assignments || assignments.length === 0) {
          setCampaigns([]);
          return;
        }

        const campaignIds = assignments.map((a) => a.campaign_id);

        // Step 3: Fetch campaign details
        const { data: campaignRows, error: campaignError } = await supabase
          .from('campaigns')
          .select('*')
          .in('id', campaignIds)
          .order('created_at', { ascending: false });

        if (campaignError) throw campaignError;

        setCampaigns(campaignRows || []);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, isUserLoaded]);

  // Filter campaigns by tab
  const filteredCampaigns = useMemo(() => {
    if (activeFilter === 'all') return campaigns;

    if (activeFilter === 'active') {
      return campaigns.filter(
        (c) => c.status === 'pending' || c.status === 'in-progress'
      );
    }

    if (activeFilter === 'completed') {
      return campaigns.filter(
        (c) => c.status === 'completed' || c.status === 'cancelled'
      );
    }

    return campaigns;
  }, [campaigns, activeFilter]);

  // Loading state
  if (!isUserLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent" />
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium">
            Loading campaigns...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <p className="text-red-400 font-medium mb-2">
            Something went wrong
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  // No creator_id linked
  if (!creatorId) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        {!hasXConnected && <ConnectXBanner />}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-10">
          <Inbox className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            No campaigns assigned yet
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            You haven&apos;t been assigned to any campaigns. Once a campaign manager adds you
            to a campaign, it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* X connection banner */}
      {!hasXConnected && <ConnectXBanner />}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">
          Your Campaigns
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Campaigns you&apos;ve been assigned to
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[var(--color-bg-tertiary)] p-1 rounded-lg w-fit mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              activeFilter === tab.key
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaign grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-10 text-center">
          <Inbox className="w-10 h-10 text-[var(--color-text-tertiary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            {activeFilter === 'all'
              ? 'No campaigns yet'
              : `No ${activeFilter} campaigns`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
