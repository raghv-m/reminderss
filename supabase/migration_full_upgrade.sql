-- ==========================================
-- ULTIMATE SHIFT SCHEDULER - FULL MIGRATION
-- ==========================================
-- Run this in your Supabase SQL Editor
-- This adds all tables and columns needed for the upgraded app

-- ==========================================
-- 1. PROFILES TABLE (Extended User Data)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  job_title TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  job_description TEXT,
  hobbies TEXT[], -- Array of hobby strings
  bio TEXT,
  workplace_location TEXT,
  default_reminder_minutes INTEGER DEFAULT 60,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. ACCOMPLISHMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. PAYROLL RECORDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start, period_end)
);

-- ==========================================
-- 4. NOTIFICATION PREFERENCES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  shift_reminders BOOLEAN DEFAULT true,
  goal_notifications BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. PUSH SUBSCRIPTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. EXTEND GOALS TABLE
-- ==========================================
-- Add new columns to existing goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('work', 'personal', 'health', 'education', 'other'));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing goals to have title from name
UPDATE goals SET title = name WHERE title IS NULL;

-- ==========================================
-- 7. EXTEND SHIFTS TABLE (if needed)
-- ==========================================
-- Most columns already exist from previous migrations, but ensure all are present
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_accomplishments_user_id ON accomplishments(user_id);
CREATE INDEX IF NOT EXISTS idx_accomplishments_date ON accomplishments(date);
CREATE INDEX IF NOT EXISTS idx_payroll_user_id ON payroll_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. RLS POLICIES
-- ==========================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Accomplishments policies
DROP POLICY IF EXISTS "Users can view own accomplishments" ON accomplishments;
CREATE POLICY "Users can view own accomplishments" ON accomplishments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own accomplishments" ON accomplishments;
CREATE POLICY "Users can insert own accomplishments" ON accomplishments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accomplishments" ON accomplishments;
CREATE POLICY "Users can update own accomplishments" ON accomplishments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accomplishments" ON accomplishments;
CREATE POLICY "Users can delete own accomplishments" ON accomplishments
  FOR DELETE USING (auth.uid() = user_id);

-- Payroll policies
DROP POLICY IF EXISTS "Users can view own payroll" ON payroll_records;
CREATE POLICY "Users can view own payroll" ON payroll_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payroll" ON payroll_records;
CREATE POLICY "Users can insert own payroll" ON payroll_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payroll" ON payroll_records;
CREATE POLICY "Users can update own payroll" ON payroll_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view own notification prefs" ON notification_preferences;
CREATE POLICY "Users can view own notification prefs" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification prefs" ON notification_preferences;
CREATE POLICY "Users can update own notification prefs" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions policies
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Shifts policies
DROP POLICY IF EXISTS "Users can view own shifts" ON shifts;
CREATE POLICY "Users can view own shifts" ON shifts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shifts" ON shifts;
CREATE POLICY "Users can insert own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shifts" ON shifts;
CREATE POLICY "Users can update own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shifts" ON shifts;
CREATE POLICY "Users can delete own shifts" ON shifts
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 11. TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Profiles updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notification preferences updated_at trigger
DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 12. STORAGE BUCKETS SETUP (Run separately in Supabase Dashboard)
-- ==========================================
-- You'll need to create these buckets in the Supabase Storage UI:
-- 1. 'profile-photos' - public bucket
-- 2. 'accomplishment-photos' - public bucket
-- 
-- RLS policies for storage:
-- INSERT: authenticated users can upload
-- SELECT: public can view
-- UPDATE: users can update own files
-- DELETE: users can delete own files

-- ==========================================
-- 13. CREATE DEFAULT NOTIFICATION PREFERENCES FOR EXISTING USERS
-- ==========================================
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- 14. COMMENTS FOR DOCUMENTATION
-- ==========================================
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE accomplishments IS 'User accomplishments and wins';
COMMENT ON TABLE payroll_records IS 'Payroll tracking by period';
COMMENT ON TABLE notification_preferences IS 'User notification settings';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions';

COMMENT ON COLUMN profiles.hourly_rate IS 'Default hourly rate for shift calculations';
COMMENT ON COLUMN profiles.default_reminder_minutes IS 'Minutes before shift to send reminder';
COMMENT ON COLUMN shifts.hourly_rate IS 'Hourly rate for this specific shift (overrides profile default)';
COMMENT ON COLUMN shifts.break_minutes IS 'Unpaid break time in minutes';

-- ==========================================
-- MIGRATION COMPLETE! 
-- ==========================================
-- Next steps:
-- 1. Create storage buckets in Supabase Dashboard
-- 2. Set up Supabase Edge Functions
-- 3. Configure environment variables
-- ==========================================
