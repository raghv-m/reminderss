export interface ParsedShift {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location?: string;
  title?: string;
  confidence: number; // 0-1 score
}

/**
 * Parse OCR text to extract shift information
 * This handles various schedule formats
 */
export function parseShiftsFromText(text: string): ParsedShift[] {
  const shifts: ParsedShift[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  // Common date patterns
  const datePatterns = [
    // MM/DD/YYYY, MM/DD/YY
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{4}|\d{2}))/g,
    // Month DD, YYYY or Month DD
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?)/gi,
    // Day of week + date
    /((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\.?\s+\d{1,2}[\/\-]\d{1,2})/gi,
  ];

  // Location/title patterns (common keywords)
  const locationKeywords = [
    'store', 'branch', 'location', 'site', 'office', 'warehouse', 'clinic', 'hospital',
    'restaurant', 'cafe', 'shop', 'center', 'mall', 'plaza', 'ave', 'st', 'rd', 'blvd'
  ];

  const titleKeywords = [
    'shift', 'cashier', 'server', 'manager', 'supervisor', 'clerk', 'associate',
    'assistant', 'lead', 'coordinator', 'worker', 'staff', 'team member'
  ];

  let currentDate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Try to find date
    for (const pattern of datePatterns) {
      const dateMatch = pattern.exec(line);
      if (dateMatch) {
        const parsedDate = parseDate(dateMatch[0]);
        if (parsedDate) {
          currentDate = parsedDate;
          // Date found for potential shift
        }
        pattern.lastIndex = 0;
        break;
      }
    }

    // Try to find times
    const times: { hour: number; minute: number; isPM: boolean }[] = [];
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/g;
    let timeMatch;
    
    while ((timeMatch = timePattern.exec(line)) !== null) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toUpperCase();
      
      let isPM = false;
      if (meridiem === 'PM' && hour !== 12) {
        hour += 12;
        isPM = true;
      } else if (meridiem === 'AM' && hour === 12) {
        hour = 0;
      } else if (!meridiem && hour < 7) {
        // Assume PM for evening hours without meridiem
        hour += 12;
        isPM = true;
      }
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        times.push({ hour, minute, isPM });
      }
    }

    // If we found 2 times and have a date, create a shift
    if (times.length >= 2 && currentDate) {
      const startTime = `${String(times[0].hour).padStart(2, '0')}:${String(times[0].minute).padStart(2, '0')}`;
      const endTime = `${String(times[1].hour).padStart(2, '0')}:${String(times[1].minute).padStart(2, '0')}`;
      
      // Check for location
      const location = extractLocation(line, locationKeywords);
      
      // Check for title
      const title = extractTitle(line, titleKeywords);
      
      shifts.push({
        date: currentDate,
        startTime,
        endTime,
        location: location || undefined,
        title: title || 'Work Shift',
        confidence: 0.7 + (location ? 0.1 : 0) + (title ? 0.1 : 0),
      });
      
      // Shift added
    }
  }

  // Remove duplicates and sort by date
  const uniqueShifts = deduplicateShifts(shifts);
  return uniqueShifts.sort((a, b) => a.date.localeCompare(b.date));
}

function parseDate(dateStr: string): string | null {
  try {
    // Handle various date formats
    const cleaned = dateStr.trim();
    
    // Try parsing with Date constructor
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Try MM/DD/YYYY format
    const slashMatch = cleaned.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (slashMatch) {
      let month = parseInt(slashMatch[1]);
      let day = parseInt(slashMatch[2]);
      let year = parseInt(slashMatch[3]);
      
      if (year < 100) year += 2000;
      
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function extractLocation(text: string, keywords: string[]): string | null {
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    const index = lowerText.indexOf(keyword);
    if (index !== -1) {
      // Extract surrounding context (up to 30 chars before and after)
      const start = Math.max(0, index - 10);
      const end = Math.min(text.length, index + keyword.length + 20);
      return text.substring(start, end).trim();
    }
  }
  
  return null;
}

function extractTitle(text: string, keywords: string[]): string | null {
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  return null;
}

function deduplicateShifts(shifts: ParsedShift[]): ParsedShift[] {
  const seen = new Set<string>();
  return shifts.filter(shift => {
    const key = `${shift.date}-${shift.startTime}-${shift.endTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Validate a parsed shift
 */
export function validateShift(shift: ParsedShift): string[] {
  const errors: string[] = [];
  
  // Validate date
  const date = new Date(shift.date);
  if (isNaN(date.getTime())) {
    errors.push('Invalid date');
  }
  
  // Validate times
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(shift.startTime)) {
    errors.push('Invalid start time format');
  }
  if (!timeRegex.test(shift.endTime)) {
    errors.push('Invalid end time format');
  }
  
  // Check if end time is after start time
  if (shift.startTime >= shift.endTime) {
    errors.push('End time must be after start time');
  }
  
  return errors;
}
