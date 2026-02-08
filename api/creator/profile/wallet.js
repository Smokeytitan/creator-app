/**
 * API Route: POST update wallet address
 * POST /api/creator/profile/wallet
 *
 * Updates the authenticated user's polygon_wallet_address.
 * Body: { walletAddress }
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
    const { walletAddress } = req.body;

    if (walletAddress !== null && walletAddress !== undefined && typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'walletAddress must be a string or null' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('users')
      .update({ polygon_wallet_address: walletAddress || null })
      .eq('id', userId)
      .select('id, polygon_wallet_address')
      .single();

    if (error) {
      console.error('Error updating wallet address:', error);
      return res.status(500).json({ error: 'Failed to update wallet address', details: error.message });
    }

    return res.json({ success: true, user: data });
  } catch (error) {
    console.error('Error in creator/profile/wallet:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
