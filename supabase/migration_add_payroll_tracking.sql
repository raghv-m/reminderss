-- Migration: Add payroll and accomplishments tracking
-- Run this in your Supabase SQL Editor

-- Add payroll fields to shifts table
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS gross_pay DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS net_pay DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS province_state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Canada';

-- Add location fields to users for tax calculation
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS province_state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Canada',
ADD COLUMN IF NOT EXISTS default_hourly_rate DECIMAL(10,2);

-- Accomplishments tracking table
CREATE TABLE IF NOT EXISTS public.accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_completed DECIMAL(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_id, date)
);

-- Payroll summary table (monthly/weekly summaries)
CREATE TABLE IF NOT EXISTS public.payroll_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'biweekly', 'monthly')),
  total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_shifts INTEGER NOT NULL DEFAULT 0,
  gross_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
  province_state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_type)
);

-- Saved schedules table (store generated daily schedules)
CREATE TABLE IF NOT EXISTS public.saved_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  schedule_data JSONB NOT NULL, -- Store full schedule as JSON
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accomplishments_user_id ON public.accomplishments(user_id);
CREATE INDEX IF NOT EXISTS idx_accomplishments_date ON public.accomplishments(date);
CREATE INDEX IF NOT EXISTS idx_payroll_summaries_user_id ON public.payroll_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_summaries_period ON public.payroll_summaries(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_saved_schedules_user_id ON public.saved_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_schedules_date ON public.saved_schedules(date);

-- Comments
COMMENT ON COLUMN public.shifts.hourly_rate IS 'Hourly wage rate for this shift';
COMMENT ON COLUMN public.shifts.total_hours IS 'Total hours worked (including overtime if applicable)';
COMMENT ON COLUMN public.shifts.gross_pay IS 'Gross pay before taxes';
COMMENT ON COLUMN public.shifts.tax_rate IS 'Tax rate percentage applied';
COMMENT ON COLUMN public.shifts.tax_amount IS 'Tax amount deducted';
COMMENT ON COLUMN public.shifts.net_pay IS 'Net pay after taxes';
COMMENT ON TABLE public.accomplishments IS 'Track daily accomplishments and hours completed for goals';
COMMENT ON TABLE public.payroll_summaries IS 'Weekly/monthly payroll summaries';
COMMENT ON TABLE public.saved_schedules IS 'Store generated daily schedules for reference';

