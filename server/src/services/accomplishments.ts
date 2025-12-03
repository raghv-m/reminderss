import { supabase } from '../lib/supabase.js';

/**
 * Track accomplishment for a goal
 */
export async function trackAccomplishment(
  userId: string,
  goalId: string,
  date: string,
  hoursCompleted: number,
  completed: boolean = true,
  notes?: string
) {
  const { data, error } = await supabase
    .from('accomplishments')
    .upsert({
      user_id: userId,
      goal_id: goalId,
      date,
      hours_completed: hoursCompleted,
      completed,
      notes
    }, { onConflict: 'user_id,goal_id,date' })
    .select()
    .single();

  if (error) {
    console.error('Error tracking accomplishment:', error);
    throw error;
  }

  return data;
}

/**
 * Get user accomplishments summary
 */
export async function getAccomplishmentsSummary(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: accomplishments } = await supabase
    .from('accomplishments')
    .select('*, goals(*)')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (!accomplishments) return null;

  // Calculate totals
  const totalHours = accomplishments.reduce((sum, acc) => sum + (acc.hours_completed || 0), 0);
  const totalCompleted = accomplishments.filter(acc => acc.completed).length;
  const byGoalType = accomplishments.reduce((acc, item) => {
    const type = item.goals?.type || 'custom';
    if (!acc[type]) {
      acc[type] = { count: 0, hours: 0 };
    }
    acc[type].count++;
    acc[type].hours += item.hours_completed || 0;
    return acc;
  }, {} as Record<string, { count: number; hours: number }>);

  return {
    totalHours,
    totalCompleted,
    totalDays: days,
    byGoalType,
    accomplishments
  };
}

/**
 * Calculate working hours from shifts and goals
 */
export async function calculateWorkingHours(userId: string, startDate: Date, endDate: Date) {
  // Get shifts
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  // Get accomplishments (work goals)
  const { data: accomplishments } = await supabase
    .from('accomplishments')
    .select('*, goals!inner(*)')
    .eq('user_id', userId)
    .eq('goals.type', 'work')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  let shiftHours = 0;
  if (shifts) {
    shiftHours = shifts.reduce((sum, shift) => {
      return sum + (shift.total_hours || calculateHours(shift.start_time, shift.end_time));
    }, 0);
  }

  let goalHours = 0;
  if (accomplishments) {
    goalHours = accomplishments.reduce((sum, acc) => sum + (acc.hours_completed || 0), 0);
  }

  return {
    shiftHours,
    goalHours,
    totalHours: shiftHours + goalHours,
    shiftCount: shifts?.length || 0,
    goalDays: accomplishments?.length || 0
  };
}

function calculateHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
}

