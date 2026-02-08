/**
 * API Route: POST toggle notification opt-in
 * POST /api/creator/telegram/preferences
 *
 * Updates the authenticated user's notify_opt_in preference.
 * Body: { notifyOptIn: boolean }
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';
import { handleCors } from '../../_cors.js';

export default async function handler(req, res) {
  // Handle CORS and preflight
  if (!handleCors(req, res, { methods: 'POST, OPTIONS' })) {
    return;
  }

  if (req.method !== 'POST') {
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
    const { notifyOptIn } = req.body;

    if (typeof notifyOptIn !== 'boolean') {
      return res.status(400).json({ error: 'notifyOptIn must be a boolean' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('users')
      .update({ notify_opt_in: notifyOptIn })
      .eq('id', userId)
      .select('id, notify_opt_in')
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return res.status(500).json({ error: 'Failed to update preferences', details: error.message });
    }

    return res.json({ success: true, user: data });
  } catch (error) {
    console.error('Error in creator/telegram/preferences:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
