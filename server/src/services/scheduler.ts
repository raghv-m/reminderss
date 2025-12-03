import { supabase, Goal, ScheduledEvent } from '../lib/supabase.js';
import { getFreeBusySlots, createCalendarEvent } from '../lib/google.js';

interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

interface ScheduledGoal {
  goal: Goal;
  startTime: Date;
  endTime: Date;
  relaxationTime: number; // minutes after this goal
}

// Optimal time ranges for different goal types (24-hour format)
const OPTIMAL_TIMES: Record<string, { start: number; end: number }[]> = {
  gym: [
    { start: 6, end: 9 },   // Morning workout
    { start: 17, end: 20 }, // Evening workout
  ],
  study: [
    { start: 6, end: 10 },  // Early morning focus
    { start: 14, end: 18 }, // Afternoon study
    { start: 19, end: 22 }, // Evening study
  ],
  work: [
    { start: 9, end: 17 },  // Standard work hours
  ],
  custom: [
    { start: 8, end: 22 },  // Flexible
  ],
};

export async function scheduleDay(userId: string, date: Date): Promise<ScheduledEvent[]> {
  // Get user with refresh token
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user?.google_refresh_token) {
    throw new Error('Google Calendar not connected');
  }

  // Get user's goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('priority', { ascending: true });

  if (!goals || goals.length === 0) {
    return [];
  }

  // Get busy slots from Google Calendar
  const busySlots = await getFreeBusySlots(user.google_refresh_token, date);

  // Get work shifts - block these times FIRST
  const dateStr = date.toISOString().split('T')[0];
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr);

  // Convert shifts to busy slots
  const shiftBusySlots = (shifts || []).map(shift => {
    const [startH, startM] = shift.start_time.split(':').map(Number);
    const [endH, endM] = shift.end_time.split(':').map(Number);

    const start = new Date(date);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(date);
    end.setHours(endH, endM, 0, 0);

    return { start, end };
  });

  console.log(`📅 Found ${shifts?.length || 0} work shifts for ${dateStr}`);

  // Merge shift busy slots with Google Calendar busy slots
  const allBusySlots = [...busySlots, ...shiftBusySlots];

  // Calculate free slots AFTER blocking work shifts
  const freeSlots = calculateFreeSlots(allBusySlots, date);
  console.log(`⏰ Free slots available:`, freeSlots.map(s =>
    `${s.start.toLocaleTimeString()}-${s.end.toLocaleTimeString()}`
  ));

  // Intelligently schedule goals with relaxation time
  const scheduledGoals = intelligentSchedule(goals, freeSlots, date);
  
  // Create calendar events and save to database
  const scheduledEvents: ScheduledEvent[] = [];
  const scheduleData: any[] = [];

  for (const scheduled of scheduledGoals) {
    const { goal, startTime, endTime } = scheduled;
    
    // Create Google Calendar event
    const emoji = goal.type === 'gym' ? '💪' : goal.type === 'study' ? '📚' : goal.type === 'work' ? '💼' : '✅';
    const googleEventId = await createCalendarEvent(user.google_refresh_token, {
      title: `${emoji} ${goal.name}`,
      description: `Scheduled by DisciplineOS - ${goal.name}`,
      startTime,
      endTime,
      reminders: [15, 5]
    });

    // Save to database
    const { data: event, error } = await supabase
      .from('scheduled_events')
      .insert({
        user_id: user.id,
        goal_id: goal.id,
        google_event_id: googleEventId,
        title: goal.name,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        date: date.toISOString().split('T')[0],
        status: 'scheduled',
        reminded: false
      })
      .select()
      .single();

    if (event && !error) {
      scheduledEvents.push(event);
      scheduleData.push({
        goalId: goal.id,
        goalName: goal.name,
        goalType: goal.type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        relaxationTime: scheduled.relaxationTime
      });
    }
  }

  // Save the generated schedule (dateStr already declared above)
  await supabase
    .from('saved_schedules')
    .upsert({
      user_id: user.id,
      date: dateStr,
      schedule_data: scheduleData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });

  return scheduledEvents;
}

/**
 * Intelligent scheduling algorithm that:
 * 1. Groups goals by type
 * 2. Schedules work goals first (if any)
 * 3. Schedules gym and study goals in optimal time slots
 * 4. Accounts for relaxation/travel time between goals
 * 5. Ensures goals don't overlap
 */
function intelligentSchedule(
  goals: Goal[],
  freeSlots: TimeSlot[],
  date: Date
): ScheduledGoal[] {
  const scheduled: ScheduledGoal[] = [];
  const usedSlots: TimeSlot[] = [...freeSlots];

  // Separate goals by type
  const workGoals = goals.filter(g => g.type === 'work');
  const gymGoals = goals.filter(g => g.type === 'gym');
  const studyGoals = goals.filter(g => g.type === 'study');
  const customGoals = goals.filter(g => g.type === 'custom');

  // Sort by priority (higher priority first)
  const sortByPriority = (a: Goal, b: Goal) => (b.priority || 1) - (a.priority || 1);
  workGoals.sort(sortByPriority);
  gymGoals.sort(sortByPriority);
  studyGoals.sort(sortByPriority);
  customGoals.sort(sortByPriority);

  // Schedule work goals first (they usually have fixed times)
  for (const goal of workGoals) {
    const scheduledGoal = scheduleGoalInOptimalSlot(goal, usedSlots, date);
    if (scheduledGoal) {
      scheduled.push(scheduledGoal);
      markSlotAsUsed(usedSlots, scheduledGoal.startTime, scheduledGoal.endTime, scheduledGoal.relaxationTime);
    }
  }

  // Schedule gym goals in optimal morning/evening slots
  for (const goal of gymGoals) {
    const scheduledGoal = scheduleGoalInOptimalSlot(goal, usedSlots, date);
    if (scheduledGoal) {
      scheduled.push(scheduledGoal);
      markSlotAsUsed(usedSlots, scheduledGoal.startTime, scheduledGoal.endTime, scheduledGoal.relaxationTime);
    }
  }

  // Schedule study goals (can be longer, need focus time)
  for (const goal of studyGoals) {
    const scheduledGoal = scheduleGoalInOptimalSlot(goal, usedSlots, date);
    if (scheduledGoal) {
      scheduled.push(scheduledGoal);
      markSlotAsUsed(usedSlots, scheduledGoal.startTime, scheduledGoal.endTime, scheduledGoal.relaxationTime);
    }
  }

  // Schedule custom goals last
  for (const goal of customGoals) {
    const scheduledGoal = scheduleGoalInOptimalSlot(goal, usedSlots, date);
    if (scheduledGoal) {
      scheduled.push(scheduledGoal);
      markSlotAsUsed(usedSlots, scheduledGoal.startTime, scheduledGoal.endTime, scheduledGoal.relaxationTime);
    }
  }

  // Sort scheduled goals by start time
  scheduled.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return scheduled;
}

/**
 * Schedule a single goal in the best available slot
 */
function scheduleGoalInOptimalSlot(
  goal: Goal,
  availableSlots: TimeSlot[],
  date: Date
): ScheduledGoal | null {
  // Calculate goal duration
  const duration = getGoalDuration(goal);
  const relaxationTime = goal.relaxation_time_after || 15; // default 15 minutes

  // Get optimal time ranges for this goal type
  const optimalRanges = OPTIMAL_TIMES[goal.type] || OPTIMAL_TIMES.custom;

  // PRIORITY 1: Check preferred times from goal FIRST (user's explicit preference)
  if (goal.preferred_times && goal.preferred_times.length > 0) {
    for (const prefTime of goal.preferred_times) {
      const [startStr, endStr] = prefTime.split('-');
      const [prefStartH, prefStartM] = startStr.split(':').map(Number);
      const [prefEndH, prefEndM] = endStr.split(':').map(Number);

      for (const slot of availableSlots) {
        const slotStart = slot.start.getHours() * 60 + slot.start.getMinutes();
        const slotEnd = slot.end.getHours() * 60 + slot.end.getMinutes();
        const prefStart = prefStartH * 60 + prefStartM;
        const prefEnd = prefEndH * 60 + prefEndM;

        // Check if slot overlaps with preferred time
        if (slotStart < prefEnd && slotEnd > prefStart) {
          if (slot.duration >= duration) {
            // Try to start at preferred time if possible
            const preferredStart = new Date(date);
            preferredStart.setHours(prefStartH, prefStartM, 0, 0);
            
            // Ensure preferred start is within the slot
            const actualStart = preferredStart >= slot.start && preferredStart < slot.end 
              ? preferredStart 
              : (preferredStart < slot.start ? slot.start : preferredStart);
            const actualEnd = new Date(actualStart.getTime() + duration * 60000);
            
            if (actualEnd <= slot.end) {
              console.log(`✅ Scheduled ${goal.name} at preferred time ${prefTime}`);
              return {
                goal,
                startTime: actualStart,
                endTime: actualEnd,
                relaxationTime,
              };
            }
          }
        }
      }
    }
  }

  // PRIORITY 2: Try to find a slot in optimal time ranges for goal type
  for (const optimalRange of optimalRanges) {
    for (const slot of availableSlots) {
      const slotHour = slot.start.getHours();
      
      // Check if slot overlaps with optimal time range
      if (slotHour >= optimalRange.start && slotHour < optimalRange.end) {
        if (slot.duration >= duration) {
          const startTime = new Date(slot.start);
          const endTime = new Date(startTime.getTime() + duration * 60000);
          
          console.log(`✅ Scheduled ${goal.name} in optimal ${goal.type} time range`);
          return {
            goal,
            startTime,
            endTime,
            relaxationTime,
          };
        }
      }
    }
  }

  // LAST RESORT: find any slot that fits (but warn if it's not in preferred time)
  for (const slot of availableSlots) {
    if (slot.duration >= duration) {
      const startTime = new Date(slot.start);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      if (goal.preferred_times && goal.preferred_times.length > 0) {
        console.warn(`⚠️ Scheduled ${goal.name} outside preferred time (${goal.preferred_times.join(', ')}) - no slots available`);
      }
      
      return {
        goal,
        startTime,
        endTime,
        relaxationTime,
      };
    }
  }

  return null;
}

/**
 * Get duration for a goal in minutes
 */
function getGoalDuration(goal: Goal): number {
  switch (goal.type) {
    case 'gym':
      return 90; // 1.5 hours
    case 'study':
      return goal.daily_hours ? goal.daily_hours * 60 : 120; // 2 hours default
    case 'work':
      return 480; // 8 hours (full work day)
    default:
      return 60; // 1 hour for custom
  }
}

/**
 * Mark a time slot as used, accounting for relaxation time
 */
function markSlotAsUsed(
  slots: TimeSlot[],
  startTime: Date,
  endTime: Date,
  relaxationTime: number
): void {
  const usedStart = startTime.getTime();
  const usedEnd = endTime.getTime() + (relaxationTime * 60000); // Include relaxation time

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const slotStart = slot.start.getTime();
    const slotEnd = slot.end.getTime();

    // Check if slot overlaps with used time
    if (slotStart < usedEnd && slotEnd > usedStart) {
      if (slotStart >= usedStart && slotEnd <= usedEnd) {
        // Slot is completely within used time, remove it
        slots.splice(i, 1);
        i--;
      } else if (slotStart < usedStart && slotEnd > usedEnd) {
        // Slot contains used time, split it
        const beforeSlot: TimeSlot = {
          start: slot.start,
          end: new Date(usedStart),
          duration: (usedStart - slotStart) / 60000,
        };
        const afterSlot: TimeSlot = {
          start: new Date(usedEnd),
          end: slot.end,
          duration: (slotEnd - usedEnd) / 60000,
        };
        
        slots.splice(i, 1, beforeSlot, afterSlot);
        i++; // Skip the afterSlot in next iteration
      } else if (slotStart < usedStart) {
        // Slot starts before but overlaps, trim end
        slot.end = new Date(usedStart);
        slot.duration = (usedStart - slotStart) / 60000;
      } else {
        // Slot ends after but overlaps, trim start
        slot.start = new Date(usedEnd);
        slot.duration = (slotEnd - usedEnd) / 60000;
      }
    }
  }
}

function calculateFreeSlots(busySlots: { start: Date; end: Date }[], date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0); // Start at 6 AM
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0); // End at 10 PM

  let currentTime = dayStart;

  const sortedBusy = busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const busy of sortedBusy) {
    if (busy.start > currentTime && busy.start < dayEnd) {
      const endTime = busy.start < dayEnd ? busy.start : dayEnd;
      const duration = (endTime.getTime() - currentTime.getTime()) / 60000;
      if (duration >= 30) {
        slots.push({ start: new Date(currentTime), end: endTime, duration });
      }
    }
    if (busy.end > currentTime) {
      currentTime = new Date(busy.end);
    }
  }

  if (currentTime < dayEnd) {
    const duration = (dayEnd.getTime() - currentTime.getTime()) / 60000;
    if (duration >= 30) {
      slots.push({ start: new Date(currentTime), end: dayEnd, duration });
    }
  }

  return slots;
}
