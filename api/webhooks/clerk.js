import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Note: Webhooks are called by external services (Clerk), not browsers
  // CORS is not required since authentication is via signature verification
  // Preflight handled for testing purposes only
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, svix-id, svix-timestamp, svix-signature');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not set');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get Svix headers
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let payload;

    try {
      payload = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle user.created event
    if (payload.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, public_metadata } = payload.data;

      // Create Supabase client with service role key
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Get primary email
      const primaryEmail = email_addresses.find(email => email.id === payload.data.primary_email_address_id);
      const email = primaryEmail?.email_address || email_addresses[0]?.email_address;

      if (!email) {
        console.error('No email found for user:', id);
        return res.status(400).json({ error: 'No email found' });
      }

      // Build full name
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

      // Determine role and approval status
      const role = public_metadata?.role || 'creator';
      const isAdmin = role === 'admin' || role === 'ADMIN';

      // Auto-approve and auto-admin specific emails (e.g. team members)
      const autoAdminEmails = [
        'lstern@polygon.technology',
        'sdeahl@polygon.technology',
      ];
      const isAutoAdmin = autoAdminEmails.includes(email.toLowerCase());
      const shouldAutoApprove = isAdmin || isAutoAdmin;

      // Insert user into Supabase
      // Admins and whitelisted emails are auto-approved; others default to not approved
      const { data, error } = await supabase
        .from('users')
        .insert({
          id,
          email,
          full_name: fullName,
          role: isAutoAdmin ? 'admin' : role,
          approved: shouldAutoApprove,
          ...(shouldAutoApprove ? { approved_at: new Date().toISOString() } : {}),
        });

      if (error) {
        console.error('Error inserting user into Supabase:', error);
        return res.status(500).json({ error: 'Failed to sync user', details: error.message });
      }

      console.log('Successfully synced user to Supabase:', id, email);
      return res.status(200).json({ success: true, userId: id });
    }

    // Handle user.updated event
    if (payload.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, public_metadata } = payload.data;

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      const primaryEmail = email_addresses.find(email => email.id === payload.data.primary_email_address_id);
      const email = primaryEmail?.email_address || email_addresses[0]?.email_address;
      const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

      const { error } = await supabase
        .from('users')
        .update({
          email,
          full_name: fullName,
          role: public_metadata?.role || 'creator',
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating user in Supabase:', error);
        return res.status(500).json({ error: 'Failed to update user', details: error.message });
      }

      console.log('Successfully updated user in Supabase:', id);
      return res.status(200).json({ success: true, userId: id });
    }

    // Handle user.deleted event
    if (payload.type === 'user.deleted') {
      const { id } = payload.data;

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user from Supabase:', error);
        return res.status(500).json({ error: 'Failed to delete user', details: error.message });
      }

      console.log('Successfully deleted user from Supabase:', id);
      return res.status(200).json({ success: true, userId: id });
    }

    // For other event types, just acknowledge
    return res.status(200).json({ success: true, type: payload.type });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
