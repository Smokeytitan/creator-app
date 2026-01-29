import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state: userId, error: oauthError, error_description } = req.query;

    const productionUrl = process.env.PRODUCTION_URL || process.env.VERCEL_URL;
    const appUrl = productionUrl ? `https://${productionUrl}` : 'http://localhost:5173';

    if (oauthError) {
      console.error('Twitter OAuth error:', { oauthError, error_description });
      return res.redirect(`${appUrl}/?twitter_error=${encodeURIComponent(error_description || oauthError)}`);
    }

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    // Get code verifier from cookie
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {}) || {};

    const codeVerifier = cookies.twitter_code_verifier;

    if (!codeVerifier) {
      console.error('Missing code verifier cookie');
      return res.redirect(`${appUrl}/?twitter_error=missing_code_verifier`);
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/oauth/twitter/callback`;

    if (!clientId || !clientSecret) {
      console.error('Twitter OAuth credentials not configured');
      return res.status(500).json({ error: 'Twitter OAuth not configured' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Twitter token exchange failed:', error);
      return res.status(500).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch Twitter user info');
      return res.status(500).json({ error: 'Failed to fetch user info' });
    }

    const userData = await userResponse.json();
    const { id: platformUserId, username: platformUsername } = userData.data;

    // Store connection in Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform: 'twitter',
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (dbError) {
      console.error('Failed to store Twitter connection:', dbError);
      return res.status(500).json({ error: 'Failed to save connection' });
    }

    // Redirect back to the app with success message
    // Clear the code verifier cookie
    res.setHeader('Set-Cookie', 'twitter_code_verifier=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');

    return res.redirect(`${appUrl}/?twitter_connected=true`);

  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    const productionUrl = process.env.PRODUCTION_URL || process.env.VERCEL_URL;
    const appUrl = productionUrl ? `https://${productionUrl}` : 'http://localhost:5173';
    return res.redirect(`${appUrl}/?twitter_error=internal_error`);
  }
}
