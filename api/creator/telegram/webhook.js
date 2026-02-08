/**
 * API Route: POST receive Telegram bot updates
 * POST /api/creator/telegram/webhook
 *
 * Receives webhook updates from Telegram bot.
 * Handles /start CODE for account linking and /start for welcome message.
 * Authenticates via X-Telegram-Bot-Api-Secret-Token header.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Send a message to a Telegram chat via the Bot API.
 */
async function sendTelegramMessage(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram sendMessage failed:', errorData);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

/**
 * Handle a linking code: find the user, link the Telegram account,
 * and send a confirmation or error message.
 */
async function handleLinkingCode(supabase, code, chatId, username) {
  // Find user with matching, non-expired linking code
  const { data: users, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_linking_code', code)
    .gt('telegram_code_expiry', new Date().toISOString())
    .limit(1);

  if (findError) {
    console.error('Error finding user by linking code:', findError);
    await sendTelegramMessage(chatId, 'Something went wrong. Please try again later.');
    return;
  }

  if (!users || users.length === 0) {
    await sendTelegramMessage(
      chatId,
      'Invalid or expired code. Please generate a new code from your profile.'
    );
    return;
  }

  const user = users[0];

  // Link the Telegram account and clear the linking code
  const { error: updateError } = await supabase
    .from('users')
    .update({
      telegram_chat_id: chatId.toString(),
      telegram_username: username || null,
      telegram_linking_code: null,
      telegram_code_expiry: null,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error linking Telegram account:', updateError);
    await sendTelegramMessage(chatId, 'Failed to link your account. Please try again.');
    return;
  }

  await sendTelegramMessage(
    chatId,
    'Account linked successfully!\n\nYou\'ll now receive notifications for campaign briefs and updates.'
  );
}

export default async function handler(req, res) {
  // Telegram webhook only uses POST; handle OPTIONS for testing
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Bot-Api-Secret-Token');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers['x-telegram-bot-api-secret-token'];
    const expectedSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const update = req.body;

    // Only handle messages with text
    if (!update.message || !update.message.text) {
      return res.json({ ok: true });
    }

    const message = update.message;
    const text = message.text.trim();
    const chatId = message.chat.id;
    const username = message.from?.username;

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Handle /start with a linking code
    if (text.startsWith('/start ')) {
      const code = text.substring(7).trim().toUpperCase();
      await handleLinkingCode(supabase, code, chatId, username);
    }
    // Handle bare /start
    else if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        'Welcome to the Creator Portal!\n\nTo link your account:\n1. Go to your Creator Portal profile\n2. Click "Link Telegram"\n3. Send the code here'
      );
    }
    // Handle raw 6-character alphanumeric code
    else if (/^[A-Z0-9]{6}$/.test(text.toUpperCase())) {
      await handleLinkingCode(supabase, text.toUpperCase(), chatId, username);
    }
    // Unknown input
    else {
      await sendTelegramMessage(
        chatId,
        'I didn\'t understand that. Send me your 6-character linking code from your profile, or use /start to get started.'
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
