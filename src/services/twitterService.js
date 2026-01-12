/**
 * Twitter Service - Fetches tweet content from Twitter API v2
 */

/**
 * Extract tweet ID from Twitter URL
 * @param {string} url - Twitter URL (e.g., https://twitter.com/user/status/1234567890)
 * @returns {string|null} Tweet ID or null if invalid
 */
export const extractTweetId = (url) => {
  try {
    // Match patterns:
    // https://twitter.com/username/status/1234567890
    // https://x.com/username/status/1234567890
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting tweet ID:', error);
    return null;
  }
};

/**
 * Fetch tweet content from Twitter API via serverless proxy
 * @param {string[]} tweetIds - Array of tweet IDs
 * @returns {Promise<object>} Twitter API response with tweet data
 */
export const fetchTweets = async (tweetIds) => {
  try {
    const response = await fetch('/api/twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tweetIds })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch tweets');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
};

/**
 * Batch fetch tweets in chunks (max 100 per request)
 * @param {string[]} tweetIds - Array of tweet IDs
 * @param {number} chunkSize - Chunk size (default 100, Twitter API limit)
 * @returns {Promise<Array>} Array of tweet objects
 */
export const batchFetchTweets = async (tweetIds, chunkSize = 100) => {
  const chunks = [];
  for (let i = 0; i < tweetIds.length; i += chunkSize) {
    chunks.push(tweetIds.slice(i, i + chunkSize));
  }

  console.log(`Fetching ${tweetIds.length} tweets in ${chunks.length} batch(es)`);

  const allTweets = [];

  for (const chunk of chunks) {
    try {
      const response = await fetchTweets(chunk);
      if (response.data) {
        allTweets.push(...response.data);
      }
      // Add delay to avoid rate limiting (300 requests per 15 min = ~3 seconds per request)
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error('Error fetching tweet chunk:', error);
      // Continue with other chunks even if one fails
    }
  }

  return allTweets;
};

/**
 * Check if tweet text contains any of the key phrases (case-insensitive)
 * @param {string} tweetText - Tweet text content
 * @param {string[]} keyPhrases - Array of key phrases to match
 * @returns {string|null} Matched phrase or null if no match
 */
export const findMatchingPhrase = (tweetText, keyPhrases) => {
  if (!tweetText) return null;

  const lowerText = tweetText.toLowerCase();

  for (const phrase of keyPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return phrase;
    }
  }

  return null;
};
