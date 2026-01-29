import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, platform } = req.query;

    if (!userId || !platform) {
      return res.status(400).json({ error: 'userId and platform parameters required' });
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
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
