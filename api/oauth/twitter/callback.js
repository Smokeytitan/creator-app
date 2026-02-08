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
    const authString = `${clientId}:${clientSecret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

    console.log('Token exchange request:', {
      clientIdLength: clientId.length,
      clientSecretLength: clientSecret.length,
      authHeaderLength: authHeader.length,
      authHeaderPreview: authHeader.substring(0, 20) + '...',
      redirectUri,
      hasCode: !!code,
      hasCodeVerifier: !!codeVerifier
    });

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
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
      console.error('Twitter token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error,
        redirectUri,
        hasCodeVerifier: !!codeVerifier,
        hasCode: !!code,
        clientId
      });
      return res.redirect(`${appUrl}/?twitter_error=token_exchange_failed&details=${encodeURIComponent(error.substring(0, 200))}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    console.log('Token exchange successful:', { hasAccessToken: !!access_token, hasRefreshToken: !!refresh_token, expiresIn: expires_in });

    // Get user info from Twitter (include profile_image_url and name)
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!userResponse.ok) {
      const userError = await userResponse.text();
      console.error('Failed to fetch Twitter user info:', userError);
      return res.redirect(`${appUrl}/?twitter_error=user_fetch_failed&details=${encodeURIComponent(userError.substring(0, 200))}`);
    }

    const userData = await userResponse.json();
    const { id: platformUserId, username: platformUsername, name: platformName, profile_image_url: platformAvatarUrl } = userData.data;

    console.log('Twitter user fetched:', { platformUserId, platformUsername, userId });

    // Store connection in Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const connectionData = {
      user_id: userId,
      platform: 'twitter',
      platform_user_id: platformUserId,
      platform_username: platformUsername,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: tokenExpiresAt,
      connected_at: new Date().toISOString()
    };

    console.log('Attempting to save connection:', { userId, platformUserId, platformUsername });

    const { data: insertedData, error: dbError } = await supabase
      .from('social_connections')
      .upsert(connectionData, {
        onConflict: 'user_id,platform'
      })
      .select();

    if (dbError) {
      console.error('Failed to store Twitter connection:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      return res.redirect(`${appUrl}/?twitter_error=db_save_failed&details=${encodeURIComponent(dbError.message)}`);
    }

    console.log('Connection saved successfully:', insertedData);

    // Also update users table with X profile fields
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        x_user_id: platformUserId,
        x_handle: platformUsername,
        x_name: platformName || null,
        x_avatar_url: platformAvatarUrl || null,
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Failed to update user X profile fields:', userUpdateError);
      // Non-fatal: connection was saved, profile fields are supplementary
    } else {
      console.log('User X profile fields updated:', { userId, platformUserId, platformUsername, platformName });
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
