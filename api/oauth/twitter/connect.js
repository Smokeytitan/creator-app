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
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/api/oauth/twitter/callback`;

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

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('base64url');

    // Store code verifier and state in session or database
    // For now, we'll pass it through the state parameter (not ideal for production)
    const stateData = Buffer.from(JSON.stringify({
      state,
      codeVerifier,
      userId: req.query.userId // Pass user ID through the flow
    })).toString('base64url');

    // Twitter OAuth 2.0 authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.append('state', stateData);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    return res.status(200).json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Twitter OAuth connect error:', error);
    return res.status(500).json({ error: 'Failed to initiate OAuth flow', message: error.message });
  }
}
