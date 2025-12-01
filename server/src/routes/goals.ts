import { Router } from 'express';
import { supabase, Goal } from '../lib/supabase.js';

export const goalsRouter = Router();

// Get all goals for user
goalsRouter.get('/', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('priority', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new goal
goalsRouter.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { type, name, weekly_target, daily_hours, preferred_times, priority } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        type,
        name,
        weekly_target,
        daily_hours,
        preferred_times: preferred_times || [],
        priority: priority || 1,
        active: true
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a goal
goalsRouter.patch('/:goalId', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { goalId } = req.params;
  const updates = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: goal, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete (deactivate) a goal
goalsRouter.delete('/:goalId', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { goalId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { error } = await supabase
      .from('goals')
      .update({ active: false })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get check-ins for a goal
goalsRouter.get('/:goalId/checkins', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { goalId } = req.params;
  const { days = '30' } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const { data: checkins, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

