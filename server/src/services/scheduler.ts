import { supabase, Goal, ScheduledEvent } from '../lib/supabase.js';
import { getFreeBusySlots, createCalendarEvent } from '../lib/google.js';

interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

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

  // *** GET WORK SHIFTS - block these times FIRST ***
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

  // Schedule each goal in remaining free time
  const scheduledEvents: ScheduledEvent[] = [];

  for (const goal of goals) {
    const event = await scheduleGoal(user, goal, freeSlots, date);
    if (event) {
      scheduledEvents.push(event);
      // Remove the scheduled time from free slots
      removeSlotFromFree(freeSlots, event.start_time, event.end_time);
    }
  }

  return scheduledEvents;
}

function calculateFreeSlots(busySlots: { start: Date; end: Date }[], date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0);

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

async function scheduleGoal(
  user: any,
  goal: Goal,
  freeSlots: TimeSlot[],
  date: Date
): Promise<ScheduledEvent | null> {
  // Determine duration based on goal type
  let duration: number;
  switch (goal.type) {
    case 'gym': duration = 90; break;
    case 'study': duration = goal.daily_hours ? goal.daily_hours * 60 : 120; break;
    default: duration = 60;
  }

  // Find best slot based on preferred times
  const bestSlot = findBestSlot(freeSlots, goal.preferred_times, duration);
  if (!bestSlot) return null;

  const startTime = bestSlot.start;
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Create Google Calendar event
  const googleEventId = await createCalendarEvent(user.google_refresh_token, {
    title: `${goal.type === 'gym' ? '💪' : '📚'} ${goal.name}`,
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

  return event;
}

function findBestSlot(slots: TimeSlot[], preferredTimes: string[], duration: number): TimeSlot | null {
  // First try to find a slot matching preferred times
  for (const pref of preferredTimes) {
    const [startHour] = pref.split('-')[0].split(':').map(Number);
    for (const slot of slots) {
      if (slot.start.getHours() <= startHour && slot.duration >= duration) {
        return { ...slot, end: new Date(slot.start.getTime() + duration * 60000) };
      }
    }
  }

  // Otherwise find any slot that fits
  const validSlot = slots.find(s => s.duration >= duration);
  return validSlot ? { ...validSlot, end: new Date(validSlot.start.getTime() + duration * 60000) } : null;
}

function removeSlotFromFree(slots: TimeSlot[], start: string, end: string): void {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.start.getTime() < endTime && slot.end.getTime() > startTime) {
      // This slot overlaps, adjust it
      if (slot.start.getTime() >= startTime) {
        slot.start = new Date(endTime);
        slot.duration = (slot.end.getTime() - slot.start.getTime()) / 60000;
      }
    }
  }
}

