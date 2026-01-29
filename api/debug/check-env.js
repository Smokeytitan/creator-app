export default async function handler(req, res) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  return res.json({
    hasClientId: !!clientId,
    clientIdLength: clientId?.length || 0,
    clientIdPreview: clientId?.substring(0, 10) + '...',
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    clientSecretPreview: clientSecret?.substring(0, 10) + '...'
  });
}
