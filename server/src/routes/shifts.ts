import { Router } from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { supabase } from '../lib/supabase.js';
import { createCalendarEvent } from '../lib/google.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Buffer time for driving (30 min before and after due to snow/traffic)
const DRIVING_BUFFER_MINUTES = 30;

// Helper function to sync a single shift to Google Calendar
async function syncShiftToCalendar(userId: string, refreshToken: string, shift: any): Promise<void> {
  // Parse date and times
  const shiftDate = new Date(shift.date);
  const [startHour, startMin] = shift.start_time.split(':').map(Number);
  const [endHour, endMin] = shift.end_time.split(':').map(Number);

  // Create start and end times
  const shiftStart = new Date(shiftDate);
  shiftStart.setHours(startHour, startMin, 0, 0);

  const shiftEnd = new Date(shiftDate);
  shiftEnd.setHours(endHour, endMin, 0, 0);

  // Handle overnight shifts (end time is next day)
  if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  // Calculate times with driving buffer (30 min before and after for snow)
  const driveToWork = new Date(shiftStart.getTime() - DRIVING_BUFFER_MINUTES * 60 * 1000);
  const driveFromWork = new Date(shiftEnd.getTime() + DRIVING_BUFFER_MINUTES * 60 * 1000);

  // Create the main work shift event
  const shiftTitle = shift.title || 'Work Shift';
  const locationText = shift.location ? ` @ ${shift.location}` : '';

  const workEventId = await createCalendarEvent(refreshToken, {
    title: `🏢 ${shiftTitle}${locationText}`,
    description: `Work shift scheduled by DisciplineOS\n${shift.location ? `📍 Location: ${shift.location}\n` : ''}⏰ ${shift.start_time} - ${shift.end_time}`,
    startTime: shiftStart,
    endTime: shiftEnd,
    location: shift.location || undefined,
    reminders: [60, 30] // 1 hour and 30 min before
  });

  // Create "Drive to Work" event (30 min before shift)
  const driveToEventId = await createCalendarEvent(refreshToken, {
    title: `🚗 Drive to Work${locationText}`,
    description: `Leave now to arrive on time!\n🌨️ Extra buffer for snow/traffic\n${shift.location ? `📍 Heading to: ${shift.location}` : ''}`,
    startTime: driveToWork,
    endTime: shiftStart,
    reminders: [15, 5] // 15 and 5 min before leaving
  });

  // Create "Drive Home" event (30 min after shift)
  const driveHomeEventId = await createCalendarEvent(refreshToken, {
    title: `🚗 Drive Home`,
    description: `Shift ended - time to head home!\n🌨️ Drive safe in the snow`,
    startTime: shiftEnd,
    endTime: driveFromWork,
    reminders: [] // No reminder needed
  });

  // Update shift as synced
  await supabase
    .from('shifts')
    .update({
      synced_to_calendar: true,
      google_event_id: workEventId
    })
    .eq('id', shift.id);

  console.log(`✅ Synced shift ${shift.date} ${shift.start_time}-${shift.end_time} to Google Calendar with driving buffers`);
  console.log(`   📍 Location: ${shift.location || 'None'}`);
  console.log(`   🏢 Event IDs: Work=${workEventId}, DriveTo=${driveToEventId}, DriveHome=${driveHomeEventId}`);
}

// Upload schedule screenshot and parse shifts
router.post('/upload', upload.single('image'), async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    console.log('📷 Processing schedule image...');
    
    // Run OCR on the image
    const result = await Tesseract.recognize(req.file.buffer, 'eng', {
      logger: m => console.log(`OCR: ${m.status} ${Math.round((m.progress || 0) * 100)}%`)
    });

    const rawText = result.data.text;
    console.log('📝 OCR Result:', rawText);
    console.log('📝 OCR Lines:', rawText.split('\n').map((l, i) => `${i}: ${l.trim()}`));

    // Parse the text to extract shifts
    const shifts = parseShifts(rawText);
    console.log('📅 Parsed shifts:', JSON.stringify(shifts, null, 2));

    if (shifts.length === 0) {
      console.log('⚠️ No shifts parsed. Raw OCR text:', rawText);
      console.log('📋 Lines:', rawText.split('\n').map((l, i) => `${i}: "${l.trim()}"`).filter(l => l.length > 3));
      
      // Try a more lenient parsing approach
      console.log('🔄 Attempting fallback parsing...');
      const fallbackShifts = parseShiftsFallback(rawText);
      if (fallbackShifts.length > 0) {
        console.log('✅ Fallback parsing found shifts:', fallbackShifts);
        // Use fallback shifts
        const savedShifts = [];
        const { data: user } = await supabase
          .from('users')
          .select('google_refresh_token')
          .eq('id', userId)
          .single();

        const hasGoogleCalendar = !!user?.google_refresh_token;

        for (const shift of fallbackShifts) {
          const { data, error } = await supabase
            .from('shifts')
            .upsert({
              user_id: userId,
              date: shift.date,
              start_time: shift.startTime,
              end_time: shift.endTime,
              location: shift.location || null,
              title: shift.title || 'Work Shift',
              raw_text: shift.rawText,
              source: 'upload',
              synced_to_calendar: false
            }, { onConflict: 'user_id,date,start_time' })
            .select()
            .single();

          if (data) {
            savedShifts.push(data);
            if (hasGoogleCalendar) {
              try {
                await syncShiftToCalendar(userId, user.google_refresh_token, data);
              } catch (err) {
                console.error(`Failed to sync shift ${data.id}:`, err);
              }
            }
          }
        }

        return res.json({
          success: true,
          shifts: savedShifts,
          rawText,
          parsed: fallbackShifts.length,
          message: `Parsed ${fallbackShifts.length} shifts using fallback parser!`
        });
      }
      
      return res.status(400).json({ 
        error: 'Could not parse any shifts from image. Please check the image quality or try adding shifts manually.', 
        rawText,
        hint: 'Make sure the image shows dates and times clearly. Format should be like "Wed Dec-3 11:00p - 7:00a"',
        debugLines: rawText.split('\n').map((l, i) => ({ line: i, text: l.trim() })).filter(l => l.text.length > 0)
      });
    }

    // Get user's Google refresh token for calendar sync
    const { data: user } = await supabase
      .from('users')
      .select('google_refresh_token')
      .eq('id', userId)
      .single();

    const hasGoogleCalendar = !!user?.google_refresh_token;
    console.log(`📅 User has Google Calendar: ${hasGoogleCalendar ? 'YES' : 'NO'}`);

    // Get user's default hourly rate and location for payroll calculation
    const { data: userData } = await supabase
      .from('users')
      .select('default_hourly_rate, province_state, country')
      .eq('id', userId)
      .single();

    const defaultHourlyRate = userData?.default_hourly_rate;
    const userProvinceState = userData?.province_state;
    const userCountry = userData?.country || 'Canada';

    // Save shifts to database
    const savedShifts = [];
    const calendarErrors = [];
    
    for (const shift of shifts) {
      console.log(`💾 Saving shift: ${shift.date} ${shift.startTime}-${shift.endTime}`);
      
      // Calculate hours
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;
      if (endMinutes < startMinutes) endMinutes += 24 * 60;
      const totalHours = (endMinutes - startMinutes) / 60;
      
      const { data, error } = await supabase
        .from('shifts')
        .upsert({
          user_id: userId,
          date: shift.date,
          start_time: shift.startTime,
          end_time: shift.endTime,
          location: shift.location || null,
          title: shift.title || 'Work Shift',
          raw_text: shift.rawText,
          source: 'upload',
          synced_to_calendar: false,
          total_hours: totalHours,
          hourly_rate: defaultHourlyRate || null,
          province_state: userProvinceState || null,
          country: userCountry
        }, { onConflict: 'user_id,date,start_time' })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error saving shift:`, error);
        continue;
      }

      if (data) {
        console.log(`✅ Saved shift to database: ${data.id}`);
        
        // Calculate payroll if hourly rate is set
        if (defaultHourlyRate && totalHours > 0) {
          try {
            const { calculateShiftPayroll } = await import('../services/payroll.js');
            await calculateShiftPayroll(userId, data.id, totalHours, defaultHourlyRate);
            console.log(`💰 Calculated payroll for shift ${data.id}: ${totalHours}h × $${defaultHourlyRate}/hr`);
          } catch (err) {
            console.error(`Failed to calculate payroll for shift ${data.id}:`, err);
          }
        }
        
        // Automatically sync to Google Calendar if connected
        if (hasGoogleCalendar) {
          try {
            console.log(`📅 Syncing shift ${data.id} to Google Calendar...`);
            await syncShiftToCalendar(userId, user.google_refresh_token, data);
            console.log(`✅ Successfully synced shift ${data.id} to calendar`);
            
            // Refresh the shift data to get updated synced status
            const { data: updatedShift } = await supabase
              .from('shifts')
              .select('*')
              .eq('id', data.id)
              .single();
            if (updatedShift) {
              savedShifts.push(updatedShift);
            } else {
              savedShifts.push(data);
            }
          } catch (err) {
            console.error(`❌ Failed to sync shift ${data.id} to calendar:`, err);
            calendarErrors.push({ shiftId: data.id, error: String(err) });
            savedShifts.push(data); // Still add the shift even if calendar sync failed
          }
        } else {
          console.log(`⚠️ Google Calendar not connected - shift saved but not synced`);
          savedShifts.push(data);
        }
      } else {
        console.error(`❌ No data returned after saving shift`);
      }
    }

    const syncedCount = savedShifts.filter(s => s.synced_to_calendar).length;
    const message = hasGoogleCalendar
      ? `✅ Parsed ${shifts.length} shifts and synced ${syncedCount} to Google Calendar with ${DRIVING_BUFFER_MINUTES}-min driving buffers! ❄️`
      : `✅ Parsed ${shifts.length} shifts. Connect Google Calendar to auto-sync with driving time.`;

    res.json({
      success: true,
      shifts: savedShifts,
      rawText,
      parsed: shifts.length,
      synced: syncedCount,
      calendarErrors: calendarErrors.length > 0 ? calendarErrors : undefined,
      message
    });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Get all shifts for a user
router.get('/', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    res.json(shifts || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get shifts' });
  }
});

// Delete a shift
router.delete('/:shiftId', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { shiftId } = req.params;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId)
      .eq('user_id', userId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

// Manually add a shift
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { date, startTime, endTime, location, title } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: shift, error } = await supabase
      .from('shifts')
      .upsert({
        user_id: userId,
        date,
        start_time: startTime,
        end_time: endTime,
        location: location || null,
        title: title || 'Work Shift',
        source: 'manual',
        synced_to_calendar: false
      }, { onConflict: 'user_id,date,start_time' })
      .select()
      .single();

    if (error) throw error;
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add shift' });
  }
});

// Batch add shifts
router.post('/batch', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { shifts } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
    return res.status(400).json({ error: 'No shifts provided' });
  }

  try {
    const savedShifts = [];
    for (const shift of shifts) {
      const { data, error } = await supabase
        .from('shifts')
        .upsert({
          user_id: userId,
          date: shift.date,
          start_time: shift.startTime,
          end_time: shift.endTime,
          location: shift.location || null,
          title: shift.title || 'Work Shift',
          source: 'batch',
          synced_to_calendar: false
        }, { onConflict: 'user_id,date,start_time' })
        .select()
        .single();

      if (data) savedShifts.push(data);
    }

    res.json({ success: true, shifts: savedShifts, count: savedShifts.length });
  } catch (error) {
    console.error('Batch add error:', error);
    res.status(500).json({ error: 'Failed to add shifts' });
  }
});

// Sync shifts to Google Calendar with driving buffer time
router.post('/sync-calendar', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user's Google refresh token
    const { data: user } = await supabase
      .from('users')
      .select('google_refresh_token')
      .eq('id', userId)
      .single();

    if (!user?.google_refresh_token) {
      return res.status(400).json({ error: 'Google Calendar not connected. Please connect your Google account first.' });
    }

    // Get all unsynced shifts
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .eq('synced_to_calendar', false)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!shifts || shifts.length === 0) {
      return res.json({ success: true, message: 'No new shifts to sync', synced: 0 });
    }

    const syncedShifts = [];
    const errors = [];

    for (const shift of shifts) {
      try {
        await syncShiftToCalendar(userId, user.google_refresh_token, shift);
        syncedShifts.push(shift);
      } catch (err) {
        console.error(`❌ Failed to sync shift ${shift.id}:`, err);
        errors.push({ shiftId: shift.id, error: String(err) });
      }
    }

    res.json({
      success: true,
      synced: syncedShifts.length,
      failed: errors.length,
      shifts: syncedShifts,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${syncedShifts.length} shifts to Google Calendar with ${DRIVING_BUFFER_MINUTES}-min driving buffers for snow! ❄️`
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: 'Failed to sync shifts to calendar' });
  }
});

// Parse shifts from OCR text
interface ParsedShift {
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  title: string | null;
  rawText: string;
}

function parseShifts(text: string): ParsedShift[] {
  const shifts: ParsedShift[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Try to find a date in the line - handle multiple formats
    let dateStr: string | null = null;
    let month = 0;
    let day = 0;

    // Pattern 1: "Wed Dec-3" or "Wed Dec 3" or "Wed Dec-3 >" (with or without dash, with day name, optional > or other chars)
    const dayMonthDayMatch = lowerLine.match(/(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*(\d{1,2})/i);
    if (dayMonthDayMatch) {
      month = monthNames.indexOf(dayMonthDayMatch[1].toLowerCase().slice(0, 3)) + 1;
      day = parseInt(dayMonthDayMatch[2]);
      console.log(`📅 Found date pattern 1: ${dayMonthDayMatch[0]} -> month=${month}, day=${day}`);
    }

    // Pattern 2: "Dec-3" or "Dec 3" (month-day with optional dash)
    if (!month && !day) {
      const monthDayMatch = lowerLine.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*(\d{1,2})/i);
      if (monthDayMatch) {
        month = monthNames.indexOf(monthDayMatch[1].toLowerCase().slice(0, 3)) + 1;
        day = parseInt(monthDayMatch[2]);
        console.log(`📅 Found date pattern 2: ${monthDayMatch[0]} -> month=${month}, day=${day}`);
      }
    }

    // Pattern 3: "12/2" or "12-2" (numeric format)
    if (!month && !day) {
      const numericDateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
      if (numericDateMatch) {
        month = parseInt(numericDateMatch[1]);
        day = parseInt(numericDateMatch[2]);
        const year = numericDateMatch[3] ? (numericDateMatch[3].length === 2 ? 2000 + parseInt(numericDateMatch[3]) : parseInt(numericDateMatch[3])) : currentYear;
        dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }

    // If we found month and day, construct date string
    if (month && day && !dateStr) {
      // Determine year - if month is in the past, assume next year
      let year = currentYear;
      if (month < currentMonth || (month === currentMonth && day < new Date().getDate())) {
        // Could be next year, but for simplicity, assume current year
        // You might want to check if it's close to year end
      }
      dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    if (!dateStr) continue;

    // Look ahead for time on next line (common in schedule apps)
    let times: { hour: number; minute: number }[] = [];
    let timeLineIndex = i;
    
    // Check current line and next few lines for times
    // Format: "11:00p - 7:00a" (times on same line with dash)
    for (let j = i; j < Math.min(i + 3, lines.length); j++) {
      const checkLine = lines[j];
      const foundTimes = extractTimesFromLine(checkLine);
      if (foundTimes.length >= 2) {
        times = foundTimes;
        timeLineIndex = j;
        break;
      }
    }
    
    // Also check if times are on consecutive lines (less common)
    if (times.length < 2 && i + 1 < lines.length) {
      const line1Times = extractTimesFromLine(lines[i]);
      const line2Times = extractTimesFromLine(lines[i + 1]);
      if (line1Times.length >= 1 && line2Times.length >= 1) {
        times = [...line1Times, ...line2Times].slice(0, 2);
        timeLineIndex = i + 1;
      }
    }

    if (times.length < 2) {
      console.log(`⚠️ Found date ${dateStr} but only ${times.length} time(s) on line ${i}: "${line}"`);
      continue;
    }

    // Extract location and title from lines after the time
    // Location often spans multiple lines after the time
    const locationLines: string[] = [];
    let locationEndIndex = timeLineIndex + 1;
    
    // Collect location lines (usually 2-4 lines after time)
    // Skip navigation elements and very short lines
    const skipPatterns = /^(Upcoming|Dashboard|Menu|More|Ei GR|© m|al!|LTE|ED|Impact Security Group)$/i;
    
    for (let j = timeLineIndex + 1; j < Math.min(timeLineIndex + 6, lines.length); j++) {
      const locLine = lines[j];
      
      // Stop if we hit another date pattern
      if (locLine.match(/(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
        break;
      }
      
      // Stop if we hit another time pattern (new shift)
      if (j > timeLineIndex + 1 && locLine.match(/\d{1,2}:\d{2}\s*[ap]/i)) {
        break;
      }
      
      // Skip navigation elements, status bar, and very short lines
      if (locLine.length > 5 && !skipPatterns.test(locLine) && !locLine.match(/^\d+$/) && !locLine.match(/^[<>]+$/)) {
        locationLines.push(locLine);
        locationEndIndex = j;
      }
    }

    const startTime = `${times[0].hour.toString().padStart(2, '0')}:${times[0].minute.toString().padStart(2, '0')}:00`;
    const endTime = `${times[1].hour.toString().padStart(2, '0')}:${times[1].minute.toString().padStart(2, '0')}:00`;

    // Combine all relevant text for location extraction
    const combinedText = locationLines.length > 0 
      ? locationLines.join(' ') 
      : lines[timeLineIndex] || line;

    const { location, title } = extractLocationAndTitle(combinedText, lines, timeLineIndex, locationLines);

    // Combine all lines for raw text
    const rawTextLines = [line];
    if (timeLineIndex > i) rawTextLines.push(lines[timeLineIndex]);
    rawTextLines.push(...locationLines);

    shifts.push({
      date: dateStr,
      startTime,
      endTime,
      location,
      title,
      rawText: rawTextLines.join(' | ')
    });

    // Skip lines we've already processed
    i = Math.max(timeLineIndex, locationEndIndex);
  }

  return shifts;
}

// Helper function to extract times from a line
function extractTimesFromLine(line: string): { hour: number; minute: number }[] {
  const times: { hour: number; minute: number }[] = [];
  
  // First, try to match the exact format "11:00p - 7:00a" (two times with dash)
  const twoTimeMatch = line.match(/(\d{1,2}):(\d{2})\s*([ap])\s*[-–]\s*(\d{1,2}):(\d{2})\s*([ap])/i);
  if (twoTimeMatch) {
    // Parse first time
    let hour1 = parseInt(twoTimeMatch[1]);
    const min1 = parseInt(twoTimeMatch[2]);
    const ampm1 = twoTimeMatch[3].toLowerCase();
    if (ampm1 === 'p' && hour1 < 12) hour1 += 12;
    if (ampm1 === 'a' && hour1 === 12) hour1 = 0;
    
    // Parse second time
    let hour2 = parseInt(twoTimeMatch[4]);
    const min2 = parseInt(twoTimeMatch[5]);
    const ampm2 = twoTimeMatch[6].toLowerCase();
    if (ampm2 === 'p' && hour2 < 12) hour2 += 12;
    if (ampm2 === 'a' && hour2 === 12) hour2 = 0;
    
    if (hour1 >= 0 && hour1 <= 23 && hour2 >= 0 && hour2 <= 23) {
      times.push({ hour: hour1, minute: min1 });
      times.push({ hour: hour2, minute: min2 });
      return times; // Return early if we found both times
    }
  }
  
  // Otherwise, try individual patterns
  const timePatterns = [
    // Single letter p/a: "11:00p" or "7:00a" (most common in user's format)
    /(\d{1,2}):(\d{2})\s*([ap])\b/gi,
    // Full PM/AM: "11:00 PM" or "7:00 AM"
    /(\d{1,2}):(\d{2})\s*(am|pm)\b/gi,
    // 24-hour: "15:00" or "23:00"
    /(\d{1,2}):(\d{2})(?:\s|$|[-–])/g,
    // Without colon: "11p" or "7a" (less common)
    /(\d{1,2})\s*([ap])\b/gi,
  ];

  for (const pattern of timePatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(line)) !== null) {
      let hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const ampm = (match[3] || match[4] || '').toLowerCase();

      // Handle AM/PM conversion
      if (ampm === 'p' || ampm === 'pm') {
        if (hour < 12) hour += 12;
        if (hour === 12 && ampm === 'pm') hour = 12; // 12pm stays 12
      } else if (ampm === 'a' || ampm === 'am') {
        if (hour === 12) hour = 0; // 12am becomes 0
      }

      // Validate hour (0-23) and avoid duplicates
      if (hour >= 0 && hour <= 23) {
        const exists = times.some(t => t.hour === hour && t.minute === minute);
        if (!exists) {
          times.push({ hour, minute });
        }
      }
    }
  }
  return times;
}

// Extract location and title from shift text
function extractLocationAndTitle(text: string, allLines: string[], lineIndex: number, locationLines: string[] = []): { location: string | null; title: string | null } {
  let location: string | null = null;
  let title: string | null = null;

  // Common location patterns
  // Pattern: "@ Location Name" or "at Location Name"
  const atLocationMatch = text.match(/(?:@|at)\s+([A-Za-z0-9\s\-\.\,\']+?)(?:\s+\d|$|\s+-|\s+–)/i);
  if (atLocationMatch) {
    location = atLocationMatch[1].trim();
  }

  // Pattern: "Location:" or "Loc:" prefix
  const locPrefixMatch = text.match(/(?:location|loc|store|branch|site)[\s:]+([A-Za-z0-9\s\-\.\,\']+?)(?:\s+\d|$|\s+-)/i);
  if (locPrefixMatch) {
    location = locPrefixMatch[1].trim();
  }

  // Check nearby lines for location (sometimes on previous/next line)
  if (!location) {
    // Check previous line
    if (lineIndex > 0) {
      const prevLine = allLines[lineIndex - 1];
      // If prev line looks like a location/store name (not a date/time)
      if (prevLine && !prevLine.match(/\d{1,2}:\d{2}/) && !prevLine.match(/(?:mon|tue|wed|thu|fri|sat|sun)/i)) {
        const words = prevLine.split(/\s+/);
        if (words.length <= 5 && prevLine.length < 50) {
          // Might be a store/location name
          location = prevLine.trim();
        }
      }
    }
  }

  // Extract title/role from parentheses like "(TACTICAL GUARD)" or "(GUARD)"
  const roleInParens = text.match(/\(([A-Z\s]+(?:GUARD|CASHIER|MANAGER|SUPERVISOR|CLERK|ASSISTANT|DRIVER|WORKER|STAFF)[A-Z\s]*)\)/i);
  if (roleInParens) {
    title = roleInParens[1].trim();
  }

  // Also check for role patterns: "Shift: Cashier", "Role: Manager", etc.
  if (!title) {
    const roleMatch = text.match(/(?:shift|role|position|as)[\s:]+([A-Za-z\s]+?)(?:\s+\d|$|\s+@|\s+at)/i);
    if (roleMatch) {
      title = roleMatch[1].trim();
    }
  }

  // If location spans multiple lines, combine them intelligently
  if (!location && locationLines.length > 0) {
    // Join location lines, removing common prefixes/suffixes
    const combined = locationLines
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract company name and address
    // Pattern: "COMPANY NAME - (SITE CODE ID # 1234) - ADDRESS"
    const companyMatch = combined.match(/^([A-Z][A-Z\s&]+?)(?:\s*-\s*\([^)]+\))?(?:\s*-\s*)?(.+?)(?:\s*\([^)]+\))?$/);
    if (companyMatch) {
      const company = companyMatch[1].trim();
      const address = companyMatch[2]?.trim() || '';
      
      // Build location: "Company Name - Address"
      if (address && address.length > 10) {
        location = `${company} - ${address}`;
      } else {
        location = company;
      }
    } else if (combined.length > 10) {
      location = combined;
    }
  }

  // Clean up location - remove site code patterns but keep the rest
  if (location) {
    // Remove "(SITE CODE ID # 1234)" but keep the rest
    location = location.replace(/\s*\(SITE\s+CODE\s+ID\s+#\s*\d+\)\s*/gi, ' ');
    location = location.replace(/\s+/g, ' ').trim();
    if (location.length < 5) location = null;
  }

  // Default title
  if (!title) {
    title = 'Work Shift';
  }

  return { location, title };
}

// Fallback parser - more lenient, tries to find any date/time patterns
function parseShiftsFallback(text: string): ParsedShift[] {
  const shifts: ParsedShift[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const currentYear = new Date().getFullYear();
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Look for any date pattern - be very lenient
    let dateStr: string | null = null;
    let month = 0;
    let day = 0;
    
    // Try "Wed Dec-3" or "Dec-3" or "Dec 3"
    const dateMatch = lowerLine.match(/(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*(\d{1,2})/i) ||
                     lowerLine.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]*(\d{1,2})/i);
    
    if (dateMatch) {
      month = monthNames.indexOf(dateMatch[1].toLowerCase().slice(0, 3)) + 1;
      day = parseInt(dateMatch[2]);
      if (month && day) {
        dateStr = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }
    
    if (!dateStr) continue;
    
    // Look for times in current line or next 2 lines
    let times: { hour: number; minute: number }[] = [];
    let timeLineIndex = i;
    
    for (let j = i; j < Math.min(i + 3, lines.length); j++) {
      const checkLine = lines[j];
      const foundTimes = extractTimesFromLine(checkLine);
      if (foundTimes.length >= 2) {
        times = foundTimes;
        timeLineIndex = j;
        break;
      }
    }
    
    if (times.length < 2) continue;
    
    // Get location from following lines
    const locationLines: string[] = [];
    for (let j = timeLineIndex + 1; j < Math.min(timeLineIndex + 5, lines.length); j++) {
      const locLine = lines[j];
      if (locLine.length > 10 && 
          !locLine.match(/(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) &&
          !locLine.match(/^\d{1,2}:\d{2}\s*[ap]/i)) {
        locationLines.push(locLine);
      } else if (locLine.match(/(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
        break;
      }
    }
    
    const startTime = `${times[0].hour.toString().padStart(2, '0')}:${times[0].minute.toString().padStart(2, '0')}:00`;
    const endTime = `${times[1].hour.toString().padStart(2, '0')}:${times[1].minute.toString().padStart(2, '0')}:00`;
    
    const combinedText = locationLines.join(' ');
    const { location, title } = extractLocationAndTitle(combinedText, lines, timeLineIndex, locationLines);
    
    shifts.push({
      date: dateStr,
      startTime,
      endTime,
      location,
      title,
      rawText: [line, ...lines.slice(i + 1, timeLineIndex + locationLines.length + 1)].join(' | ')
    });
    
    i = timeLineIndex + locationLines.length;
  }
  
  return shifts;
}

export { router as shiftsRouter };

