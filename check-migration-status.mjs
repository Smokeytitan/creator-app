#!/usr/bin/env node

/**
 * Check what data exists in localStorage vs Supabase
 */

console.log('=== Migration Status Check ===\n');
console.log('This script needs to be run in the browser console where localStorage is accessible.\n');
console.log('COPY AND PASTE THIS INTO YOUR BROWSER CONSOLE:\n');
console.log('--- START ---\n');

const browserScript = `
// Check localStorage data
console.log('📦 localStorage Data:');
console.log('==================');

const requests = localStorage.getItem('requests');
const creators = localStorage.getItem('creators');

if (requests) {
  const parsed = JSON.parse(requests);
  console.log(\`✓ Found \${parsed.length} campaigns in localStorage:\`);
  parsed.forEach((r, i) => {
    console.log(\`  \${i + 1}. \${r.title} (ID: \${r.id}, Status: \${r.status})\`);
  });
} else {
  console.log('✗ No campaigns found in localStorage');
}

if (creators) {
  const parsed = JSON.parse(creators);
  console.log(\`\\n✓ Found \${parsed.length} creators in localStorage\`);
} else {
  console.log('\\n✗ No creators found in localStorage');
}

// Check Supabase data
console.log('\\n\\n☁️  Supabase Data:');
console.log('==================');

const { supabase } = await import('./src/lib/supabaseClient.js');

if (!supabase) {
  console.error('✗ Supabase not configured');
} else {
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, title, status, created_at');
  
  if (campaignsError) {
    console.error('✗ Error fetching campaigns:', campaignsError.message);
  } else {
    console.log(\`✓ Found \${campaigns.length} campaigns in Supabase:\`);
    campaigns.forEach((c, i) => {
      console.log(\`  \${i + 1}. \${c.title} (ID: \${c.id}, Status: \${c.status})\`);
    });
  }

  const { data: creatorsData, error: creatorsError } = await supabase
    .from('creators')
    .select('id, name, handle');
  
  if (creatorsError) {
    console.error('\\n✗ Error fetching creators:', creatorsError.message);
  } else {
    console.log(\`\\n✓ Found \${creatorsData.length} creators in Supabase\`);
  }
}
`;

console.log(browserScript);
console.log('\n--- END ---\n');

