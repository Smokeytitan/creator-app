import crypto from 'crypto';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const productionUrl = process.env.PRODUCTION_URL || process.env.VERCEL_URL;
    const redirectUri = `${productionUrl ? `https://${productionUrl}` : 'http://localhost:5173'}/api/oauth/twitter/callback`;

    if (!clientId) {
      console.error('TWITTER_CLIENT_ID not set');
      return res.status(500).json({ error: 'Twitter OAuth not configured' });
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Twitter OAuth 2.0 authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.append('state', userId); // Pass user ID as state
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Store code verifier in cookie for callback
    res.setHeader('Set-Cookie', `twitter_code_verifier=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);

    return res.status(200).json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Twitter OAuth connect error:', error);
    return res.status(500).json({ error: 'Failed to initiate OAuth flow', message: error.message });
  }
}
