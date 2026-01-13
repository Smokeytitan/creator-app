import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicXFmZm53YXdrdWFsc3lubHJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjU3OTMwNSwiZXhwIjoyMDUyMTU1MzA1fQ.rPqTQW4YYbqvTvk5nXHUZ2RWKJUmJcdUpCxz8_UW8Jg'
);

console.log('Creating campaign_tweets table...');

// Check if table exists
const { data: tables, error: checkError } = await supabase
  .from('campaign_tweets')
  .select('id')
  .limit(1);

if (checkError && checkError.code === '42P01') {
  console.log('Table does not exist yet, that\'s expected.');
} else if (!checkError) {
  console.log('✓ Table already exists!');
  process.exit(0);
}

console.log('\n❌ Cannot create tables via Supabase client.');
console.log('\nPlease create the table manually:');
console.log('1. Go to: https://supabase.com/dashboard/project/ibqqffnwawkualsynlrt/sql/new');
console.log('2. Copy the SQL from: supabase-campaign-tweets-schema.sql');
console.log('3. Paste and click "Run"');
console.log('\nOr open the dashboard and I\'ll show you the SQL to run.');
