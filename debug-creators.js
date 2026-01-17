import { supabase } from './src/lib/supabaseClient.js';

async function debugCreators() {
  console.log('Fetching campaigns with posts...');
  
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select(`
      id,
      title,
      posts (
        id,
        creator_id,
        platform,
        impressions
      )
    `)
    .limit(1);

  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError);
    return;
  }

  console.log('Campaign data:', JSON.stringify(campaigns, null, 2));

  console.log('\nFetching creators...');
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('id, name, handle')
    .limit(5);

  if (creatorsError) {
    console.error('Error fetching creators:', creatorsError);
    return;
  }

  console.log('Creators data:', JSON.stringify(creators, null, 2));
}

debugCreators();
