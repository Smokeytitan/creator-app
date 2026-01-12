/**
 * Twitter API Proxy - Fetches tweet content from Twitter API v2
 *
 * This serverless function proxies requests to Twitter API to:
 * 1. Avoid CORS issues
 * 2. Keep API keys secure
 * 3. Batch fetch tweet content for multiple tweet URLs
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Twitter API bearer token from environment
  const bearerToken = process.env.VITE_TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    console.error('Twitter API bearer token not configured');
    return res.status(500).json({ error: 'Twitter API not configured' });
  }

  try {
    const { tweetIds } = req.body;

    if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
      return res.status(400).json({ error: 'tweetIds array is required' });
    }

    // Twitter API v2 allows up to 100 tweet IDs per request
    if (tweetIds.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 tweet IDs per request' });
    }

    console.log(`Fetching ${tweetIds.length} tweets from Twitter API`);

    // Build Twitter API URL with tweet fields
    const ids = tweetIds.join(',');
    const url = `https://api.twitter.com/2/tweets?ids=${ids}&tweet.fields=created_at,text,public_metrics,author_id&expansions=author_id&user.fields=username,name`;

    // Make request to Twitter API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twitter API error:', response.status, errorData);

      // Handle rate limiting
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Twitter API rate limit exceeded',
          details: errorData
        });
      }

      return res.status(response.status).json({
        error: 'Twitter API error',
        details: errorData
      });
    }

    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return tweet data
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in Twitter API proxy:', error);
    return res.status(500).json({
      error: 'Failed to fetch tweets',
      message: error.message
    });
  }
}
