import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check if tables exist and get some data
    const [usersResult, connectionsResult] = await Promise.all([
      supabase.from('users').select('id, email, role').limit(5),
      supabase.from('social_connections').select('*').limit(5)
    ]);

    return res.json({
      users: {
        exists: !usersResult.error,
        error: usersResult.error?.message,
        count: usersResult.data?.length || 0,
        data: usersResult.data
      },
      connections: {
        exists: !connectionsResult.error,
        error: connectionsResult.error?.message,
        count: connectionsResult.data?.length || 0,
        data: connectionsResult.data
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
