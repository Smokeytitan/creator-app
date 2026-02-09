/**
 * API Route: POST update a user's role
 * POST /api/admin/users/role
 *
 * Admin-only: validates Clerk token and checks admin role.
 * Body: { userId, role } where role is 'admin' or 'creator'
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';
import { handleCors } from '../../_cors.js';

export default async function handler(req, res) {
  if (!handleCors(req, res, { methods: 'POST, OPTIONS' })) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Check admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      return res.status(403).json({ error: 'Forbidden - user not found' });
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!role || !['admin', 'creator'].includes(role)) {
      return res.status(400).json({ error: 'role must be "admin" or "creator"' });
    }

    // Prevent demoting yourself
    if (userId === adminUserId && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, email, full_name, role')
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return res.status(500).json({ error: 'Failed to update role', details: updateError.message });
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User role updated:', userId, 'to', role, 'by admin:', adminUserId);

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error in admin/users/role:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
