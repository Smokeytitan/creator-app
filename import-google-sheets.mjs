/**
 * One-time import script: Google Sheets → Supabase
 * Run this once to import all creator data from Google Sheets into Supabase
 *
 * Usage: node import-google-sheets.mjs
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env
function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      });
    }
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
}

loadEnv();

// Supabase configuration from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ibqqffnwawkualsynlrt.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt';

console.log(`Using Supabase URL: ${SUPABASE_URL}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials not found. Please check your .env file.');
  process.exit(1);
}

// Google Sheets CSV export URL
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Parse CSV text into a 2D array
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  const data = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    data.push(parseCSVLine(line));
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}

/**
 * Map raw sheet data to creator format
 * Expected format: Row 1 = names, Row 2 = cost/post, Row 4 = num posts, Row 6 = cost individual
 */
function mapToCreators(rawData) {
  if (rawData.length < 6) {
    console.error('Invalid sheet format: not enough rows');
    return [];
  }

  const creatorNames = rawData[0]; // First row: Champion, Picolas Cage, Jampzey, etc.
  const costPerPost = rawData[1]; // Second row: Cost/post values
  const numPosts = rawData[3]; // Fourth row: Number of Posts
  const totalCost = rawData[5]; // Sixth row: Cost Individual

  const creators = [];
  let sequentialId = 1; // Use sequential IDs starting from 1

  // Start from index 1 to skip the label column
  for (let i = 1; i < creatorNames.length; i++) {
    const name = creatorNames[i]?.trim();
    if (!name || name === '' || name.toLowerCase() === 'champion') continue; // Skip empty and "Champion" label

    const posts = numPosts[i] || '0';
    const cost = totalCost[i] || '$0.00';

    creators.push({
      id: sequentialId++, // Assign sequential ID and increment
      name: name,
      handle: `@${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
      notes: `${posts} posts, ${cost} total`,
      cost_per_post: costPerPost[i] || '',
      platforms: ['X'], // Default to X platform
      active: true
    });
  }

  return creators;
}

/**
 * Main import function
 */
async function importGoogleSheetsToSupabase() {
  console.log('='.repeat(60));
  console.log('Google Sheets → Supabase Import');
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch Google Sheets data
    console.log('\n[1/3] Fetching data from Google Sheets...');
    const response = await axios.get(GOOGLE_SHEET_URL);
    const csvText = response.data;
    console.log('✓ Successfully fetched CSV data');

    // Step 2: Parse and transform data
    console.log('\n[2/3] Parsing and transforming data...');
    const rawData = parseCSV(csvText);
    const creators = mapToCreators(rawData);
    console.log(`✓ Parsed ${creators.length} creators from Google Sheets`);

    if (creators.length === 0) {
      throw new Error('No creators found in Google Sheets');
    }

    // Step 3: Import to Supabase
    console.log('\n[3/3] Importing to Supabase...');
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const creator of creators) {
      try {
        // Check if creator already exists
        const { data: existing, error: checkError } = await supabase
          .from('creators')
          .select('id')
          .eq('id', creator.id)
          .single();

        if (existing) {
          // Update existing creator
          const { error: updateError } = await supabase
            .from('creators')
            .update(creator)
            .eq('id', creator.id);

          if (updateError) throw updateError;
          updatedCount++;
          console.log(`  ✓ Updated: ${creator.name}`);
        } else {
          // Insert new creator
          const { error: insertError } = await supabase
            .from('creators')
            .insert([creator]);

          if (insertError) throw insertError;
          importedCount++;
          console.log(`  ✓ Imported: ${creator.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Failed to import ${creator.name}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Import Summary:');
    console.log('='.repeat(60));
    console.log(`Total creators in sheet: ${creators.length}`);
    console.log(`Newly imported: ${importedCount}`);
    console.log(`Updated existing: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✓ Import completed successfully!');
    } else {
      console.log('\n⚠ Import completed with errors. See details above.');
    }

  } catch (error) {
    console.error('\n✗ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importGoogleSheetsToSupabase();
