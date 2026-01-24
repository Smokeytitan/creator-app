#!/usr/bin/env node

/**
 * Simple script to update Wendy O with package pricing
 * Run this AFTER running the migration in Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Searching for Wendy O...\n');

  // Search for Wendy O
  const { data: creators, error: searchError } = await supabase
    .from('creators')
    .select('*')
    .or('name.ilike.%wendy%,handle.ilike.%wendy%');

  if (searchError) {
    console.error('❌ Error:', searchError.message);
    process.exit(1);
  }

  if (!creators || creators.length === 0) {
    console.log('❌ Wendy O not found');
    process.exit(1);
  }

  console.log(`Found ${creators.length} creator(s):\n`);
  creators.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name} (@${c.handle}) - ID: ${c.id}`);
  });

  const creator = creators[0];
  console.log(`\n📝 Updating ${creator.name}...\n`);

  // Package data
  const packageData = {
    id: Date.now(),
    name: '8 Video Package',
    description: 'Each video posted to both Instagram and Facebook',
    quantity: 8,
    unitType: 'video',
    totalCost: 14000,
    costPerUnit: 3500,
    platforms: ['Instagram', 'Facebook'],
    notes: 'Must purchase both platforms together. $14,000 for 8 videos = $3,500 per video (dual platform)'
  };

  // Update creator
  const { error: updateError } = await supabase
    .from('creators')
    .update({
      pricing_packages: [packageData],
      cost_per_post: '$3,500.00',
      platforms: ['Instagram', 'Facebook']
    })
    .eq('id', creator.id);

  if (updateError) {
    console.error('❌ Update failed:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Successfully updated Wendy O!\n');
  console.log('Package Details:');
  console.log(`  • ${packageData.quantity} ${packageData.unitType}s for $${packageData.totalCost.toLocaleString()}`);
  console.log(`  • $${packageData.costPerUnit.toLocaleString()} per ${packageData.unitType}`);
  console.log(`  • Platforms: ${packageData.platforms.join(' + ')}`);
  console.log(`  • ${packageData.description}\n`);
}

main();
