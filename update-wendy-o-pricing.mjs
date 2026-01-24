#!/usr/bin/env node

/**
 * Update Wendy O with Package Pricing
 *
 * This script:
 * 1. Runs the pricing packages migration
 * 2. Finds Wendy O in the database
 * 3. Updates her with package pricing structure
 *
 * Package: $14,000 for 8 videos
 * - Each video: $3,500
 * - Posted to both Instagram + Facebook
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('📦 Running pricing packages migration...\n');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'supabase/migrations/002_add_pricing_packages.sql'),
      'utf-8'
    );

    // Note: This requires admin access. If this fails, run the migration manually in Supabase SQL Editor
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.log('⚠️  Migration might already be applied or requires manual run');
      console.log('   Run the migration manually in Supabase SQL Editor if needed');
      console.log('   File: supabase/migrations/002_add_pricing_packages.sql\n');
    } else {
      console.log('✅ Migration completed successfully\n');
    }
  } catch (error) {
    console.log('⚠️  Could not auto-run migration');
    console.log('   Please run manually in Supabase SQL Editor:');
    console.log('   supabase/migrations/002_add_pricing_packages.sql\n');
  }
}

async function findWendyO() {
  console.log('🔍 Searching for Wendy O...\n');

  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .ilike('name', '%wendy%o%')
    .limit(5);

  if (error) {
    console.error('❌ Error searching for Wendy O:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.log('❌ Wendy O not found in database');
    console.log('   Please check the creator name and try again\n');
    return null;
  }

  // Show results
  console.log(`Found ${data.length} matching creator(s):\n`);
  data.forEach((creator, index) => {
    console.log(`${index + 1}. ${creator.name} (@${creator.handle})`);
    console.log(`   ID: ${creator.id}`);
    console.log(`   Current cost_per_post: ${creator.cost_per_post || 'Not set'}`);
    console.log(`   Platforms: ${(creator.platforms || []).join(', ')}`);
    console.log('');
  });

  return data;
}

async function updateWendyO(creatorId) {
  console.log(`📝 Updating Wendy O (ID: ${creatorId}) with package pricing...\n`);

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

  const { data, error } = await supabase
    .from('creators')
    .update({
      pricing_packages: [packageData],
      cost_per_post: '$3,500.00', // Update base cost to match package
      platforms: ['Instagram', 'Facebook'] // Update platforms
    })
    .eq('id', creatorId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating Wendy O:', error.message);
    return false;
  }

  console.log('✅ Successfully updated Wendy O!\n');
  console.log('Updated pricing:');
  console.log(`  Package: ${packageData.name}`);
  console.log(`  Total Cost: $${packageData.totalCost.toLocaleString()}`);
  console.log(`  Quantity: ${packageData.quantity} ${packageData.unitType}s`);
  console.log(`  Cost Per ${packageData.unitType}: $${packageData.costPerUnit.toLocaleString()}`);
  console.log(`  Platforms: ${packageData.platforms.join(' + ')}`);
  console.log(`  Description: ${packageData.description}`);
  console.log('');

  return true;
}

async function main() {
  console.log('🚀 Wendy O Package Pricing Update\n');
  console.log('='.repeat(50));
  console.log('');

  // Step 1: Run migration (or notify to run manually)
  await runMigration();

  // Step 2: Find Wendy O
  const creators = await findWendyO();
  if (!creators || creators.length === 0) {
    process.exit(1);
  }

  // If multiple matches, ask user to choose
  let selectedCreator;
  if (creators.length === 1) {
    selectedCreator = creators[0];
    console.log(`Proceeding with: ${selectedCreator.name} (@${selectedCreator.handle})\n`);
  } else {
    console.log('Multiple matches found. Please run this script with the correct creator ID:');
    console.log('node update-wendy-o-pricing.mjs <creator_id>\n');
    process.exit(0);
  }

  // Step 3: Update with package pricing
  const success = await updateWendyO(selectedCreator.id);

  if (success) {
    console.log('='.repeat(50));
    console.log('✅ All done! Wendy O now has package pricing configured.');
    console.log('');
  } else {
    console.log('❌ Update failed. Please check the error messages above.');
    process.exit(1);
  }
}

// Handle creator ID from command line
const creatorIdArg = process.argv[2];
if (creatorIdArg) {
  console.log(`🔄 Updating creator ID: ${creatorIdArg}\n`);
  updateWendyO(parseInt(creatorIdArg)).then(success => {
    if (success) {
      console.log('✅ Update complete!');
    } else {
      process.exit(1);
    }
  });
} else {
  main();
}
