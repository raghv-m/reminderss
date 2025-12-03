import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getFreeBusySlots, createCalendarEvent } from '../lib/google.js';
import { scheduleDay } from '../services/scheduler.js';

export const calendarRouter = Router();

// Get today's schedule
calendarRouter.get('/today', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: events, error } = await supabase
      .from('scheduled_events')
      .select('*, goals(*)')
      .eq('user_id', userId)
      .eq('date', today)
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Trigger schedule generation for today
calendarRouter.post('/generate', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const events = await scheduleDay(userId, new Date());
    res.json({ 
      success: true, 
      events,
      message: events.length > 0 
        ? `Generated ${events.length} scheduled events! They've been synced to your Google Calendar.`
        : 'No events scheduled. Make sure you have active goals and available time slots.'
    });
  } catch (error: any) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate schedule',
      events: []
    });
  }
});

// Get free slots for a specific date
calendarRouter.get('/free-slots', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { date } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('google_refresh_token')
      .eq('id', userId)
      .single();

    if (!user?.google_refresh_token) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const targetDate = date ? new Date(date as string) : new Date();
    const busySlots = await getFreeBusySlots(user.google_refresh_token, targetDate);
    
    // Calculate free slots
    const freeSlots = calculateFreeSlots(busySlots, targetDate);

    res.json({ busy: busySlots, free: freeSlots });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark event as completed
calendarRouter.post('/events/:eventId/complete', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { eventId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: event, error } = await supabase
      .from('scheduled_events')
      .update({ status: 'completed' })
      .eq('id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

function calculateFreeSlots(
  busySlots: { start: Date; end: Date }[],
  date: Date
): { start: string; end: string }[] {
  const freeSlots: { start: string; end: string }[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0); // Start at 6 AM
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0); // End at 10 PM

  let currentTime = dayStart;

  for (const busy of busySlots.sort((a, b) => a.start.getTime() - b.start.getTime())) {
    if (busy.start > currentTime) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: busy.start.toISOString()
      });
    }
    currentTime = busy.end > currentTime ? busy.end : currentTime;
  }

  if (currentTime < dayEnd) {
    freeSlots.push({
      start: currentTime.toISOString(),
      end: dayEnd.toISOString()
    });
  }

  return freeSlots;
}

