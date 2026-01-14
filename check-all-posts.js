import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibqqffnwawkualsynlrt.supabase.co';
const supabaseKey = 'sb_secret_qHI59hCuPxlRly4NIpKdqg_0naFprUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllPosts() {
  console.log('Checking ALL posts in database...\n');

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('id', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total posts (last 20): ${posts?.length || 0}\n`);

  if (posts && posts.length > 0) {
    posts.forEach((post, idx) => {
      console.log(`Post ${idx + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Creator ID: ${post.creator_id}`);
      console.log(`  Campaign ID: ${post.campaign_id}`);
      console.log(`  Description: ${post.description}`);
      console.log(`  Platform: ${post.platform}`);
      console.log(`  Date: ${post.date}`);
      console.log('---');
    });
  } else {
    console.log('No posts found in database');
  }
}

checkAllPosts().catch(console.error);
