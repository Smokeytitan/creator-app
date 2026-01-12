/**
 * Twitter User Timeline API Proxy
 * Fetches all tweets from specific users within a date range
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bearerToken = process.env.VITE_TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    console.error('Twitter API bearer token not configured');
    return res.status(500).json({ error: 'Twitter API not configured' });
  }

  try {
    const { userId, startTime, endTime, maxResults = 100 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`Fetching timeline for user ${userId}`);

    // Build Twitter API URL for user timeline
    // API docs: https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-tweets
    let url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,text,public_metrics,author_id`;

    if (startTime) {
      url += `&start_time=${startTime}`;
    }
    if (endTime) {
      url += `&end_time=${endTime}`;
    }

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

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in Twitter user timeline proxy:', error);
    return res.status(500).json({
      error: 'Failed to fetch user timeline',
      message: error.message
    });
  }
}
