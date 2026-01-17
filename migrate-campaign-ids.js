// Migration script to add campaign_id to existing posts in Supabase
// This will link posts to campaigns based on creator membership

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCampaignIds() {
  console.log('🚀 Starting campaign_id migration...\n');

  try {
    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) throw campaignsError;

    console.log(`📋 Found ${campaigns.length} campaigns\n`);

    // Get all creators with their posts
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('*');

    if (creatorsError) throw creatorsError;

    console.log(`👥 Found ${creators.length} creators\n`);

    let totalUpdated = 0;
    let totalCreatorsUpdated = 0;

    // For each campaign
    for (const campaign of campaigns) {
      console.log(`\n📦 Processing: ${campaign.title}`);
      console.log(`   Campaign ID: ${campaign.id}`);

      const campaignCreatorIds = (campaign.creators || []).map(c => c.id);
      console.log(`   Creators in campaign: ${campaignCreatorIds.length}`);

      // Find creators in this campaign
      for (const creator of creators) {
        if (!campaignCreatorIds.includes(creator.id)) continue;

        const posts = creator.posts || [];
        if (posts.length === 0) continue;

        let creatorUpdated = false;
        let postsUpdatedCount = 0;

        // Update posts that don't have campaign_id
        const updatedPosts = posts.map(post => {
          // If post doesn't have campaign_id, add it
          if (!post.campaign_id) {
            postsUpdatedCount++;
            creatorUpdated = true;
            return {
              ...post,
              campaign_id: campaign.id
            };
          }
          return post;
        });

        // Update creator if any posts were modified
        if (creatorUpdated) {
          console.log(`   ✏️  Updating ${creator.name}: ${postsUpdatedCount} posts`);

          const { error: updateError } = await supabase
            .from('creators')
            .update({ posts: updatedPosts })
            .eq('id', creator.id);

          if (updateError) {
            console.error(`   ❌ Error updating creator ${creator.name}:`, updateError);
          } else {
            totalUpdated += postsUpdatedCount;
            totalCreatorsUpdated++;
            console.log(`   ✅ Updated successfully`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration complete!');
    console.log(`   Creators updated: ${totalCreatorsUpdated}`);
    console.log(`   Posts updated: ${totalUpdated}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCampaignIds();
