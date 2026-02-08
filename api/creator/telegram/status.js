/**
 * API Route: GET check Telegram link status
 * GET /api/creator/telegram/status
 *
 * Checks whether the authenticated user has a linked Telegram account.
 * Returns: { connected: boolean, username: string | null }
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';
import { handleCors } from '../../_cors.js';

export default async function handler(req, res) {
  // Handle CORS and preflight
  if (!handleCors(req, res, { methods: 'GET, OPTIONS' })) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Clerk session token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - missing token' });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = payload.sub;

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: user, error } = await supabase
      .from('users')
      .select('telegram_chat_id, telegram_username')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking Telegram status:', error);
      return res.status(500).json({ error: 'Failed to check status', details: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      connected: !!user.telegram_chat_id,
      username: user.telegram_username || null
    });
  } catch (error) {
    console.error('Error in creator/telegram/status:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
