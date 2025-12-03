import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { calculateShiftPayroll, generatePayrollSummary, calculateShiftHours } from '../services/payroll.js';
import { calculateWorkingHours } from '../services/accomplishments.js';

export const payrollRouter = Router();

// Get payroll summary for a period
payrollRouter.get('/summary', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { periodType = 'monthly', startDate, endDate } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let periodStart: Date;
    let periodEnd: Date;

    if (startDate && endDate) {
      periodStart = new Date(startDate as string);
      periodEnd = new Date(endDate as string);
    } else {
      // Default to current period
      const now = new Date();
      if (periodType === 'weekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay()); // Start of week
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
      } else if (periodType === 'biweekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay() - 7);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 13);
      } else {
        // Monthly
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    const summary = await generatePayrollSummary(userId, periodStart, periodEnd, periodType as 'weekly' | 'biweekly' | 'monthly');
    res.json(summary);
  } catch (error) {
    console.error('Payroll summary error:', error);
    res.status(500).json({ error: 'Failed to generate payroll summary' });
  }
});

// Calculate and update payroll for a shift
payrollRouter.post('/shifts/:shiftId/calculate', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { shiftId } = req.params;
  const { hourlyRate } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get shift
    const { data: shift } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .eq('user_id', userId)
      .single();

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const rate = hourlyRate || shift.hourly_rate;
    if (!rate) {
      return res.status(400).json({ error: 'Hourly rate required' });
    }

    const hours = calculateShiftHours(shift.start_time, shift.end_time);
    const payroll = await calculateShiftPayroll(userId, shiftId, hours, rate);

    res.json(payroll);
  } catch (error) {
    console.error('Payroll calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
});

// Get working hours summary
payrollRouter.get('/hours', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { days = '30' } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const hours = await calculateWorkingHours(userId, startDate, endDate);
    res.json(hours);
  } catch (error) {
    console.error('Working hours error:', error);
    res.status(500).json({ error: 'Failed to calculate working hours' });
  }
});

// Update user's default hourly rate and location
payrollRouter.patch('/settings', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { hourlyRate, provinceState, country } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const updates: any = {};
    if (hourlyRate !== undefined) updates.default_hourly_rate = hourlyRate;
    if (provinceState !== undefined) updates.province_state = provinceState;
    if (country !== undefined) updates.country = country;

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
    res.status(500).json({ error: 'Failed to update payroll settings' });
  }
});

