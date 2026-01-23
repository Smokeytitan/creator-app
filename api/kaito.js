export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.VITE_KAITO_API_KEY;

    if (!apiKey) {
      console.error('VITE_KAITO_API_KEY not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build query string from request query params
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `https://api.kaito.ai/api/v1/community_mindshare?${queryParams}`;

    console.log('Proxying request to Kaito API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kaito API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Kaito API request failed',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('Successfully fetched from Kaito API');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
