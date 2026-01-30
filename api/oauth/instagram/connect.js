export default async function handler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const productionUrl = process.env.PRODUCTION_URL || process.env.VERCEL_URL;
    const redirectUri = `https://${productionUrl}/api/oauth/instagram/callback`;

    // Instagram uses Facebook OAuth
    // Scopes: instagram_basic for profile, instagram_content_publish for posts
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'instagram_basic,instagram_content_publish,pages_show_list,instagram_manage_insights');
    authUrl.searchParams.append('state', userId);
    authUrl.searchParams.append('response_type', 'code');

    console.log('Instagram OAuth - Redirect URI:', redirectUri);
    console.log('Instagram OAuth - Auth URL:', authUrl.toString());

    return res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    return res.status(500).json({
      error: 'Failed to initiate Instagram connection',
      details: error.message
    });
  }
}
