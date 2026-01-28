/**
 * Flash Campaign Excel Import Service
 * Handles importing tweet URLs from Excel files for flash campaigns
 */

import * as XLSX from 'xlsx';
import { extractTweetId, batchFetchTweets } from './twitterService';
import { batchTranslateTweets, findMatchingPhraseWithTranslation } from './twitterService';

/**
 * Parse Excel file for flash campaign tweet upload
 * Expected columns: Creator Handle, Tweet URL
 * @param {File} file - Excel file (.xlsx, .xls)
 * @returns {Promise<Array>} Array of { handle, tweetUrl }
 */
export const parseFlashCampaignExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Convert to 2D array
        const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (sheetData.length < 2) {
          reject(new Error('Excel file must have at least a header row and one data row'));
          return;
        }

        // Find column indices (case-insensitive search)
        const headerRow = sheetData[0].map(h => String(h).toLowerCase().trim());
        const handleIdx = headerRow.findIndex(h =>
          h.includes('handle') || h.includes('creator') || h.includes('username')
        );
        const urlIdx = headerRow.findIndex(h =>
          h.includes('url') || h.includes('tweet') || h.includes('link')
        );

        if (handleIdx === -1 || urlIdx === -1) {
          reject(new Error('Could not find required columns. Please ensure your Excel file has columns for "Creator Handle" and "Tweet URL"'));
          return;
        }

        // Parse data rows
        const tweets = [];
        for (let i = 1; i < sheetData.length; i++) {
          const row = sheetData[i];
          const handle = row[handleIdx]?.toString().trim();
          const tweetUrl = row[urlIdx]?.toString().trim();

          if (handle && tweetUrl) {
            tweets.push({ handle, tweetUrl });
          }
        }

        if (tweets.length === 0) {
          reject(new Error('No valid tweets found in Excel file'));
          return;
        }

        console.log(`Parsed ${tweets.length} tweets from Excel file`);
        resolve(tweets);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extract tweet IDs from an array of tweet URLs
 * @param {Array<string>} tweetUrls - Array of tweet URLs
 * @returns {Array<string>} Array of tweet IDs
 */
export const extractTweetIdsFromUrls = (tweetUrls) => {
  const tweetIds = [];

  for (const url of tweetUrls) {
    const tweetId = extractTweetId(url);
    if (tweetId) {
      tweetIds.push(tweetId);
    }
  }

  return tweetIds;
};

/**
 * Process uploaded tweets for a campaign
 * Fetches tweet content, translates if needed, matches against key phrases, and merges with existing results
 * @param {number} campaignId - Campaign ID
 * @param {Array} tweetsData - Array of { handle, tweetUrl } from Excel
 * @param {Object} existingResults - Existing campaign results
 * @param {Array<string>} keyPhrases - Campaign key phrases
 * @returns {Promise<Object>} Processing results with merged tweets
 */
export const processTweetsForCampaign = async (campaignId, tweetsData, existingResults, keyPhrases) => {
  console.log(`[processTweetsForCampaign] Processing ${tweetsData.length} uploaded tweets for campaign ${campaignId}`);

  // Extract tweet IDs
  const tweetUrls = tweetsData.map(t => t.tweetUrl);
  const tweetIds = extractTweetIdsFromUrls(tweetUrls);

  if (tweetIds.length === 0) {
    throw new Error('No valid tweet URLs found in uploaded file');
  }

  console.log(`[processTweetsForCampaign] Extracted ${tweetIds.length} tweet IDs`);

  // Check for duplicates against existing results
  const existingTweetIds = new Set(
    (existingResults?.eligibleTweets || []).map(t => t.tweetId)
  );

  const newTweetIds = tweetIds.filter(id => !existingTweetIds.has(id));
  const duplicateCount = tweetIds.length - newTweetIds.length;

  if (duplicateCount > 0) {
    console.log(`[processTweetsForCampaign] Skipping ${duplicateCount} duplicate tweets`);
  }

  if (newTweetIds.length === 0) {
    return {
      newTweets: [],
      duplicateCount,
      skippedCount: 0,
      error: null,
      message: 'All uploaded tweets were duplicates'
    };
  }

  // Create metadata map for tweets
  const tweetMetadata = {};
  tweetsData.forEach(({ handle, tweetUrl }) => {
    const tweetId = extractTweetId(tweetUrl);
    if (tweetId && newTweetIds.includes(tweetId)) {
      tweetMetadata[tweetId] = {
        handle,
        tweetUrl
      };
    }
  });

  // Fetch tweet content from Twitter API
  let fetchedTweets = [];
  let twitterApiSuccess = false;

  try {
    console.log(`[processTweetsForCampaign] Fetching ${newTweetIds.length} tweets from Twitter API...`);
    fetchedTweets = await batchFetchTweets(newTweetIds);
    twitterApiSuccess = true;
    console.log(`[processTweetsForCampaign] Successfully fetched ${fetchedTweets.length} tweets`);
  } catch (error) {
    console.error('[processTweetsForCampaign] Twitter API error:', error);
    return {
      newTweets: [],
      duplicateCount,
      skippedCount: newTweetIds.length,
      error: error.message,
      message: 'Failed to fetch tweets from Twitter API'
    };
  }

  // Translate tweets if needed (Korean tweets)
  // Translation is optional - if API key not configured, tweets won't be translated
  let translatedTweets = [];
  try {
    console.log(`[processTweetsForCampaign] Attempting to translate non-English tweets...`);
    translatedTweets = await batchTranslateTweets(fetchedTweets);
    console.log(`[processTweetsForCampaign] Translation complete`);
  } catch (error) {
    console.warn('[processTweetsForCampaign] Translation unavailable (API key not configured), using original text:', error.message);
    translatedTweets = fetchedTweets.map(t => ({ ...t, translatedText: null }));
  }

  // Match tweets against key phrases
  const newTweets = [];
  let matchedCount = 0;

  for (const tweet of translatedTweets) {
    const metadata = tweetMetadata[tweet.id];
    if (!metadata) continue;

    // Try to match phrase (with translation support)
    const matchResult = findMatchingPhraseWithTranslation(
      tweet.text,
      tweet.translatedText,
      keyPhrases
    );

    if (matchResult.matchedPhrase) {
      matchedCount++;

      const impressions = tweet.public_metrics?.impression_count || 0;
      const retweets = tweet.public_metrics?.retweet_count || 0;
      const likes = tweet.public_metrics?.like_count || 0;
      const replies = tweet.public_metrics?.reply_count || 0;
      const quotes = tweet.public_metrics?.quote_count || 0;
      const bookmarks = tweet.public_metrics?.bookmark_count || 0;

      const totalEngagement = retweets + likes + replies + quotes + bookmarks;
      const engagementRate = impressions > 0
        ? ((totalEngagement / impressions) * 100).toFixed(2) + '%'
        : '0%';

      newTweets.push({
        tweetId: tweet.id,
        tweetUrl: metadata.tweetUrl,
        tweetText: tweet.text,
        translatedText: tweet.translatedText || null,
        language: tweet.lang || 'en',
        matchedPhrase: matchResult.matchedPhrase,
        matchedIn: matchResult.matchedIn,
        translationUsed: matchResult.matchedIn === 'translated',
        creatorName: tweet.author_name || metadata.handle.replace('@', ''),
        creatorHandle: metadata.handle,
        creatorRank: 0, // Will be updated if creator is in leaderboard
        creatorUserId: tweet.author_id || 'unknown',
        totalImpressions: impressions,
        totalRetweets: retweets,
        totalLikes: likes,
        totalReplies: replies,
        totalQuotes: quotes,
        totalBookmarks: bookmarks,
        engagementRate,
        createdAt: tweet.created_at || new Date().toISOString(),
        source: 'upload',
        requiresManualVerification: false
      });
    }
  }

  console.log(`[processTweetsForCampaign] Matched ${matchedCount} out of ${fetchedTweets.length} tweets`);

  return {
    newTweets,
    duplicateCount,
    skippedCount: fetchedTweets.length - matchedCount,
    error: null,
    message: `Successfully processed ${newTweets.length} tweets (${duplicateCount} duplicates skipped, ${fetchedTweets.length - matchedCount} didn't match key phrases)`
  };
};
