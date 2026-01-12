/**
 * Migration Utility: localStorage → Supabase
 * Run this once to migrate existing campaigns and exclusions to Supabase
 */

import { supabase } from '../lib/supabaseClient';

export const migrateLocalStorageToSupabase = async () => {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log('Starting migration from localStorage to Supabase...');

    // Migrate campaigns
    const campaignsJson = localStorage.getItem('flashCampaigns');
    if (campaignsJson) {
      const campaigns = JSON.parse(campaignsJson);
      console.log(`Found ${campaigns.length} campaigns to migrate`);

      for (const campaign of campaigns) {
        const { error } = await supabase
          .from('flash_campaigns')
          .upsert({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            start_date_time: campaign.startDateTime,
            end_date_time: campaign.endDateTime,
            key_phrases: campaign.keyPhrases,
            reward_pool: campaign.rewardPool,
            status: campaign.status,
            created_at: campaign.createdAt,
            results: campaign.results ? JSON.stringify(campaign.results) : null
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error(`Error migrating campaign ${campaign.id}:`, error);
        } else {
          console.log(`✓ Migrated campaign: ${campaign.name}`);
        }
      }
    }

    // Migrate excluded accounts
    const excludedJson = localStorage.getItem('excludedAccounts');
    if (excludedJson) {
      const excluded = JSON.parse(excludedJson);
      console.log(`Found ${excluded.length} excluded accounts to migrate`);

      for (const account of excluded) {
        const { error } = await supabase
          .from('excluded_accounts')
          .upsert({
            id: account.id,
            handle: account.handle,
            reason: account.reason,
            added_at: account.addedAt
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error(`Error migrating excluded account ${account.handle}:`, error);
        } else {
          console.log(`✓ Migrated excluded account: ${account.handle}`);
        }
      }
    }

    console.log('Migration completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

export const clearLocalStorageAfterMigration = () => {
  if (confirm('Migration successful! Clear localStorage data? (Campaigns will now be stored in Supabase)')) {
    localStorage.removeItem('flashCampaigns');
    localStorage.removeItem('excludedAccounts');
    console.log('localStorage cleared. Using Supabase from now on.');
  }
};
