/**
 * Migration Utility: localStorage → Supabase
 * Run this once to migrate ALL existing data to Supabase:
 * - Creators (roster)
 * - Content Requests (campaigns)
 * - Posts (tweets/content)
 * - Flash Campaigns
 * - Excluded Accounts
 */

import { supabase } from '../lib/supabaseClient';
import { extractTweetId } from '../services/twitterService';

export const migrateLocalStorageToSupabase = async () => {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Supabase not configured' };
  }

  const results = {
    creators: { total: 0, migrated: 0, failed: 0 },
    posts: { total: 0, migrated: 0, failed: 0 },
    requests: { total: 0, migrated: 0, failed: 0 },
    flashCampaigns: { total: 0, migrated: 0, failed: 0 },
    excludedAccounts: { total: 0, migrated: 0, failed: 0 },
    errors: []
  };

  try {
    console.log('[Migration] Starting localStorage → Supabase migration...');

    // ========================================================================
    // STEP 1: Migrate Creators
    // ========================================================================
    console.log('[Migration] Step 1: Migrating creators...');
    const creatorsJson = localStorage.getItem('creators');
    if (creatorsJson) {
      const creators = JSON.parse(creatorsJson);
      results.creators.total = creators.length;
      console.log(`[Migration] Found ${creators.length} creators to migrate`);

      for (const creator of creators) {
        try {
          const { error } = await supabase
            .from('creators')
            .upsert({
              id: creator.id,
              name: creator.name,
              handle: creator.handle,
              notes: creator.notes || '',
              cost_per_post: creator.costPerPost || '',
              platforms: creator.platforms || [],
              active: creator.active !== false
            }, {
              onConflict: 'id'
            });

          if (error) throw error;
          results.creators.migrated++;
          console.log(`[Migration] ✓ Migrated creator: ${creator.name}`);
        } catch (error) {
          results.creators.failed++;
          results.errors.push({
            type: 'creator',
            id: creator.id,
            name: creator.name,
            error: error.message
          });
          console.error(`[Migration] ✗ Failed to migrate creator ${creator.name}:`, error);
        }
      }

      // ========================================================================
      // STEP 2: Migrate Posts (after creators exist)
      // ========================================================================
      console.log('[Migration] Step 2: Migrating posts...');
      for (const creator of creators) {
        if (creator.posts && creator.posts.length > 0) {
          results.posts.total += creator.posts.length;

          for (const post of creator.posts) {
            try {
              const tweetId = post.platform === 'X' && post.link
                ? extractTweetId(post.link)
                : null;

              const { error } = await supabase
                .from('posts')
                .upsert({
                  id: post.id,
                  creator_id: creator.id,
                  request_id: null, // Link manually later if needed
                  description: post.description || '',
                  platform: post.platform || 'X',
                  date: post.date || null,
                  cost: post.cost || '',
                  link: post.link || '',
                  impressions: post.impressions || '',
                  likes: post.likes || '',
                  comments: post.comments || '',
                  retweets: post.retweets || '',
                  quotes: post.quotes || '',
                  bookmarks: post.bookmarks || '',
                  tweet_id: tweetId,
                  last_scanned: post.lastScanned || null,
                  needs_rescan: false
                }, {
                  onConflict: 'id'
                });

              if (error) throw error;
              results.posts.migrated++;
            } catch (error) {
              results.posts.failed++;
              results.errors.push({
                type: 'post',
                creatorId: creator.id,
                creatorName: creator.name,
                postId: post.id,
                error: error.message
              });
            }
          }
        }
      }
      console.log(`[Migration] ✓ Migrated ${results.posts.migrated}/${results.posts.total} posts`);
    } else {
      console.log('[Migration] No creators found in localStorage');
    }

    // ========================================================================
    // STEP 3: Migrate Campaigns (content requests)
    // ========================================================================
    console.log('[Migration] Step 3: Migrating campaigns...');
    const requestsJson = localStorage.getItem('requests');
    if (requestsJson) {
      const campaigns = JSON.parse(requestsJson);
      results.requests.total = campaigns.length;
      console.log(`[Migration] Found ${campaigns.length} campaigns to migrate`);

      for (const campaign of campaigns) {
        try {
          // Insert campaign
          const { error: campaignError } = await supabase
            .from('campaigns')
            .upsert({
              id: campaign.id,
              title: campaign.title,
              description: campaign.description || '',
              status: campaign.status || 'pending',
              estimated_cost: campaign.estimatedCost || 0,
              estimated_impressions: campaign.estimatedImpressions || 0,
              created_at: campaign.createdAt || new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (campaignError) throw campaignError;

          // Insert creator associations
          if (campaign.creators && campaign.creators.length > 0) {
            for (const creatorId of campaign.creators) {
              await supabase
                .from('campaign_creators')
                .upsert({
                  campaign_id: campaign.id,
                  creator_id: creatorId
                }, {
                  onConflict: 'campaign_id,creator_id'
                });
            }
          }

          results.requests.migrated++;
          console.log(`[Migration] ✓ Migrated campaign: ${campaign.title}`);
        } catch (error) {
          results.requests.failed++;
          results.errors.push({
            type: 'campaign',
            id: campaign.id,
            title: campaign.title,
            error: error.message
          });
          console.error(`[Migration] ✗ Failed to migrate campaign ${campaign.title}:`, error);
        }
      }
    } else {
      console.log('[Migration] No campaigns found in localStorage');
    }

    // ========================================================================
    // STEP 4: Migrate Flash Campaigns
    // ========================================================================
    console.log('[Migration] Step 4: Migrating flash campaigns...');
    const campaignsJson = localStorage.getItem('flashCampaigns');
    if (campaignsJson) {
      const campaigns = JSON.parse(campaignsJson);
      results.flashCampaigns.total = campaigns.length;
      console.log(`[Migration] Found ${campaigns.length} flash campaigns to migrate`);

      for (const campaign of campaigns) {
        try {
          const { error } = await supabase
            .from('flash_campaigns')
            .upsert({
              id: campaign.id,
              name: campaign.name,
              description: campaign.description || '',
              start_date_time: campaign.startDateTime,
              end_date_time: campaign.endDateTime,
              key_phrases: campaign.keyPhrases,
              reward_pool: campaign.rewardPool || '',
              status: campaign.status,
              created_at: campaign.createdAt,
              results: campaign.results ? JSON.stringify(campaign.results) : null
            }, {
              onConflict: 'id'
            });

          if (error) throw error;
          results.flashCampaigns.migrated++;
          console.log(`[Migration] ✓ Migrated flash campaign: ${campaign.name}`);
        } catch (error) {
          results.flashCampaigns.failed++;
          results.errors.push({
            type: 'flashCampaign',
            id: campaign.id,
            name: campaign.name,
            error: error.message
          });
          console.error(`[Migration] ✗ Failed to migrate campaign ${campaign.name}:`, error);
        }
      }
    } else {
      console.log('[Migration] No flash campaigns found in localStorage');
    }

    // ========================================================================
    // STEP 5: Migrate Excluded Accounts
    // ========================================================================
    console.log('[Migration] Step 5: Migrating excluded accounts...');
    const excludedJson = localStorage.getItem('excludedAccounts');
    if (excludedJson) {
      const excluded = JSON.parse(excludedJson);
      results.excludedAccounts.total = excluded.length;
      console.log(`[Migration] Found ${excluded.length} excluded accounts to migrate`);

      for (const account of excluded) {
        try {
          const { error } = await supabase
            .from('excluded_accounts')
            .upsert({
              id: account.id,
              handle: account.handle,
              reason: account.reason || '',
              added_at: account.addedAt
            }, {
              onConflict: 'id'
            });

          if (error) throw error;
          results.excludedAccounts.migrated++;
          console.log(`[Migration] ✓ Migrated excluded account: ${account.handle}`);
        } catch (error) {
          results.excludedAccounts.failed++;
          results.errors.push({
            type: 'excludedAccount',
            id: account.id,
            handle: account.handle,
            error: error.message
          });
          console.error(`[Migration] ✗ Failed to migrate excluded account ${account.handle}:`, error);
        }
      }
    } else {
      console.log('[Migration] No excluded accounts found in localStorage');
    }

    // ========================================================================
    // Migration Summary
    // ========================================================================
    console.log('[Migration] ✓ Migration complete!');
    console.log('[Migration] Summary:', {
      creators: `${results.creators.migrated}/${results.creators.total} migrated`,
      posts: `${results.posts.migrated}/${results.posts.total} migrated`,
      requests: `${results.requests.migrated}/${results.requests.total} migrated`,
      flashCampaigns: `${results.flashCampaigns.migrated}/${results.flashCampaigns.total} migrated`,
      excludedAccounts: `${results.excludedAccounts.migrated}/${results.excludedAccounts.total} migrated`,
      errors: results.errors.length
    });

    return { success: true, results };

  } catch (error) {
    console.error('[Migration] Fatal error:', error);
    results.errors.push({
      type: 'fatal',
      error: error.message
    });
    return { success: false, error: error.message, results };
  }
};

/**
 * Backup localStorage data to JSON file before migration
 * @returns {string} JSON string of all localStorage data
 */
export const backupLocalStorage = () => {
  const backup = {
    creators: JSON.parse(localStorage.getItem('creators') || '[]'),
    requests: JSON.parse(localStorage.getItem('requests') || '[]'),
    flashCampaigns: JSON.parse(localStorage.getItem('flashCampaigns') || '[]'),
    excludedAccounts: JSON.parse(localStorage.getItem('excludedAccounts') || '[]'),
    activeTab: localStorage.getItem('activeTab'),
    timestamp: new Date().toISOString()
  };

  const json = JSON.stringify(backup, null, 2);

  // Download as file
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);

  console.log('[Backup] localStorage backed up successfully');
  return json;
};

/**
 * Clear localStorage after successful migration
 * CAUTION: Only call after verifying migration succeeded
 */
export const clearLocalStorageAfterMigration = () => {
  const confirm = window.confirm(
    '⚠️ WARNING: This will permanently delete all data from localStorage.\n\n' +
    'Make sure you have:\n' +
    '1. Successfully migrated to Supabase\n' +
    '2. Verified all data is correct in Supabase\n' +
    '3. Downloaded a backup file\n\n' +
    'Continue with deletion?'
  );

  if (confirm) {
    localStorage.removeItem('creators');
    localStorage.removeItem('requests');
    localStorage.removeItem('flashCampaigns');
    localStorage.removeItem('excludedAccounts');
    console.log('[Migration] ✓ localStorage cleared. App will now use Supabase.');
    alert('localStorage cleared successfully. App will now use Supabase for all data.');
    window.location.reload();
  }
};
