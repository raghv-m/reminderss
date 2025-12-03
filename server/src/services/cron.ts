import cron from 'node-cron';
import { supabase } from '../lib/supabase.js';
import { sendMorningCheckIn, sendReminder, sendMissedNotification } from '../lib/twilio.js';
import { scheduleDay } from './scheduler.js';

export function startCronJobs() {
  console.log('⏰ Starting cron jobs...');

  // Morning check-in at 7 AM every day
  cron.schedule('0 7 * * *', async () => {
    console.log('📬 Running morning check-in job...');
    await sendMorningCheckIns();
  });

  // Schedule generation at 8 AM every day
  cron.schedule('0 8 * * *', async () => {
    console.log('📅 Running daily schedule generation...');
    await generateDailySchedules();
  });

  // Check for upcoming events every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Checking for upcoming reminders...');
    await sendUpcomingReminders();
  });

  // Check for missed events every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔍 Checking for missed events...');
    await checkMissedEvents();
  });

  console.log('✅ Cron jobs scheduled');
}

async function sendMorningCheckIns() {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .not('phone', 'is', null);

    if (!users || users.length === 0) {
      console.log('📱 No users with phone numbers found for morning check-ins');
      return;
    }

    let sentCount = 0;
    for (const user of users) {
      if (user.phone) {
        try {
          await sendMorningCheckIn(user.phone, user.name || 'Champion');
          sentCount++;
        } catch (error) {
          console.error(`Failed to send check-in to ${user.phone}:`, error);
        }
      }
    }

    console.log(`📱 Sent ${sentCount}/${users.length} morning check-ins`);
  } catch (error) {
    console.error('Error sending morning check-ins:', error);
  }
}

async function generateDailySchedules() {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .not('google_refresh_token', 'is', null);

    if (!users) return;

    for (const user of users) {
      try {
        await scheduleDay(user.id, new Date());
      } catch (error) {
        console.error(`Failed to schedule for user ${user.id}:`, error);
      }
    }

    console.log(`📅 Generated schedules for ${users.length} users`);
  } catch (error) {
    console.error('Error generating schedules:', error);
  }
}

async function sendUpcomingReminders() {
  try {
    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60000);
    const in30Min = new Date(now.getTime() + 30 * 60000);

    // Find events starting in the next 15-30 minutes that haven't been reminded
    const { data: events } = await supabase
      .from('scheduled_events')
      .select('*, users!inner(*)')
      .eq('status', 'scheduled')
      .eq('reminded', false)
      .gte('start_time', in15Min.toISOString())
      .lte('start_time', in30Min.toISOString());

    if (!events) return;

    for (const event of events) {
      const user = event.users;
      if (user.phone) {
        const startTime = new Date(event.start_time);
        const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60000);
        
        await sendReminder(user.phone, event.title, minutesUntil);
        
        // Mark as reminded
        await supabase
          .from('scheduled_events')
          .update({ reminded: true })
          .eq('id', event.id);
      }
    }

    if (events.length > 0) {
      console.log(`⏰ Sent ${events.length} reminders`);
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}

async function checkMissedEvents() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60000);
    const twoHoursAgo = new Date(Date.now() - 120 * 60000);

    // Find events that ended 1-2 hours ago still marked as scheduled
    const { data: events } = await supabase
      .from('scheduled_events')
      .select('*, users!inner(*), goals!inner(*)')
      .eq('status', 'scheduled')
      .lte('end_time', oneHourAgo.toISOString())
      .gte('end_time', twoHoursAgo.toISOString());

    if (!events) return;

    for (const event of events) {
      const user = event.users;
      if (user.phone) {
        // Count how many times they've missed this goal type recently
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60000);
        const { count } = await supabase
          .from('scheduled_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('goal_id', event.goal_id)
          .eq('status', 'missed')
          .gte('date', threeDaysAgo.toISOString().split('T')[0]);

        const missedCount = (count || 0) + 1; // +1 for current miss

        await sendMissedNotification(user.phone, event.title, missedCount);

        // Mark as missed
        await supabase
          .from('scheduled_events')
          .update({ status: 'missed' })
          .eq('id', event.id);
      }
    }

    if (events.length > 0) {
      console.log(`⚠️ Sent ${events.length} missed notifications`);
    }
  } catch (error) {
    console.error('Error checking missed events:', error);
  }
}

