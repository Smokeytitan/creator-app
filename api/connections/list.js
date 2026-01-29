import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
      return res.status(500).json({ error: 'Failed to load connections', details: error.message });
    }

    console.log('Loaded connections for user:', userId, 'count:', data?.length);

    return res.json({ connections: data || [] });
  } catch (error) {
    console.error('Error in connections/list:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
