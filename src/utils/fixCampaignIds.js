// Utility to add campaign_id to existing posts
// Run this once to fix posts that were created before campaign_id was added

import { supabase } from '../lib/supabaseClient';

export async function fixCampaignIds() {
  try {
    console.log('Starting campaign_id fix...');

    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) throw campaignsError;

    console.log(`Found ${campaigns.length} campaigns`);

    // Get all creators with their posts
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('*');

    if (creatorsError) throw creatorsError;

    console.log(`Found ${creators.length} creators`);

    let updatedCount = 0;

    // For each campaign
    for (const campaign of campaigns) {
      console.log(`\nProcessing campaign: ${campaign.title} (ID: ${campaign.id})`);
      const campaignCreatorIds = (campaign.creators || []).map(c => c.id);

      // Find creators in this campaign
      for (const creator of creators) {
        if (!campaignCreatorIds.includes(creator.id)) continue;

        const posts = creator.posts || [];
        let creatorUpdated = false;

        // Update posts that don't have campaign_id
        const updatedPosts = posts.map(post => {
          // If post doesn't have campaign_id and was likely created for this campaign
          // (you can add more logic here to match posts to campaigns)
          if (!post.campaign_id) {
            console.log(`  - Adding campaign_id to post: ${post.description || post.link}`);
            updatedCount++;
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
          const { error: updateError } = await supabase
            .from('creators')
            .update({ posts: updatedPosts })
            .eq('id', creator.id);

          if (updateError) {
            console.error(`Error updating creator ${creator.name}:`, updateError);
          } else {
            console.log(`  ✓ Updated creator: ${creator.name}`);
          }
        }
      }
    }

    console.log(`\n✅ Fix complete! Updated ${updatedCount} posts`);
    return { success: true, updatedCount };

  } catch (error) {
    console.error('Error fixing campaign IDs:', error);
    return { success: false, error };
  }
}

// WARNING: This function adds campaign_id to ALL posts that don't have one
// Be careful as it will associate posts with campaigns based on creator membership
// You may want to review and customize the logic above before running
