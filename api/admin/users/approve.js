/**
 * API Route: POST approve a creator
 * POST /api/admin/users/approve
 *
 * Admin-only: validates Clerk token and checks admin role.
 * Approves a user and links their creator_id.
 * Body: { userId, creatorId }
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

    const { userId, creatorId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!creatorId) {
      return res.status(400).json({ error: 'creatorId is required' });
    }

    // Approve the user and link their creator_id
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: adminUserId,
        creator_id: creatorId,
      })
      .eq('id', userId)
      .select('id, email, full_name, approved, approved_at, approved_by, creator_id')
      .single();

    if (updateError) {
      console.error('Error approving user:', updateError);
      return res.status(500).json({ error: 'Failed to approve user', details: updateError.message });
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User approved:', userId, 'by admin:', adminUserId, 'creator_id:', creatorId);

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error in admin/users/approve:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
