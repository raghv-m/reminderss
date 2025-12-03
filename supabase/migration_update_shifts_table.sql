-- Migration: Update shifts table to support new fields
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns if they don't exist
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS synced_to_calendar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Step 2: Migrate existing data from old format to new format
-- If you have existing shifts with start_at/end_at, convert them
DO $$
BEGIN
  -- Migrate start_at/end_at to date, start_time, end_time if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'start_at'
  ) THEN
    UPDATE public.shifts
    SET 
      date = DATE(start_at),
      start_time = TO_CHAR(start_at, 'HH24:MI:SS')::TIME,
      end_time = TO_CHAR(end_at, 'HH24:MI:SS')::TIME,
      title = COALESCE(role, 'Work Shift')
    WHERE date IS NULL AND start_at IS NOT NULL;
  END IF;
END $$;

-- Step 3: Add constraints and indexes
-- Add unique constraint for user_id, date, start_time combination
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shifts_user_date_time_unique'
  ) THEN
    ALTER TABLE public.shifts
    ADD CONSTRAINT shifts_user_date_time_unique 
    UNIQUE (user_id, date, start_time);
  END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON public.shifts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_synced ON public.shifts(synced_to_calendar) WHERE synced_to_calendar = false;

-- Step 4: Make new columns NOT NULL where appropriate (after migration)
-- Note: We'll keep them nullable for now to allow gradual migration

-- Step 5: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shifts_user_id_fkey'
  ) THEN
    ALTER TABLE public.shifts
    ADD CONSTRAINT shifts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 6: (Optional) Drop old columns if migration is complete and you want to clean up
-- Uncomment these lines ONLY after verifying all data has been migrated:
-- ALTER TABLE public.shifts DROP COLUMN IF EXISTS start_at;
-- ALTER TABLE public.shifts DROP COLUMN IF EXISTS end_at;
-- ALTER TABLE public.shifts DROP COLUMN IF EXISTS role;

-- Add comments for documentation
COMMENT ON COLUMN public.shifts.date IS 'Date of the work shift';
COMMENT ON COLUMN public.shifts.start_time IS 'Start time of the shift (HH:MM:SS)';
COMMENT ON COLUMN public.shifts.end_time IS 'End time of the shift (HH:MM:SS)';
COMMENT ON COLUMN public.shifts.location IS 'Location/address of the work shift';
COMMENT ON COLUMN public.shifts.title IS 'Title/role name for the shift';
COMMENT ON COLUMN public.shifts.raw_text IS 'Original OCR text from screenshot';
COMMENT ON COLUMN public.shifts.source IS 'Source of shift: upload, manual, or other';
COMMENT ON COLUMN public.shifts.synced_to_calendar IS 'Whether this shift has been synced to Google Calendar';
COMMENT ON COLUMN public.shifts.google_event_id IS 'Google Calendar event ID for the main work shift';

