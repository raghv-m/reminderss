import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export const twilioClient = twilio(accountSid, authToken);

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    });
    console.log(`📱 SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

export async function sendMorningCheckIn(to: string, name: string): Promise<boolean> {
  const message = `Good morning ${name}! 🌅

Time for your daily check-in:

1️⃣ Did you hit the gym yesterday? (Yes/No)
2️⃣ Did you study yesterday? (Yes/No)

Reply with your answers (e.g., "Yes Yes" or "No Yes")
or send a photo as proof! 📸

Let's build discipline today. 💪`;

  return sendSMS(to, message);
}

export async function sendReminder(to: string, eventTitle: string, minutesUntil: number): Promise<boolean> {
  const message = `⏰ Reminder: ${eventTitle} starts in ${minutesUntil} minutes!

Don't skip it. Your future self is counting on you.

Reply "started" when you begin.`;

  return sendSMS(to, message);
}

export async function sendMissedNotification(to: string, eventTitle: string, missedCount: number = 1): Promise<boolean> {
  // Hamza-style brutal motivation based on how many times they've missed
  const brutalMessages = [
    // First miss - gentle
    `⚠️ You missed: ${eventTitle}

You're becoming the old version of yourself.
Fix it today.

Reply "done" when you complete it.`,

    // Second miss - harder
    `🚨 ${eventTitle} - MISSED AGAIN

Bro, this is how losers are made.
One skip becomes two. Two becomes a habit.
The habit becomes YOU.

Get up. Do it NOW.
Reply "done" when finished.`,

    // Third+ miss - brutal
    `💀 ${eventTitle} - You're on a losing streak.

Let me be real with you:
You're not "taking a break."
You're QUITTING in slow motion.

The person you said you wanted to be?
They're watching you fail right now.

This is your wake-up call.
Either prove me wrong or stay average forever.

Reply "done" or keep being a disappointment.`,
  ];

  const messageIndex = Math.min(missedCount - 1, brutalMessages.length - 1);
  return sendSMS(to, brutalMessages[messageIndex]);
}

export async function sendStreakUpdate(to: string, streak: number, goalType: string): Promise<boolean> {
  let message: string;

  if (streak === 0) {
    message = `💔 Your ${goalType} streak just DIED.

This is the moment that separates winners from losers.
Winners get back up. Losers make excuses.

Which one are you?
Make today Day 1. No more zero days.`;
  } else if (streak === 7) {
    message = `🔥 7 DAY ${goalType.toUpperCase()} STREAK!

One week of discipline.
You just proved you're different.

Most people quit after 3 days.
You're in the top 10% now.
Keep going. 💪`;
  } else if (streak === 14) {
    message = `⚡ 14 DAY STREAK - ${goalType.toUpperCase()}

Two weeks. This is becoming a HABIT now.
Your brain is rewiring itself.

You're not the same person you were 14 days ago.
The compound effect is kicking in. 🚀`;
  } else if (streak === 30) {
    message = `👑 30 DAY ${goalType.toUpperCase()} STREAK

LEGENDARY.

You did what 99% of people can't:
You showed up for a whole month.

This isn't motivation anymore.
This is who you ARE now.
Never go back. 🏆`;
  } else if (streak % 7 === 0) {
    message = `🔥 ${streak} day ${goalType} streak!

You're in the top 1% of people who actually follow through.
Keep stacking those wins! 🚀`;
  } else {
    message = `✅ ${goalType} Day ${streak}!

Discipline > Motivation
Keep going, champion. 💪`;
  }

  return sendSMS(to, message);
}

// Weekly summary
export async function sendWeeklySummary(
  to: string,
  name: string,
  gymDays: number,
  gymTarget: number,
  studyHours: number,
  studyTarget: number,
  completionRate: number
): Promise<boolean> {
  const gymEmoji = gymDays >= gymTarget ? '✅' : '❌';
  const studyEmoji = studyHours >= studyTarget ? '✅' : '❌';

  let verdict: string;
  if (completionRate >= 90) {
    verdict = "ELITE WEEK. You're becoming unstoppable. 👑";
  } else if (completionRate >= 70) {
    verdict = "Solid week. Room to improve, but you showed up. 💪";
  } else if (completionRate >= 50) {
    verdict = "Average week. You can do better. I know you can. 🔥";
  } else {
    verdict = "Rough week. But it's over now. This week is your comeback. ⚡";
  }

  const message = `📊 WEEKLY REPORT for ${name}

${gymEmoji} Gym: ${gymDays}/${gymTarget} sessions
${studyEmoji} Study: ${studyHours}/${studyTarget} hours
📈 Completion Rate: ${completionRate}%

${verdict}

Reply "READY" if you're committed to crushing next week.`;

  return sendSMS(to, message);
}

