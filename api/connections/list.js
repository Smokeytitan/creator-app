import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Clerk session token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionToken = authHeader.substring(7);

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(sessionToken);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userId = session.userId;

    // Query Supabase with service key (secure)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('social_connections')
      .select('id, platform, platform_user_id, platform_username, token_expires_at, connected_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading connections:', error);
      return res.status(500).json({ error: 'Failed to load connections' });
    }

    return res.json({ connections: data || [] });
  } catch (error) {
    console.error('Error in connections/list:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
