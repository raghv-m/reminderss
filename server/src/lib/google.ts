import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export { oauth2Client };

export function getAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function createCalendarClient(refreshToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth });
}

export async function getFreeBusySlots(
  refreshToken: string,
  date: Date
): Promise<{ start: Date; end: Date }[]> {
  const calendar = createCalendarClient(refreshToken);
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        items: [{ id: 'primary' }]
      }
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    return busySlots.map(slot => ({
      start: new Date(slot.start!),
      end: new Date(slot.end!)
    }));
  } catch (error) {
    console.error('Error fetching free/busy:', error);
    return [];
  }
}

export async function createCalendarEvent(
  refreshToken: string,
  event: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    reminders?: number[];
    colorId?: string;
  }
): Promise<string | null> {
  const calendar = createCalendarClient(refreshToken);

  // Use America/Edmonton for Canadian timezone (adjust as needed)
  const timeZone = 'America/Edmonton';

  try {
    console.log(`📅 Creating calendar event: ${event.title}`);
    console.log(`   Start: ${event.startTime.toISOString()}`);
    console.log(`   End: ${event.endTime.toISOString()}`);
    console.log(`   Location: ${event.location || 'None'}`);
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description || 'Scheduled by DisciplineOS',
        location: event.location || undefined,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone
        },
        reminders: {
          useDefault: false,
          overrides: (event.reminders || [15]).map(mins => ({
            method: 'popup',
            minutes: mins
          }))
        },
        colorId: event.colorId || '11' // Default red for discipline events
      }
    });

    const eventId = response.data.id || null;
    if (eventId) {
      console.log(`✅ Created calendar event with ID: ${eventId}`);
    } else {
      console.warn(`⚠️ Calendar event created but no ID returned`);
    }
    return eventId;
  } catch (error: any) {
    console.error('❌ Error creating calendar event:', error);
    console.error('   Error details:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    return null;
  }
}

