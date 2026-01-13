#!/usr/bin/env node

console.log('=== Debug Migration Issue ===\n');
console.log('Copy and paste this into your browser console AFTER clicking "Migrate Data":\n');
console.log('--- START ---\n');

const script = `
// Check what's in localStorage
const localRequests = JSON.parse(localStorage.getItem('requests') || '[]');
console.log('📦 localStorage campaigns:', localRequests.length);
localRequests.forEach(r => console.log('  -', r.title, '(ID:', r.id, ')'));

// Check what's in Supabase
const { supabase } = await import('./src/lib/supabaseClient.js');
const { data: campaigns, error } = await supabase
  .from('campaigns')
  .select(\`
    *,
    campaign_creators (
      creator:creators (id, name, handle)
    )
  \`);

if (error) {
  console.error('❌ Error fetching from Supabase:', error);
} else {
  console.log('\\n☁️  Supabase campaigns:', campaigns.length);
  campaigns.forEach(c => {
    console.log('  -', c.title, '(ID:', c.id, ')');
    console.log('    Creators:', c.campaign_creators?.length || 0);
  });
}
`;

console.log(script);
console.log('\n--- END ---\n');

