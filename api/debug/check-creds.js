export default async function handler(req, res) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  return res.json({
    clientId: {
      length: clientId?.length || 0,
      hasNewline: clientId?.includes('\n'),
      hasCarriageReturn: clientId?.includes('\r'),
      charCodes: Array.from(clientId || '').slice(-3).map(c => c.charCodeAt(0))
    },
    clientSecret: {
      length: clientSecret?.length || 0,
      hasNewline: clientSecret?.includes('\n'),
      hasCarriageReturn: clientSecret?.includes('\r'),
      charCodes: Array.from(clientSecret || '').slice(-3).map(c => c.charCodeAt(0))
    }
  });
}
