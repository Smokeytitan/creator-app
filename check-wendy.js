import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibqqffnwawkualsynlrt.supabase.co';
const supabaseKey = 'sb_secret_qHI59hCuPxlRly4NIpKdqg_0naFprUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWendy() {
  console.log('Checking Wendy O data...\n');

  const { data: creators, error } = await supabase
    .from('creators')
    .select(`
      id,
      name,
      cost_per_post,
      posts (*)
    `)
    .ilike('name', '%wendy%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (creators && creators.length > 0) {
    creators.forEach(creator => {
      console.log(`Creator: ${creator.name}`);
      console.log(`ID: ${creator.id}`);
      console.log(`Cost per post: ${creator.cost_per_post}`);
      console.log(`Number of posts: ${creator.posts?.length || 0}\n`);

      if (creator.posts && creator.posts.length > 0) {
        console.log('Posts:');
        creator.posts.forEach((post, idx) => {
          console.log(`\nPost ${idx + 1}:`);
          console.log(`  ID: ${post.id}`);
          console.log(`  Campaign ID: ${post.campaign_id}`);
          console.log(`  Description: ${post.description}`);
          console.log(`  Impressions: ${post.impressions}`);
          console.log(`  Cost: ${post.cost}`);
        });
      }
    });
  } else {
    console.log('No creator found matching "wendy"');
  }
}

checkWendy().catch(console.error);
