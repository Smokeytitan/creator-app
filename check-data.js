import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkData() {
  const { data: campaigns } = await supabase.from('campaigns').select('*').limit(2);
  const { data: creators } = await supabase.from('creators').select('*').limit(2);
  
  console.log('\n=== SAMPLE CAMPAIGN ===');
  console.log(JSON.stringify(campaigns[0], null, 2));
  
  console.log('\n=== SAMPLE CREATOR ===');
  console.log(JSON.stringify(creators[0], null, 2));
}

checkData();
