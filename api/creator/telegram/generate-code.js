/**
 * API Route: POST generate Telegram linking code
 * POST /api/creator/telegram/generate-code
 *
 * Generates a 6-character alphanumeric code (A-Z, 0-9) and stores it
 * in the users table with a 15-minute expiry.
 * Returns: { code, expiresAt }
 */

import crypto from 'crypto';
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

    // Generate a 6-character alphanumeric code (hex -> uppercase = A-F, 0-9)
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Set expiry to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('users')
      .update({
        telegram_linking_code: code,
        telegram_code_expiry: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error storing Telegram linking code:', error);
      return res.status(500).json({ error: 'Failed to generate code', details: error.message });
    }

    return res.json({
      success: true,
      code,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error in creator/telegram/generate-code:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
