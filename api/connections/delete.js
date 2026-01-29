import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - missing token' });
    }

    const token = authHeader.substring(7);

    // Verify the Clerk session token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = payload.sub;
    const { platform } = req.query;

    if (!platform) {
      return res.status(400).json({ error: 'platform parameter required' });
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
      return res.status(500).json({ error: 'Failed to delete connection', details: error.message });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error in connections/delete:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
