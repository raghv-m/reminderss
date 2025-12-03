-- Migration: Add relaxation_time_after column to goals table
-- Run this in your Supabase SQL Editor if the column doesn't exist yet

ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS relaxation_time_after INTEGER DEFAULT 15;

COMMENT ON COLUMN goals.relaxation_time_after IS 'Minutes of relaxation/travel time needed after completing this goal';

