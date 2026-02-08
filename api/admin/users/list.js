/**
 * API Route: GET list users for admin
 * GET /api/admin/users/list
 *
 * Admin-only: validates Clerk token and checks admin role in users table.
 * Returns all users with approval status, linked creator info, ordered by created_at desc.
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

    const adminUserId = payload.sub;

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check admin role in users table
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error('Error fetching admin user:', adminError);
      return res.status(403).json({ error: 'Forbidden - user not found' });
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    // Fetch all users ordered by created_at desc
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, creator_id, approved, approved_at, approved_by, x_user_id, x_handle, x_name, x_avatar_url, telegram_chat_id, telegram_username, notify_opt_in, polygon_wallet_address, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }

    return res.json({ users: users || [] });
  } catch (error) {
    console.error('Error in admin/users/list:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
