import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt'
);

// Default exclusions - Polygon team members and official accounts
const defaultExclusions = [
  { handle: 'sandeepnailwal', reason: 'Polygon Co-Founder' },
  { handle: 'jdkanani', reason: 'Polygon Co-Founder' },
  { handle: 'mihailo_bjelic', reason: 'Polygon Co-Founder' },
  { handle: 'jayantkrish', reason: 'Polygon Co-founder' },
  { handle: '0xPolygon', reason: 'Official Polygon account' },
  { handle: 'PolygonLabsDev', reason: 'Polygon Labs official' },
  { handle: 'PolygonDevs', reason: 'Official Polygon account' },
  { handle: 'PolygonLabs', reason: 'Official Polygon Labs account' }
];

console.log(`Adding ${defaultExclusions.length} default exclusions to Supabase...\n`);

let idCounter = Date.now();

for (const exclusion of defaultExclusions) {
  const { data, error } = await supabase
    .from('excluded_accounts')
    .insert([{
      id: idCounter++,
      handle: exclusion.handle.toLowerCase().replace(/^@/, ''),
      reason: exclusion.reason,
      added_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error(`❌ Failed to add @${exclusion.handle}:`, error.message);
  } else {
    console.log(`✅ Added: @${exclusion.handle} - ${exclusion.reason}`);
  }
}

console.log('\n✅ Default exclusions added successfully!');
console.log('\nYou can add more exclusions via the app UI: Kaito tab → Manage Exclusions');
