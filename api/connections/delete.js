import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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
    const { platform } = req.query;

    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter required' });
    }

    // Delete from Supabase with service key (secure)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      console.error('Error deleting connection:', error);
      return res.status(500).json({ error: 'Failed to delete connection' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error in connections/delete:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
