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
 * Fetch user timeline (all tweets from a user in a date range)
 * @param {string} userId - Twitter user ID
 * @param {string} startTime - ISO 8601 datetime (e.g., "2024-01-01T00:00:00Z")
 * @param {string} endTime - ISO 8601 datetime
 * @param {number} maxResults - Max tweets per request (default 100, max 100)
 * @returns {Promise<Array>} Array of tweet objects
 */
export const fetchUserTimeline = async (userId, startTime, endTime, maxResults = 100) => {
  try {
    const response = await fetch('/api/twitter-user-timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, startTime, endTime, maxResults })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user timeline');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching timeline for user ${userId}:`, error);
    throw error;
  }
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

/**
 * Translate text using Google Cloud Translation API via serverless proxy
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (default: 'en')
 * @param {string} sourceLang - Source language code (optional, auto-detect if not provided)
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, targetLang = 'en', sourceLang = null) => {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        targetLang,
        sourceLang
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to translate text');
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
};

/**
 * Detect if text contains Korean characters (Hangul)
 * @param {string} text - Text to check
 * @returns {boolean} True if Korean characters are detected
 */
export const containsKorean = (text) => {
  if (!text) return false;
  // Hangul Unicode range: AC00-D7AF (Korean syllables)
  // Additional Korean ranges: 1100-11FF (Hangul Jamo), 3130-318F (Hangul Compatibility Jamo)
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  return koreanRegex.test(text);
};

/**
 * Batch translate tweets (only non-English tweets)
 * @param {Array} tweets - Array of tweet objects from Twitter API
 * @returns {Promise<Array>} Tweets with added translatedText field
 */
export const batchTranslateTweets = async (tweets) => {
  if (!tweets || tweets.length === 0) return tweets;

  console.log(`[batchTranslateTweets] Processing ${tweets.length} tweets for translation`);

  // Filter to only non-English tweets that need translation
  // Use Korean character detection to override Twitter's language detection
  const tweetsToTranslate = tweets.filter(tweet => {
    if (!tweet.text) return false;

    // Check if tweet contains Korean characters
    const hasKorean = containsKorean(tweet.text);
    if (hasKorean) return true;

    // Otherwise, check Twitter's language field
    return tweet.lang && tweet.lang !== 'en';
  });

  console.log(`[batchTranslateTweets] Found ${tweetsToTranslate.length} non-English tweets (Korean detection enabled)`);

  // Translate each tweet (with retry logic)
  const translatedTweets = await Promise.all(
    tweets.map(async (tweet) => {
      // Check if tweet needs translation
      const hasKorean = containsKorean(tweet.text);
      const needsTranslation = hasKorean || (tweet.lang && tweet.lang !== 'en');

      // Override language field if Korean characters detected
      if (hasKorean && (!tweet.lang || tweet.lang === 'en' || tweet.lang === 'und')) {
        console.log(`[batchTranslateTweets] Overriding language for tweet ${tweet.id}: detected Korean characters`);
        tweet.lang = 'ko';
      }

      // Skip English tweets
      if (!needsTranslation) {
        return { ...tweet, translatedText: null };
      }

      try {
        const translatedText = await translateText(tweet.text, 'en', tweet.lang);
        console.log(`[batchTranslateTweets] Translated tweet ${tweet.id} from ${tweet.lang} to en`);
        return { ...tweet, translatedText };
      } catch (error) {
        console.warn(`[batchTranslateTweets] Failed to translate tweet ${tweet.id}:`, error);
        return { ...tweet, translatedText: null };
      }
    })
  );

  const successCount = translatedTweets.filter(t => t.translatedText).length;
  console.log(`[batchTranslateTweets] Successfully translated ${successCount} out of ${tweetsToTranslate.length} non-English tweets`);

  return translatedTweets;
};

/**
 * Find matching phrase with translation support
 * Checks both original text and translated text for key phrases
 * @param {string} tweetText - Original tweet text
 * @param {string|null} translatedText - Translated text (if available)
 * @param {string[]} keyPhrases - Array of key phrases to match
 * @returns {Object} { matchedPhrase, matchedIn: 'original'|'translated' }
 */
export const findMatchingPhraseWithTranslation = (tweetText, translatedText, keyPhrases) => {
  // First, try matching against original text
  const originalMatch = findMatchingPhrase(tweetText, keyPhrases);
  if (originalMatch) {
    return {
      matchedPhrase: originalMatch,
      matchedIn: 'original'
    };
  }

  // If no match and we have translated text, try matching against translation
  if (translatedText) {
    const translatedMatch = findMatchingPhrase(translatedText, keyPhrases);
    if (translatedMatch) {
      return {
        matchedPhrase: translatedMatch,
        matchedIn: 'translated'
      };
    }
  }

  // No match found
  return {
    matchedPhrase: null,
    matchedIn: null
  };
};
