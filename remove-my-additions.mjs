import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt'
);

// The 8 accounts I added that need to be removed
const accountsToRemove = [
  'sandeepnailwal',
  'jdkanani',
  'mihailo_bjelic',
  'jayantkrish',
  '0xpolygon',
  'polygonlabsdev',
  'polygondevs',
  'polygonlabs'
];

console.log('Removing the 8 accounts I added without permission...\n');

for (const handle of accountsToRemove) {
  const { error } = await supabase
    .from('excluded_accounts')
    .delete()
    .eq('handle', handle);

  if (error) {
    console.error(`❌ Failed to remove @${handle}:`, error.message);
  } else {
    console.log(`✓ Removed: @${handle}`);
  }
}

console.log('\n✓ Done! Your original 19 accounts remain.');
