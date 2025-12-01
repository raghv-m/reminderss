import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const progressRouter = Router();

// Get weekly breakdown
progressRouter.get('/weekly', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const now = new Date();
    // Get Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const { data: events } = await supabase
        .from('scheduled_events')
        .select('*, goals(type)')
        .eq('user_id', userId)
        .eq('date', dateStr);

      const gymEvent = events?.find(e => e.goals?.type === 'gym');
      const studyEvents = events?.filter(e => e.goals?.type === 'study') || [];
      
      const studyHours = studyEvents
        .filter(e => e.status === 'completed')
        .reduce((sum, e) => {
          const start = new Date(e.start_time);
          const end = new Date(e.end_time);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

      weeklyData.push({
        day: days[i],
        date: dateStr,
        gym: gymEvent?.status === 'completed',
        study: Math.round(studyHours * 10) / 10,
        isPast: date < now,
        isToday: dateStr === now.toISOString().split('T')[0],
      });
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Weekly progress error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
});

// Get monthly heatmap
progressRouter.get('/monthly', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const firstDayStr = firstDay.toISOString().split('T')[0];
    const lastDayStr = lastDay.toISOString().split('T')[0];

    const { data: events } = await supabase
      .from('scheduled_events')
      .select('date, status')
      .eq('user_id', userId)
      .gte('date', firstDayStr)
      .lte('date', lastDayStr);

    // Group events by date
    const eventsByDate: Record<string, { total: number; completed: number }> = {};
    events?.forEach(e => {
      if (!eventsByDate[e.date]) {
        eventsByDate[e.date] = { total: 0, completed: 0 };
      }
      eventsByDate[e.date].total++;
      if (e.status === 'completed') {
        eventsByDate[e.date].completed++;
      }
    });

    const daysInMonth = lastDay.getDate();
    const monthlyData = [];
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = eventsByDate[dateStr];
      
      monthlyData.push({
        day,
        date: dateStr,
        completed: dayData ? dayData.completed === dayData.total && dayData.total > 0 : false,
        partial: dayData ? dayData.completed > 0 && dayData.completed < dayData.total : false,
        hasEvents: dayData ? dayData.total > 0 : false,
        isPast: date < now,
        isToday: dateStr === now.toISOString().split('T')[0],
      });
    }

    res.json({
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
      startDayOfWeek: firstDayOfWeek,
      days: monthlyData,
    });
  } catch (error) {
    console.error('Monthly progress error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly progress' });
  }
});

