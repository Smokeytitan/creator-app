import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const { code, state: userId, error: oauthError } = req.query;

    console.log('Instagram OAuth Callback:', {
      hasCode: !!code,
      userId,
      oauthError
    });

    if (oauthError) {
      console.error('Instagram OAuth error:', oauthError);
      return res.redirect(`/profile?instagram_error=${oauthError}`);
    }

    if (!code || !userId) {
      console.error('Missing code or userId');
      return res.redirect('/?instagram_error=missing_parameters');
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const productionUrl = process.env.PRODUCTION_URL || process.env.VERCEL_URL;
    const redirectUri = `https://${productionUrl}/api/oauth/instagram/callback`;

    console.log('Instagram - Exchanging code for token...');
    console.log('Redirect URI:', redirectUri);

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    console.log('Token exchange response:', {
      success: !!tokenData.access_token,
      hasError: !!tokenData.error
    });

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      return res.redirect(`/profile?instagram_error=token_exchange_failed&details=${encodeURIComponent(tokenData.error.message || tokenData.error)}`);
    }

    const accessToken = tokenData.access_token;

    // Get Facebook user's pages (needed to access Instagram Business accounts)
    console.log('Fetching Facebook pages...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    console.log('Pages response:', {
      hasPages: !!pagesData.data,
      pageCount: pagesData.data?.length
    });

    if (!pagesData.data || pagesData.data.length === 0) {
      return res.redirect('/?instagram_error=no_pages_found&details=No Facebook pages found. Connect a Facebook page to your Instagram Business account.');
    }

    // Get Instagram account connected to the first page
    const pageId = pagesData.data[0].id;
    const pageAccessToken = pagesData.data[0].access_token;

    console.log('Fetching Instagram account for page:', pageId);
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igAccountData = await igAccountResponse.json();

    console.log('Instagram account response:', {
      hasIgAccount: !!igAccountData.instagram_business_account
    });

    if (!igAccountData.instagram_business_account) {
      return res.redirect('/?instagram_error=no_instagram_account&details=No Instagram Business account found. Make sure your Instagram account is connected to your Facebook page.');
    }

    const instagramAccountId = igAccountData.instagram_business_account.id;

    // Get Instagram account details
    console.log('Fetching Instagram account details...');
    const igDetailsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username&access_token=${pageAccessToken}`
    );
    const igDetails = await igDetailsResponse.json();

    console.log('Instagram details:', {
      hasUsername: !!igDetails.username
    });

    // Store connection in Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    console.log('Saving Instagram connection to database...');

    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform: 'instagram',
        platform_user_id: instagramAccountId,
        platform_username: igDetails.username,
        access_token: pageAccessToken, // Store the page access token for API calls
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return res.redirect(`/profile?instagram_error=database_error&details=${encodeURIComponent(dbError.message)}`);
    }

    console.log('Instagram connection saved successfully');
    return res.redirect('/profile?instagram_connected=true');

  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return res.redirect(`/profile?instagram_error=callback_failed&details=${encodeURIComponent(error.message)}`);
  }
}
