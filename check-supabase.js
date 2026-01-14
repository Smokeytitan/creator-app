import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibqqffnwawkualsynlrt.supabase.co';
const supabaseKey = 'sb_secret_qHI59hCuPxlRly4NIpKdqg_0naFprUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking Supabase connection...\n');

  // Check creators table
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('*')
    .limit(1);

  console.log('Creators table:', creatorsError ? `❌ ${creatorsError.message}` : '✅ Exists');

  // Check posts table
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .limit(1);

  console.log('Posts table:', postsError ? `❌ ${postsError.message}` : '✅ Exists');

  // Check campaigns table
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*')
    .limit(1);

  console.log('Campaigns table:', campaignsError ? `❌ ${campaignsError.message}` : '✅ Exists');

  console.log('\nConnection successful!');
}

checkTables().catch(console.error);
