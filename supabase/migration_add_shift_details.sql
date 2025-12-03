-- Migration: Add location, title, and google_event_id to shifts table
-- Run this in your Supabase SQL editor

-- Add new columns to shifts table
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS synced_to_calendar BOOLEAN DEFAULT false;

-- Add index for faster lookup of synced shifts
CREATE INDEX IF NOT EXISTS idx_shifts_google_event_id ON shifts(google_event_id);
CREATE INDEX IF NOT EXISTS idx_shifts_synced ON shifts(synced_to_calendar);

