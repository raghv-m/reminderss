# DisciplineOS 🔥

Your personal accountability + auto-scheduling coach that texts you every day, asks for proof, syncs with Google Calendar, and never lets you skip.

## Features

- 📱 **Daily SMS Check-ins**: Morning texts asking if you hit the gym/studied, with photo proof support
- 📅 **Smart Scheduling**: Auto-creates optimal daily routine based on your goals and calendar
- 🔥 **Streak Tracking**: Visual progress tracking with streaks and completion rates
- 📸 **Proof System**: Send photos/videos via SMS as accountability proof
- ⏰ **Smart Reminders**: Follow-up texts if you miss scheduled activities
- 🎯 **Goal Management**: Set gym sessions/week, study hours/day, preferred times

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **SMS**: Twilio
- **Calendar**: Google Calendar API
- **Hosting**: Vercel (frontend) + Render (backend)

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Twilio account
- Google Cloud Console project with Calendar API enabled

### Installation

1. Clone and install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:

**Client** (`client/.env`):
```
VITE_API_URL=http://localhost:3001
```

**Server** (`server/.env`):
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

3. Set up the database:
   - Go to your Supabase project
   - Run the SQL in `supabase/schema.sql`

4. Start development:
```bash
npm run dev
```

## How It Works

1. **Morning (7 AM)**: Receive SMS: "Did you hit the gym yesterday? Did you study?"
2. **Reply**: "Yes Yes" or send a gym selfie as proof
3. **8 AM**: App pulls your Google Calendar and generates optimal schedule
4. **Throughout the day**: Reminders 15 min before each scheduled activity
5. **If you miss**: Follow-up texts until you complete or skip

## API Endpoints

- `GET /api/auth/google/url` - Get Google OAuth URL
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Create a goal
- `GET /api/calendar/today` - Get today's schedule
- `POST /api/calendar/generate` - Generate new schedule
- `POST /api/twilio/webhook` - Twilio SMS webhook

## License

MIT

