import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const statsRouter = Router();

// Get user stats (streak, gym count, study hours, completion rate)
statsRouter.get('/', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get start of current week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Get last 30 days for completion rate
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Fetch goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, type, weekly_target, daily_hours')
      .eq('user_id', userId)
      .eq('active', true);

    // Fetch this week's scheduled events
    const { data: weekEvents } = await supabase
      .from('scheduled_events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', today);

    // Fetch last 30 days events for completion rate
    const { data: monthEvents } = await supabase
      .from('scheduled_events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgoStr);

    // Calculate streak
    const streak = await calculateStreak(userId);
    const longestStreak = await getLongestStreak(userId);

    // Calculate gym sessions this week
    const gymGoal = goals?.find(g => g.type === 'gym');
    const gymEvents = weekEvents?.filter(e => 
      goals?.find(g => g.id === e.goal_id && g.type === 'gym')
    ) || [];
    const gymCompleted = gymEvents.filter(e => e.status === 'completed').length;
    const gymTarget = gymGoal?.weekly_target || 5;

    // Calculate study hours this week
    const studyGoal = goals?.find(g => g.type === 'study');
    const studyEvents = weekEvents?.filter(e => 
      goals?.find(g => g.id === e.goal_id && g.type === 'study')
    ) || [];
    const studyHours = studyEvents
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => {
        const start = new Date(e.start_time);
        const end = new Date(e.end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
    const studyTarget = (studyGoal?.daily_hours || 4) * 7;

    // Calculate completion rate
    const totalEvents = monthEvents?.length || 0;
    const completedEvents = monthEvents?.filter(e => e.status === 'completed').length || 0;
    const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

    res.json({
      streak: {
        current: streak,
        longest: longestStreak,
      },
      gym: {
        completed: gymCompleted,
        target: gymTarget,
        remaining: Math.max(0, gymTarget - gymCompleted),
      },
      study: {
        hours: Math.round(studyHours * 10) / 10,
        target: studyTarget,
      },
      completionRate: {
        value: completionRate,
        totalEvents,
        completedEvents,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

async function calculateStreak(userId: string): Promise<number> {
  let streak = 0;
  let date = new Date();
  
  while (true) {
    const dateStr = date.toISOString().split('T')[0];
    
    const { data: events } = await supabase
      .from('scheduled_events')
      .select('status')
      .eq('user_id', userId)
      .eq('date', dateStr);
    
    if (!events || events.length === 0) {
      // No events scheduled for this day, check previous day
      date.setDate(date.getDate() - 1);
      if (streak === 0) continue; // Skip days with no events at start
      break;
    }
    
    const allCompleted = events.every(e => e.status === 'completed' || e.status === 'skipped');
    if (allCompleted) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
    
    if (streak > 365) break; // Safety limit
  }
  
  return streak;
}

async function getLongestStreak(userId: string): Promise<number> {
  // For now, return current streak as longest (can be enhanced with historical tracking)
  return await calculateStreak(userId);
}

