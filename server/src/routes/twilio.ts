import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { sendSMS, sendStreakUpdate } from '../lib/twilio.js';

export const twilioRouter = Router();

// Twilio webhook for incoming SMS/MMS
twilioRouter.post('/webhook', async (req, res) => {
  const { From, Body, MediaUrl0, MediaContentType0 } = req.body;

  console.log(`📨 Received message from ${From}: ${Body}`);

  // Find user by phone
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', From)
    .single();

  if (!user) {
    console.log(`Unknown phone number: ${From}`);
    return res.type('text/xml').send('<Response></Response>');
  }

  // Parse the response
  const response = Body.toLowerCase().trim();
  const hasMedia = !!MediaUrl0;
  const today = new Date().toISOString().split('T')[0];

  // Get user's active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .in('type', ['gym', 'study']);

  if (!goals || goals.length === 0) {
    await sendSMS(From, "You don't have any active goals set up. Go to the dashboard to create your first goal!");
    return res.type('text/xml').send('<Response></Response>');
  }

  // Handle different response types
  if (response === 'skip') {
    // Mark today's events as skipped
    await supabase
      .from('scheduled_events')
      .update({ status: 'skipped' })
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('status', 'scheduled');

    await sendSMS(From, "Understood. We all have those days. But make sure tomorrow is different. 💪");
  } else if (response === 'done' || response === 'started') {
    // Mark current events as completed
    await supabase
      .from('scheduled_events')
      .update({ status: 'completed' })
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('status', 'scheduled');

    await sendSMS(From, "Nice! That's what discipline looks like. Keep going! 🔥");
  } else {
    // Parse yes/no responses for gym and study
    const parts = response.split(/\s+/);
    const gymGoal = goals.find(g => g.type === 'gym');
    const studyGoal = goals.find(g => g.type === 'study');
    
    const gymAnswer = parts[0] === 'yes';
    const studyAnswer = parts[1] === 'yes' || (parts.length === 1 && parts[0] === 'yes');

    // Record check-ins
    if (gymGoal) {
      await supabase.from('check_ins').upsert({
        user_id: user.id,
        goal_id: gymGoal.id,
        date: today,
        completed: gymAnswer || hasMedia,
        proof_url: hasMedia ? MediaUrl0 : null,
        proof_type: hasMedia ? (MediaContentType0?.includes('video') ? 'video' : 'image') : null
      }, { onConflict: 'user_id,goal_id,date' });
    }

    if (studyGoal) {
      await supabase.from('check_ins').upsert({
        user_id: user.id,
        goal_id: studyGoal.id,
        date: today,
        completed: studyAnswer,
      }, { onConflict: 'user_id,goal_id,date' });
    }

    // Calculate and send streak
    const { data: recentCheckins } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(100);

    let gymStreak = 0;
    if (gymGoal && recentCheckins) {
      const gymCheckins = recentCheckins.filter(c => c.goal_id === gymGoal.id);
      for (const checkin of gymCheckins) {
        if (checkin.completed) gymStreak++;
        else break;
      }
    }

    // Build response
    let responseMsg = gymAnswer || hasMedia
      ? `💪 Gym: Logged! Streak: ${gymStreak} days\n`
      : `😔 Gym: Not today\n`;
    
    responseMsg += studyAnswer
      ? `📚 Study: Logged!\n`
      : `📚 Study: Not today\n`;

    responseMsg += `\nI'll build your optimal schedule for today based on your calendar.`;

    await sendSMS(From, responseMsg);
  }

  // Send empty TwiML response
  res.type('text/xml').send('<Response></Response>');
});

// Send test message
twilioRouter.post('/test', async (req, res) => {
  const { phone, message } = req.body;
  const success = await sendSMS(phone, message || 'Test message from DisciplineOS!');
  res.json({ success });
});

