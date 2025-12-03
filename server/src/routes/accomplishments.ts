import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { trackAccomplishment, getAccomplishmentsSummary } from '../services/accomplishments.js';

export const accomplishmentsRouter = Router();

// Track an accomplishment
accomplishmentsRouter.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { goalId, date, hoursCompleted, completed, notes } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const accomplishment = await trackAccomplishment(
      userId,
      goalId,
      date,
      hoursCompleted || 0,
      completed !== false,
      notes
    );

    res.json(accomplishment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to track accomplishment' });
  }
});

// Get accomplishments summary
accomplishmentsRouter.get('/summary', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { days = '30' } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const summary = await getAccomplishmentsSummary(userId, parseInt(days as string));
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get accomplishments' });
  }
});

