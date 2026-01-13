/**
 * Excel Import Service
 * Handles importing creator and campaign data from Excel files to Supabase
 */

import * as XLSX from 'xlsx';
import { createCreator, updateCreator, getCreators } from './creatorsServiceSupabase';
import { createCampaign, updateCampaign, getCampaigns } from './campaignsServiceSupabase';
import { addPost } from './creatorsServiceSupabase';

/**
 * Parse Excel file from uploaded File object
 * @param {File} file - Excel file (.xlsx, .xls)
 * @returns {Promise<Object>} Parsed workbook with sheets
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Import Roster sheet data (creators)
 * Expected format: Horizontal layout
 * Row 1: Creator names
 * Row 2: Cost per post
 * Row 4: Number of posts
 * Row 6: Total cost
 *
 * @param {Object} workbook - XLSX workbook
 * @returns {Promise<Object>} Import results
 */
export const importRosterSheet = async (workbook) => {
  const sheetName = 'Roster';
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  // Convert sheet to 2D array
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length < 6) {
    throw new Error('Invalid Roster sheet format: not enough rows');
  }

  const creatorNames = data[0]; // Row 1
  const costPerPost = data[1];   // Row 2
  const numPosts = data[3];      // Row 4
  const totalCost = data[5];     // Row 6

  const results = {
    created: [],
    updated: [],
    errors: []
  };

  // Get existing creators
  const existingCreators = await getCreators();
  const existingByName = {};
  existingCreators.forEach(c => {
    existingByName[c.name.toLowerCase()] = c;
  });

  // Parse each creator (skip first column which is labels)
  for (let i = 1; i < creatorNames.length; i++) {
    const name = creatorNames[i]?.toString().trim();
    if (!name || name === '' || name.toLowerCase() === 'champion') continue;

    const creatorData = {
      name: name,
      handle: `@${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
      notes: `${numPosts[i] || 0} posts, ${totalCost[i] || '$0.00'} total`,
      costPerPost: costPerPost[i]?.toString() || '',
      platforms: ['X'],
      active: true
    };

    try {
      const existing = existingByName[name.toLowerCase()];

      if (existing) {
        // Update existing creator
        await updateCreator(existing.id, creatorData);
        results.updated.push(name);
      } else {
        // Create new creator
        await createCreator(creatorData);
        results.created.push(name);
      }
    } catch (error) {
      results.errors.push({ name, error: error.message });
    }
  }

  return results;
};

/**
 * Import Deliverables sheet data (campaigns with posts)
 * Expected format:
 * Header: Content Request, Req Date, Creator1, Creator1 Impressions, Creator2, Creator2 Impressions...
 * Each row: Campaign title, date, tweet URLs and impressions
 *
 * @param {Object} workbook - XLSX workbook
 * @returns {Promise<Object>} Import results
 */
export const importDeliverablesSheet = async (workbook) => {
  const sheetName = 'Deliverables';
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  // Convert sheet to 2D array
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error('Invalid Deliverables sheet format: not enough rows');
  }

  const headerRow = data[0];
  const results = {
    created: [],
    updated: [],
    posts: 0,
    errors: []
  };

  // Get existing creators and campaigns
  const creators = await getCreators();
  const creatorByName = {};
  creators.forEach(c => {
    creatorByName[c.name.toLowerCase()] = c;
  });

  const existingCampaigns = await getCampaigns();
  const campaignByTitle = {};
  existingCampaigns.forEach(c => {
    campaignByTitle[c.title.toLowerCase()] = c;
  });

  // Parse header to find creator columns
  const creatorColumns = [];
  for (let i = 2; i < headerRow.length; i += 2) {
    const creatorName = headerRow[i]?.toString().trim();
    if (creatorName) {
      creatorColumns.push({
        name: creatorName,
        urlIndex: i,
        impressionsIndex: i + 1
      });
    }
  }

  // Process each campaign row
  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const campaignTitle = row[0]?.toString().trim();
    const reqDate = row[1]?.toString().trim();

    if (!campaignTitle) continue;

    try {
      // Parse date
      let createdAt = new Date().toISOString();
      if (reqDate) {
        try {
          const [month, day, year] = reqDate.split('/');
          const fullYear = year.length === 2 ? `20${year}` : year;
          createdAt = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
        } catch {
          // Use current date if parsing fails
        }
      }

      // Calculate total impressions and collect posts
      let totalImpressions = 0;
      const posts = [];

      for (const creatorCol of creatorColumns) {
        const tweetUrl = row[creatorCol.urlIndex]?.toString().trim();
        const impressions = row[creatorCol.impressionsIndex];

        if (tweetUrl && impressions) {
          const creator = creatorByName[creatorCol.name.toLowerCase()];
          if (creator) {
            const impressionValue = parseInt(impressions.toString().replace(/,/g, '')) || 0;
            totalImpressions += impressionValue;

            posts.push({
              creator_id: creator.id,
              tweet_url: tweetUrl,
              impressions: impressionValue
            });
          }
        }
      }

      // Create or update campaign
      const campaignData = {
        title: campaignTitle,
        description: `Content campaign: ${campaignTitle}`,
        status: 'completed',
        estimatedImpressions: totalImpressions,
        createdAt: createdAt
      };

      const existing = campaignByTitle[campaignTitle.toLowerCase()];
      let campaignId;

      if (existing) {
        await updateCampaign(existing.id, campaignData);
        campaignId = existing.id;
        results.updated.push(campaignTitle);
      } else {
        const newCampaign = await createCampaign(campaignData);
        campaignId = newCampaign.id;
        results.created.push(campaignTitle);
      }

      // Add posts
      for (const post of posts) {
        await addPost(post.creator_id, {
          link: post.tweet_url,
          impressions: post.impressions.toString(),
          platform: 'X',
          date: createdAt
        }, campaignId);
        results.posts++;
      }

    } catch (error) {
      results.errors.push({ campaign: campaignTitle, error: error.message });
    }
  }

  return results;
};

/**
 * Import entire Excel workbook (Roster + Deliverables)
 * @param {File} file - Excel file
 * @returns {Promise<Object>} Combined import results
 */
export const importExcelWorkbook = async (file) => {
  try {
    const workbook = await parseExcelFile(file);

    console.log('Available sheets:', workbook.SheetNames);

    const results = {
      roster: { created: [], updated: [], errors: [] },
      deliverables: { created: [], updated: [], posts: 0, errors: [] }
    };

    // Import Roster if exists
    if (workbook.SheetNames.includes('Roster')) {
      results.roster = await importRosterSheet(workbook);
    }

    // Import Deliverables if exists
    if (workbook.SheetNames.includes('Deliverables')) {
      results.deliverables = await importDeliverablesSheet(workbook);
    }

    return results;
  } catch (error) {
    throw new Error(`Import failed: ${error.message}`);
  }
};
