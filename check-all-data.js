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

async function checkAllData() {
  const { data: campaigns } = await supabase.from('campaigns').select('*');
  const { data: creators } = await supabase.from('creators').select('*');
  
  console.log('\n=== CAMPAIGNS TABLE ===');
  console.log('Columns:', Object.keys(campaigns[0] || {}));
  
  console.log('\n=== CREATORS TABLE ===');
  console.log('Columns:', Object.keys(creators[0] || {}));
  
  // Check for a posts table
  const { data: posts, error: postsError } = await supabase.from('posts').select('*').limit(1);
  if (!postsError && posts) {
    console.log('\n=== POSTS TABLE ===');
    console.log('Columns:', Object.keys(posts[0] || {}));
    console.log('Sample:', JSON.stringify(posts[0], null, 2));
  } else {
    console.log('\n=== POSTS TABLE ===');
    console.log('No posts table found or no posts exist');
  }
  
  // Check for campaign_creators junction table
  const { data: junction, error: junctionError } = await supabase.from('campaign_creators').select('*').limit(1);
  if (!junctionError && junction) {
    console.log('\n=== CAMPAIGN_CREATORS TABLE ===');
    console.log('Columns:', Object.keys(junction[0] || {}));
  } else {
    console.log('\n=== CAMPAIGN_CREATORS TABLE ===');
    console.log('No campaign_creators junction table found');
  }
  
  console.log('\n=== CHECKING FOR JSONB FIELDS ===');
  const polygonCampaign = campaigns.find(c => c.title === 'Polygon Open Money Stack');
  if (polygonCampaign) {
    console.log('Polygon Open Money Stack campaign:');
    console.log(JSON.stringify(polygonCampaign, null, 2));
  }
  
  const picolasCage = creators.find(c => c.name === 'Picolas Cage');
  if (picolasCage) {
    console.log('\nPicolas Cage creator:');
    console.log(JSON.stringify(picolasCage, null, 2));
  }
}

checkAllData();
