import { Router } from 'express';
import { getAuthUrl, getTokensFromCode, oauth2Client } from '../lib/google.js';
import { supabase } from '../lib/supabase.js';
import { google } from 'googleapis';

export const authRouter = Router();

// Get Google OAuth URL
authRouter.get('/google/url', (req, res) => {
  const url = getAuthUrl();
  res.json({ url });
});

// Google OAuth callback
authRouter.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=No code provided`);
  }

  try {
    const tokens = await getTokensFromCode(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Upsert user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        email: userInfo.email,
        name: userInfo.name || userInfo.email?.split('@')[0],
        google_refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Database error`);
    }

    // Redirect to frontend with user ID
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?userId=${user.id}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=OAuth failed`);
  }
});

// Get current user
authRouter.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, timezone, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
authRouter.patch('/me', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { phone, timezone, name, provinceState, country, defaultHourlyRate } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const updates: any = {
      phone,
      timezone,
      name,
      updated_at: new Date().toISOString()
    };

    if (provinceState !== undefined) updates.province_state = provinceState;
    if (country !== undefined) updates.country = country;
    if (defaultHourlyRate !== undefined) updates.default_hourly_rate = defaultHourlyRate;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout (clear session on server side if needed)
authRouter.post('/logout', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  // Optionally invalidate tokens or clear server-side session
  // For now, just acknowledge logout
  res.json({ success: true, message: 'Logged out successfully' });
});

