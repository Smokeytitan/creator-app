#!/usr/bin/env node

/**
 * Quick Migration Script
 * Run this to migrate localStorage campaigns to Supabase
 *
 * Usage:
 * 1. Open your app in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 */

console.log('=== Campaign Migration Script ===\n');

// Instructions for browser console
const browserInstructions = `
// COPY AND PASTE THIS INTO BROWSER CONSOLE:

(async () => {
  // Get localStorage data
  const requestsJson = localStorage.getItem('requests');

  if (!requestsJson) {
    console.log('No campaigns found in localStorage');
    return;
  }

  const campaigns = JSON.parse(requestsJson);
  console.log(\`Found \${campaigns.length} campaigns in localStorage\`);

  // Import Supabase client
  const { supabase } = await import('./src/lib/supabaseClient.js');

  if (!supabase) {
    console.error('Supabase not configured!');
    return;
  }

  // Migrate each campaign
  let migrated = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    try {
      // Insert campaign
      const { data: campaignData, error: campaignError } = await supabase
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
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Insert creator associations
      if (campaign.creators && campaign.creators.length > 0) {
        const associations = campaign.creators.map(creator => ({
          campaign_id: campaign.id,
          creator_id: typeof creator === 'object' ? creator.id : creator
        }));

        // Delete existing associations first
        await supabase
          .from('campaign_creators')
          .delete()
          .eq('campaign_id', campaign.id);

        // Insert new associations
        const { error: assocError } = await supabase
          .from('campaign_creators')
          .insert(associations);

        if (assocError) throw assocError;
      }

      migrated++;
      console.log(\`✓ Migrated: \${campaign.title}\`);
    } catch (error) {
      failed++;
      console.error(\`✗ Failed to migrate "\${campaign.title}":", error.message\`);
    }
  }

  console.log(\`\\n=== Migration Complete ===\`);
  console.log(\`Total: \${campaigns.length}\`);
  console.log(\`Migrated: \${migrated}\`);
  console.log(\`Failed: \${failed}\`);
  console.log('\\nRefresh the page to see your campaigns!');
})();
`;

console.log('BROWSER CONSOLE INSTRUCTIONS:');
console.log('==============================\n');
console.log('1. Open your app in the browser (http://localhost:5176)');
console.log('2. Press F12 to open Developer Tools');
console.log('3. Click on the "Console" tab');
console.log('4. Copy and paste the code below into the console');
console.log('5. Press Enter to run\n');
console.log('--- START COPYING FROM HERE ---\n');
console.log(browserInstructions);
console.log('\n--- END COPYING HERE ---\n');
