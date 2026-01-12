#!/usr/bin/env node
/**
 * Database Setup Script
 * Executes the Supabase schema SQL to create tables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Read SQL schema file
const sqlPath = join(__dirname, 'supabase-schema.sql');
const sql = readFileSync(sqlPath, 'utf-8');

// Split into individual statements (rough split on semicolons)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

// Execute each statement
let successCount = 0;
let failCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';

  // Skip comments
  if (statement.trim().startsWith('--')) continue;

  try {
    console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      console.error(`❌ Error:`, error.message);
      failCount++;
    } else {
      console.log(`✅ Success`);
      successCount++;
    }
  } catch (err) {
    console.error(`❌ Exception:`, err.message);
    failCount++;
  }

  console.log('');
}

console.log('\n📊 Summary:');
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);

if (failCount > 0) {
  console.log('\n⚠️  Some statements failed. You may need to run them manually in the Supabase SQL Editor.');
  console.log('📍 Go to: https://supabase.com/dashboard/project/ibqqffnwawkualsynlrt/sql/new');
} else {
  console.log('\n🎉 Database setup complete!');
}
