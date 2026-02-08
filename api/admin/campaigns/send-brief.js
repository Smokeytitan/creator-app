/**
 * API Route: POST send campaign brief via Telegram
 * POST /api/admin/campaigns/send-brief
 *
 * Admin-only: validates Clerk token and checks admin role.
 * Sends campaign brief + media to assigned creators via Telegram.
 * Body: { campaignId }
 *
 * Flow:
 * 1. Fetch campaign (title, brief, media_urls)
 * 2. Fetch assigned creators via campaign_creators -> creators.id
 * 3. For each creator, find linked user via users.creator_id
 * 4. For users with telegram_chat_id AND notify_opt_in: send brief + media
 * 5. Update campaigns.brief_sent_at
 * 6. Return { sent, failed, total }
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';
import { handleCors } from '../../_cors.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Send a text message via Telegram Bot API.
 */
async function sendTelegramMessage(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
  return response.ok;
}

/**
 * Send a single photo via Telegram Bot API.
 */
async function sendTelegramPhoto(chatId, photoUrl, caption) {
  const body = { chat_id: chatId, photo: photoUrl };
  if (caption) body.caption = caption;

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
}

/**
 * Send a single video via Telegram Bot API.
 */
async function sendTelegramVideo(chatId, videoUrl, caption) {
  const body = { chat_id: chatId, video: videoUrl };
  if (caption) body.caption = caption;

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
}

/**
 * Send a media group (multiple photos/videos) via Telegram Bot API.
 */
async function sendTelegramMediaGroup(chatId, mediaItems, caption) {
  const media = mediaItems.map((url, index) => {
    const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
    const item = {
      type: isVideo ? 'video' : 'photo',
      media: url,
    };
    // Only first item gets the caption
    if (index === 0 && caption) {
      item.caption = caption;
    }
    return item;
  });

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      media,
    }),
  });
  return response.ok;
}

/**
 * Determine if a URL points to a video file by extension.
 */
function isVideoUrl(url) {
  return /\.(mp4|mov|avi|webm)$/i.test(url);
}

/**
 * Send campaign brief and media to a single Telegram chat.
 * Returns true on success, false on failure.
 */
async function sendBriefToChat(chatId, campaign) {
  try {
    const briefText = `*${campaign.title}*\n\n${campaign.brief || 'No brief text provided.'}`;
    const mediaUrls = campaign.media_urls || [];

    if (mediaUrls.length === 0) {
      // Text-only brief
      return await sendTelegramMessage(chatId, briefText);
    }

    if (mediaUrls.length === 1) {
      // Single media item with caption
      const url = mediaUrls[0];
      if (isVideoUrl(url)) {
        return await sendTelegramVideo(chatId, url, briefText);
      } else {
        return await sendTelegramPhoto(chatId, url, briefText);
      }
    }

    // Multiple media items: send as media group
    return await sendTelegramMediaGroup(chatId, mediaUrls, briefText);
  } catch (error) {
    console.error(`Error sending brief to chat ${chatId}:`, error);
    return false;
  }
}

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

    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });
    }

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
      console.error('Error fetching admin user:', adminError);
      return res.status(403).json({ error: 'Forbidden - user not found' });
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }

    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    // 1. Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, title, brief, media_urls')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Error fetching campaign:', campaignError);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // 2. Fetch assigned creator IDs via campaign_creators
    const { data: campaignCreators, error: ccError } = await supabase
      .from('campaign_creators')
      .select('creator_id')
      .eq('campaign_id', campaignId);

    if (ccError) {
      console.error('Error fetching campaign creators:', ccError);
      return res.status(500).json({ error: 'Failed to fetch assigned creators', details: ccError.message });
    }

    if (!campaignCreators || campaignCreators.length === 0) {
      return res.json({ sent: 0, failed: 0, total: 0, message: 'No creators assigned to this campaign' });
    }

    const creatorIds = campaignCreators.map(cc => cc.creator_id);

    // 3. Find linked users for these creators
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, creator_id, telegram_chat_id, notify_opt_in')
      .in('creator_id', creatorIds);

    if (usersError) {
      console.error('Error fetching users for creators:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users', details: usersError.message });
    }

    // 4. Filter to users with Telegram linked AND opted in
    const eligibleUsers = (users || []).filter(u => u.telegram_chat_id && u.notify_opt_in === true);
    const total = eligibleUsers.length;
    let sent = 0;
    let failed = 0;

    // Send brief to each eligible user
    for (const user of eligibleUsers) {
      const success = await sendBriefToChat(user.telegram_chat_id, campaign);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    // 5. Update campaigns.brief_sent_at
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ brief_sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating brief_sent_at:', updateError);
      // Non-fatal: messages were already sent
    }

    console.log(`Brief sent for campaign ${campaignId}: ${sent}/${total} sent, ${failed} failed`);

    // 6. Return results
    return res.json({ sent, failed, total });
  } catch (error) {
    console.error('Error in admin/campaigns/send-brief:', error);
    if (error.message?.includes('token')) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
