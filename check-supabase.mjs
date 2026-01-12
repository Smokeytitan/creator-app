import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt'
);

console.log('Checking excluded_accounts table...\n');

const { data: exclusions, error: exclusionsError } = await supabase
  .from('excluded_accounts')
  .select('*');

if (exclusionsError) {
  console.error('Error fetching exclusions:', exclusionsError);
} else {
  console.log(`Found ${exclusions ? exclusions.length : 0} excluded accounts:`);
  console.log(JSON.stringify(exclusions, null, 2));
}

console.log('\n\nChecking flash_campaigns table...\n');

const { data: campaigns, error: campaignsError } = await supabase
  .from('flash_campaigns')
  .select('*');

if (campaignsError) {
  console.error('Error fetching campaigns:', campaignsError);
} else {
  console.log(`Found ${campaigns ? campaigns.length : 0} campaigns:`);
  console.log(JSON.stringify(campaigns, null, 2));
}
