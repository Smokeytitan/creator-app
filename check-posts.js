import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibqqffnwawkualsynlrt.supabase.co';
const supabaseKey = 'sb_secret_qHI59hCuPxlRly4NIpKdqg_0naFprUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPosts() {
  console.log('Checking all posts for Wendy O (creator_id: 1768288976554)...\n');

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('creator_id', 1768288976554)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total posts found: ${posts?.length || 0}\n`);

  if (posts && posts.length > 0) {
    posts.forEach((post, idx) => {
      console.log(`Post ${idx + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Creator ID: ${post.creator_id}`);
      console.log(`  Campaign ID: ${post.campaign_id}`);
      console.log(`  Description: ${post.description}`);
      console.log(`  Platform: ${post.platform}`);
      console.log(`  Impressions: ${post.impressions}`);
      console.log(`  Cost: ${post.cost}`);
      console.log(`  Date: ${post.date}`);
      console.log('---');
    });
  } else {
    console.log('No posts found for this creator');
  }
}

checkPosts().catch(console.error);
