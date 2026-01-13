#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
let supabaseUrl, supabaseKey;
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  });
} catch (e) {
  try {
    const envContent = readFileSync('.env', 'utf-8');
    envContent.split('\n').forEach(line => {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1].trim();
      }
    });
  } catch (e2) {
    console.error('Could not find .env or .env.local file');
    process.exit(1);
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== Querying Supabase Campaigns ===\n');

const { data: campaigns, error } = await supabase
  .from('campaigns')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log(`Found ${campaigns.length} campaigns:\n`);
campaigns.forEach((c, i) => {
  console.log(`${i + 1}. ${c.title}`);
  console.log(`   ID: ${c.id}`);
  console.log(`   Status: ${c.status}`);
  console.log(`   Created: ${c.created_at}`);
  console.log('');
});

// Also check creators
const { data: creators, error: creatorsError } = await supabase
  .from('creators')
  .select('id, name, handle');

if (creatorsError) {
  console.error('Error fetching creators:', creatorsError.message);
} else {
  console.log(`\n=== Found ${creators.length} creators in Supabase ===\n`);
}

