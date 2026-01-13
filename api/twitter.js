/**
 * Twitter API Proxy - Fetches tweet content from Twitter API v2
 *
 * This serverless function proxies requests to Twitter API to:
 * 1. Avoid CORS issues
 * 2. Keep API keys secure
 * 3. Batch fetch tweet content for multiple tweet URLs
 *
 * Uses OAuth 1.0a authentication for better reliability
 */

import crypto from 'crypto';

/**
 * Generate OAuth 1.0a signature for Twitter API
 */
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret = '') {
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Generate signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
}

/**
 * Generate OAuth 1.0a Authorization header
 */
function generateOAuthHeader(method, url, queryParams, consumerKey, consumerSecret, accessToken, accessTokenSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_nonce: crypto.randomBytes(32).toString('base64').replace(/\W/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0'
  };

  // Combine OAuth params with query params for signature
  const allParams = { ...oauthParams, ...queryParams };

  // Generate signature (now with accessTokenSecret)
  const signature = generateOAuthSignature(method, url, allParams, consumerSecret, accessTokenSecret);
  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return authHeader;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Twitter API credentials from environment
  const consumerKey = process.env.TWITTER_CONSUMER_KEY;
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    console.error('Twitter API credentials not configured');
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
    const baseUrl = 'https://api.twitter.com/2/tweets';
    const queryParams = {
      ids: tweetIds.join(','),
      'tweet.fields': 'created_at,text,public_metrics,author_id',
      expansions: 'author_id',
      'user.fields': 'username,name'
    };

    // Generate OAuth header with access tokens
    const authHeader = generateOAuthHeader('GET', baseUrl, queryParams, consumerKey, consumerSecret, accessToken, accessTokenSecret);

    // Build full URL with query params
    const queryString = Object.keys(queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
    const fullUrl = `${baseUrl}?${queryString}`;

    // Make request to Twitter API
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
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
