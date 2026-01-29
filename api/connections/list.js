import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

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
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
