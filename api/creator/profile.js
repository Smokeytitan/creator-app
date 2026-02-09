/**
 * API Route: GET creator profile
 * GET /api/creator/profile
 *
 * Returns authenticated user's profile data from users table
 * plus social connection data from social_connections table.
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';
import { handleCors } from '../_cors.js';

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

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, creator_id, approved, approved_at, approved_by, x_user_id, x_handle, x_name, x_avatar_url, telegram_chat_id, telegram_username, notify_opt_in, polygon_wallet_address')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({ error: 'Failed to fetch profile', details: userError.message });
    }

    // If user doesn't exist yet (webhook may not have fired), create them
    if (!user) {
      // Auto-approve specific emails
      const autoApproveEmails = [
        'lstern@polygon.technology',
      ];

      // Get email from Clerk token claims
      const email = payload.email || payload.unsafe_metadata?.email || '';
      const shouldAutoApprove = autoApproveEmails.includes(email.toLowerCase());

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email,
          approved: shouldAutoApprove,
          ...(shouldAutoApprove ? { approved_at: new Date().toISOString() } : {}),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user: newUser, connections: [] });
    }

    // Fetch social connections
    const { data: connections, error: connectionsError } = await supabase
      .from('social_connections')
      .select('id, platform, platform_user_id, platform_username, token_expires_at, connected_at')
      .eq('user_id', userId);

    if (connectionsError) {
      console.error('Error fetching social connections:', connectionsError);
      // Non-fatal: return profile without connections
    }

    return res.json({
      user,
      connections: connections || []
    });
  } catch (error) {
    console.error('Error in creator/profile:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
