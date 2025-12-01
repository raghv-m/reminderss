import { Router } from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

    // Parse the text to extract shifts
    const shifts = parseShifts(rawText);
    console.log('📅 Parsed shifts:', shifts);

    if (shifts.length === 0) {
      return res.status(400).json({ 
        error: 'Could not parse any shifts from image', 
        rawText 
      });
    }

    // Save shifts to database
    const savedShifts = [];
    for (const shift of shifts) {
      const { data, error } = await supabase
        .from('shifts')
        .upsert({
          user_id: userId,
          date: shift.date,
          start_time: shift.startTime,
          end_time: shift.endTime,
          raw_text: shift.rawText,
          source: 'upload'
        }, { onConflict: 'user_id,date,start_time' })
        .select()
        .single();

      if (data) savedShifts.push(data);
    }

    res.json({ 
      success: true, 
      shifts: savedShifts,
      rawText,
      parsed: shifts.length
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
  const { date, startTime, endTime } = req.body;
  
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
        source: 'manual'
      }, { onConflict: 'user_id,date,start_time' })
      .select()
      .single();

    if (error) throw error;
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add shift' });
  }
});

// Parse shifts from OCR text
function parseShifts(text: string): { date: string; startTime: string; endTime: string; rawText: string }[] {
  const shifts: { date: string; startTime: string; endTime: string; rawText: string }[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const currentYear = new Date().getFullYear();

  // Common patterns for work schedules
  // Pattern 1: "Mon Dec 2 15:00-21:00" or "Monday December 2 3pm-9pm"
  // Pattern 2: "12/2 15:00 - 21:00"
  // Pattern 3: "Dec 2: 3:00 PM - 9:00 PM"

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // Time pattern: 15:00, 3:00pm, 3pm, 15:00:00
  const timeRegex = /(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?/gi;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Try to find a date in the line
    let dateStr: string | null = null;

    // Pattern: "Dec 2" or "December 2"
    const monthDayMatch = lowerLine.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})/i);
    if (monthDayMatch) {
      const month = monthNames.indexOf(monthDayMatch[1].toLowerCase().slice(0, 3)) + 1;
      const day = parseInt(monthDayMatch[2]);
      dateStr = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    // Pattern: "12/2" or "12-2"
    const numericDateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (!dateStr && numericDateMatch) {
      const month = parseInt(numericDateMatch[1]);
      const day = parseInt(numericDateMatch[2]);
      const year = numericDateMatch[3] ? (numericDateMatch[3].length === 2 ? 2000 + parseInt(numericDateMatch[3]) : parseInt(numericDateMatch[3])) : currentYear;
      dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    if (!dateStr) continue;

    // Find times in the line
    const times: { hour: number; minute: number }[] = [];
    let match;
    const timeRegexLocal = /(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?/gi;

    while ((match = timeRegexLocal.exec(line)) !== null) {
      let hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[4]?.toLowerCase();

      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;

      // Skip if this looks like a date (e.g., 12/2)
      if (hour > 0 && hour <= 24) {
        times.push({ hour, minute });
      }
    }

    // Need at least 2 times for start and end
    if (times.length >= 2) {
      const startTime = `${times[0].hour.toString().padStart(2, '0')}:${times[0].minute.toString().padStart(2, '0')}:00`;
      const endTime = `${times[1].hour.toString().padStart(2, '0')}:${times[1].minute.toString().padStart(2, '0')}:00`;

      shifts.push({
        date: dateStr,
        startTime,
        endTime,
        rawText: line
      });
    }
  }

  return shifts;
}

export { router as shiftsRouter };

