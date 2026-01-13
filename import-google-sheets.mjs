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

// Google Sheets CSV export URLs
const ROSTER_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=1537582832';
const DELIVERABLES_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1J75nBdYNyQivMdi7XihhpYr6aXOnCNcJIAjTQLwjkXk/export?format=csv&gid=0';

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
 * Parse Deliverables sheet and map to campaigns with posts
 * Expected format: Each row is a campaign with creator columns (name, name impressions, ...)
 * Header row: Content Request, Req Date, Picolas Cage, Picolas Cage Impressions, Jampzey, Jampzey Impressions, ...
 */
function mapToCampaigns(rawData, creatorMapping) {
  if (rawData.length < 2) {
    console.error('Invalid deliverables format: not enough rows');
    return [];
  }

  const headerRow = rawData[0];
  const campaigns = [];

  // Parse header to get creator column indices
  const creatorColumns = [];
  for (let i = 2; i < headerRow.length; i += 2) {
    const creatorName = headerRow[i];
    if (creatorName && creatorName.trim()) {
      creatorColumns.push({
        name: creatorName.trim(),
        urlIndex: i,
        impressionsIndex: i + 1
      });
    }
  }

  // Process each campaign row
  for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
    const row = rawData[rowIndex];
    const campaignTitle = row[0]?.trim();
    const reqDate = row[1]?.trim();

    if (!campaignTitle) continue;

    const campaign = {
      id: rowIndex,
      title: campaignTitle,
      description: `Content campaign: ${campaignTitle}`,
      status: 'completed',
      created_at: reqDate ? parseDateString(reqDate) : new Date().toISOString(),
      posts: []
    };

    let totalImpressions = 0;

    // Extract posts for each creator
    for (const creatorCol of creatorColumns) {
      const tweetUrl = row[creatorCol.urlIndex]?.trim();
      const impressions = row[creatorCol.impressionsIndex]?.trim();

      if (tweetUrl && impressions) {
        const creatorId = creatorMapping[creatorCol.name];
        if (creatorId) {
          campaign.posts.push({
            creator_id: creatorId,
            creator_name: creatorCol.name,
            tweet_url: tweetUrl,
            impressions: parseInt(impressions.replace(/,/g, '')) || 0
          });
          totalImpressions += parseInt(impressions.replace(/,/g, '')) || 0;
        }
      }
    }

    campaign.estimated_impressions = totalImpressions;
    campaigns.push(campaign);
  }

  return campaigns;
}

/**
 * Parse date string from Google Sheets (e.g., "11/18/25" or "12/2/25")
 */
function parseDateString(dateStr) {
  try {
    const [month, day, year] = dateStr.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`);
    return new Date().toISOString();
  }
}

// Fallback campaigns data (if Deliverables sheet fails)
const FALLBACK_CAMPAIGNS = [
  {
    id: 1,
    title: "Revolut x Mastercard",
    description: "Content campaign promoting Revolut x Mastercard partnership.",
    creators: [1, 2, 3, 4], // Creator IDs
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 2,
    title: "POL Token Status on Robinhood US",
    description: "Campaign covering POL token availability on Robinhood US platform.",
    creators: [1, 2, 3, 4],
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 3,
    title: "ETH Foundation Polygon Payments Overview",
    description: "Content highlighting ETH Foundation's payments on Polygon network.",
    creators: [1, 2, 3, 4],
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 4,
    title: "Highest Day of Stablecoin Transactions",
    description: "Campaign showcasing record-breaking stablecoin transaction volume.",
    creators: [1, 2, 3],
    status: "completed",
    estimated_cost: 10050,
    estimated_impressions: 273500
  },
  {
    id: 5,
    title: "Madhurigi Hardfork",
    description: "Content campaign covering the Madhurigi hardfork event.",
    creators: [1, 2, 3, 4],
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 6,
    title: "P2P Stablecoin Volume Stats Via Dune",
    description: "Campaign highlighting P2P stablecoin volume statistics from Dune Analytics.",
    creators: [1, 2, 3, 4],
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 7,
    title: "S2 Polygon/Kaito Campaign",
    description: "Season 2 campaign collaboration between Polygon and Kaito.",
    creators: [1, 2, 3, 4],
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 8,
    title: "Shift4",
    description: "Content campaign promoting Shift4 integration or partnership.",
    creators: [1, 2, 3, 4],
    status: "completed",
    estimated_cost: 14050,
    estimated_impressions: 320800
  },
  {
    id: 9,
    title: "End Of Year Video",
    description: "Year-end recap video campaign highlighting achievements.",
    creators: [1, 2, 4],
    status: "completed",
    estimated_cost: 10500,
    estimated_impressions: 239100
  }
];

/**
 * Main import function
 */
async function importGoogleSheetsToSupabase() {
  console.log('='.repeat(60));
  console.log('Google Sheets → Supabase Import');
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch Roster data
    console.log('\n[1/5] Fetching Roster data from Google Sheets...');
    const rosterResponse = await axios.get(ROSTER_SHEET_URL);
    const rosterCsvText = rosterResponse.data;
    console.log('✓ Successfully fetched Roster CSV data');

    // Step 2: Parse and transform creators
    console.log('\n[2/5] Parsing and transforming creators...');
    const rosterData = parseCSV(rosterCsvText);
    const creators = mapToCreators(rosterData);
    console.log(`✓ Parsed ${creators.length} creators from Google Sheets`);

    if (creators.length === 0) {
      throw new Error('No creators found in Google Sheets');
    }

    // Create creator name -> ID mapping
    const creatorMapping = {};
    creators.forEach(creator => {
      creatorMapping[creator.name] = creator.id;
    });

    // Step 3: Fetch Deliverables data
    console.log('\n[3/5] Fetching Deliverables data from Google Sheets...');
    const deliverablesResponse = await axios.get(DELIVERABLES_SHEET_URL);
    const deliverablesCsvText = deliverablesResponse.data;
    console.log('✓ Successfully fetched Deliverables CSV data');

    // Step 4: Parse and transform campaigns
    console.log('\n[4/5] Parsing and transforming campaigns...');
    const deliverablesData = parseCSV(deliverablesCsvText);
    const campaigns = mapToCampaigns(deliverablesData, creatorMapping);
    console.log(`✓ Parsed ${campaigns.length} campaigns from Google Sheets`);

    // Step 5: Import creators to Supabase
    console.log('\n[5/5] Importing creators to Supabase...');
    let creatorsImported = 0;
    let creatorsUpdated = 0;
    let creatorsErrorCount = 0;

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
          creatorsUpdated++;
          console.log(`  ✓ Updated: ${creator.name}`);
        } else {
          // Insert new creator
          const { error: insertError } = await supabase
            .from('creators')
            .insert([creator]);

          if (insertError) throw insertError;
          creatorsImported++;
          console.log(`  ✓ Imported: ${creator.name}`);
        }
      } catch (error) {
        creatorsErrorCount++;
        console.error(`  ✗ Failed to import ${creator.name}:`, error.message);
      }
    }

    // Step 6: Import campaigns to Supabase
    console.log('\n[6/6] Importing campaigns and posts to Supabase...');
    let campaignsImported = 0;
    let campaignsUpdated = 0;
    let campaignsErrorCount = 0;
    let postsImported = 0;

    for (const campaign of campaigns) {
      try {
        // Check if campaign already exists
        const { data: existing } = await supabase
          .from('campaigns')
          .select('id')
          .eq('id', campaign.id)
          .single();

        // Insert/update campaign
        if (existing) {
          const { error: updateError } = await supabase
            .from('campaigns')
            .update({
              title: campaign.title,
              description: campaign.description,
              status: campaign.status,
              estimated_impressions: campaign.estimated_impressions,
              created_at: campaign.created_at
            })
            .eq('id', campaign.id);

          if (updateError) throw updateError;
          campaignsUpdated++;
          console.log(`  ✓ Updated campaign: ${campaign.title}`);
        } else {
          const { error: insertError } = await supabase
            .from('campaigns')
            .insert([{
              id: campaign.id,
              title: campaign.title,
              description: campaign.description,
              status: campaign.status,
              estimated_impressions: campaign.estimated_impressions,
              created_at: campaign.created_at
            }]);

          if (insertError) throw insertError;
          campaignsImported++;
          console.log(`  ✓ Imported campaign: ${campaign.title}`);
        }

        // Import posts for this campaign
        for (const post of campaign.posts) {
          try {
            const { error: postError } = await supabase
              .from('posts')
              .insert([{
                creator_id: post.creator_id,
                campaign_id: campaign.id,
                link: post.tweet_url,
                impressions: post.impressions.toString(),
                platform: 'X',
                date: campaign.created_at
              }]);

            if (postError) {
              // If post already exists, try to update it
              await supabase
                .from('posts')
                .update({
                  impressions: post.impressions.toString(),
                  link: post.tweet_url
                })
                .eq('creator_id', post.creator_id)
                .eq('campaign_id', campaign.id)
                .eq('link', post.tweet_url);
            }

            postsImported++;
          } catch (postError) {
            console.error(`  ✗ Failed to import post for ${post.creator_name}:`, postError.message);
          }
        }

        // Insert creator associations
        const uniqueCreatorIds = [...new Set(campaign.posts.map(p => p.creator_id))];
        for (const creatorId of uniqueCreatorIds) {
          await supabase
            .from('campaign_creators')
            .upsert({
              campaign_id: campaign.id,
              creator_id: creatorId
            }, {
              onConflict: 'campaign_id,creator_id'
            });
        }

      } catch (error) {
        campaignsErrorCount++;
        console.error(`  ✗ Failed to import campaign ${campaign.title}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Import Summary:');
    console.log('='.repeat(60));
    console.log(`Creators - Total: ${creators.length}, Imported: ${creatorsImported}, Updated: ${creatorsUpdated}, Errors: ${creatorsErrorCount}`);
    console.log(`Campaigns - Total: ${campaigns.length}, Imported: ${campaignsImported}, Updated: ${campaignsUpdated}, Errors: ${campaignsErrorCount}`);
    console.log(`Posts - Imported: ${postsImported}`);
    console.log('='.repeat(60));

    if (creatorsErrorCount === 0 && campaignsErrorCount === 0) {
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
