import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkPostsCampaigns() {
  // Get all posts
  const { data: posts } = await supabase.from('posts').select('*');
  console.log(`\n=== TOTAL POSTS: ${posts.length} ===\n`);
  
  // Get all campaigns
  const { data: campaigns } = await supabase.from('campaigns').select('*');
  
  // Get campaign_creators junction
  const { data: campaignCreators } = await supabase.from('campaign_creators').select('*');
  console.log(`=== CAMPAIGN_CREATORS LINKS: ${campaignCreators.length} ===\n`);
  
  // Check which campaigns have posts
  console.log('=== POSTS BY CAMPAIGN ===');
  for (const campaign of campaigns) {
    const campaignPosts = posts.filter(p => p.campaign_id === campaign.id);
    const creators = campaignCreators.filter(cc => cc.campaign_id === campaign.id);
    console.log(`\n${campaign.title} (ID: ${campaign.id})`);
    console.log(`  Status: ${campaign.status}`);
    console.log(`  Creators linked: ${creators.length}`);
    console.log(`  Posts: ${campaignPosts.length}`);
    if (campaignPosts.length > 0) {
      console.log(`  Sample post link: ${campaignPosts[0].link}`);
    }
  }
  
  // Check for orphaned posts (posts without valid campaign_id)
  const campaignIds = campaigns.map(c => c.id);
  const orphanedPosts = posts.filter(p => !campaignIds.includes(p.campaign_id));
  if (orphanedPosts.length > 0) {
    console.log(`\n=== ORPHANED POSTS (${orphanedPosts.length}) ===`);
    orphanedPosts.forEach(p => {
      console.log(`  Post: ${p.link} -> Campaign ID: ${p.campaign_id} (DOES NOT EXIST)`);
    });
  }
  
  // Check Polygon Open Money Stack specifically
  console.log('\n=== POLYGON OPEN MONEY STACK DETAILS ===');
  const polygonCampaign = campaigns.find(c => c.title === 'Polygon Open Money Stack');
  const polygonCreators = campaignCreators.filter(cc => cc.campaign_id === polygonCampaign.id);
  const polygonPosts = posts.filter(p => p.campaign_id === polygonCampaign.id);
  console.log(`Campaign ID: ${polygonCampaign.id}`);
  console.log(`Creators in campaign_creators table: ${polygonCreators.length}`);
  console.log(`Posts linked to this campaign: ${polygonPosts.length}`);
  
  if (polygonCreators.length > 0) {
    console.log('\nCreators:');
    for (const cc of polygonCreators) {
      const { data: creator } = await supabase.from('creators').select('*').eq('id', cc.creator_id).single();
      console.log(`  - ${creator.name} (${creator.handle})`);
    }
  }
}

checkPostsCampaigns();
