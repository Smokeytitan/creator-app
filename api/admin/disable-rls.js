import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Disable RLS for social_connections table
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      // Try direct query if RPC doesn't work
      const { error: directError } = await supabase
        .from('social_connections')
        .select('id')
        .limit(1);

      return res.json({
        message: 'RLS might already be disabled or query works',
        error: directError ? directError.message : null
      });
    }

    return res.json({ success: true, message: 'RLS disabled for social_connections' });
  } catch (error) {
    return res.json({ error: error.message, hint: 'Run this SQL manually in Supabase: ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;' });
  }
}
