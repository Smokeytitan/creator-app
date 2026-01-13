/**
 * Clear all data from Supabase
 * Run this to delete all creators, campaigns, posts, and associations
 *
 * Usage: node clear-supabase-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Clear all data from Supabase
 */
async function clearAllData() {
  console.log('='.repeat(60));
  console.log('Clearing Supabase Data');
  console.log('='.repeat(60));

  try {
    // Step 1: Delete campaign_creators associations
    console.log('\n[1/4] Deleting campaign-creator associations...');
    const { data: ccData } = await supabase
      .from('campaign_creators')
      .select('*');

    if (ccData && ccData.length > 0) {
      const { error: ccError } = await supabase
        .from('campaign_creators')
        .delete()
        .gte('campaign_id', 0);

      if (ccError) {
        console.error('✗ Error deleting campaign_creators:', ccError.message);
      } else {
        console.log(`✓ Deleted ${ccData.length} campaign-creator associations`);
      }
    } else {
      console.log('✓ No campaign-creator associations to delete');
    }

    // Step 2: Delete posts
    console.log('\n[2/4] Deleting posts...');
    const { data: postsData } = await supabase
      .from('posts')
      .select('id');

    if (postsData && postsData.length > 0) {
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .gte('id', 0);

      if (postsError) {
        console.error('✗ Error deleting posts:', postsError.message);
      } else {
        console.log(`✓ Deleted ${postsData.length} posts`);
      }
    } else {
      console.log('✓ No posts to delete');
    }

    // Step 3: Delete campaigns
    console.log('\n[3/4] Deleting campaigns...');
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('id');

    if (campaignsData && campaignsData.length > 0) {
      const { error: campaignsError } = await supabase
        .from('campaigns')
        .delete()
        .gte('id', 0);

      if (campaignsError) {
        console.error('✗ Error deleting campaigns:', campaignsError.message);
      } else {
        console.log(`✓ Deleted ${campaignsData.length} campaigns`);
      }
    } else {
      console.log('✓ No campaigns to delete');
    }

    // Step 4: Delete creators
    console.log('\n[4/4] Deleting creators...');
    const { data: creatorsData } = await supabase
      .from('creators')
      .select('id');

    if (creatorsData && creatorsData.length > 0) {
      const { error: creatorsError } = await supabase
        .from('creators')
        .delete()
        .gte('id', 0);

      if (creatorsError) {
        console.error('✗ Error deleting creators:', creatorsError.message);
      } else {
        console.log(`✓ Deleted ${creatorsData.length} creators`);
      }
    } else {
      console.log('✓ No creators to delete');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ All data cleared successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Clear failed:', error.message);
    process.exit(1);
  }
}

// Run the clear
clearAllData();
