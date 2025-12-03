export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  timezone?: string;
  province_state?: string;
  country?: string;
  default_hourly_rate?: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'gym' | 'study' | 'work' | 'custom';
  name: string;
  weekly_target: number;
  daily_hours?: number;
  preferred_times: string[];
  priority: number;
  active: boolean;
  relaxation_time_after?: number; // minutes of relaxation/travel time after this goal
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  goal_id: string;
  date: string;
  completed: boolean;
  proof_url?: string;
  proof_type?: 'image' | 'video';
  notes?: string;
  created_at: string;
}

export interface ScheduledEvent {
  id: string;
  user_id: string;
  goal_id: string;
  google_event_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  date: string;
  status: 'scheduled' | 'completed' | 'missed' | 'skipped';
  reminded: boolean;
  goal?: Goal;
}

export interface Stats {
  gymStreak: number;
  studyStreak: number;
  weeklyGymCompletions: number;
  weeklyStudyHours: number;
  totalCheckins: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  job_title?: string;
  hourly_rate?: number;
  job_description?: string;
  hobbies?: string[];
  bio?: string;
  workplace_location?: string;
  default_reminder_minutes?: number;
  theme?: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export interface Accomplishment {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string;
  photo_url?: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  total_pay: number;
  paid: boolean;
  notes?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  shift_reminders: boolean;
  goal_notifications: boolean;
  weekly_summary: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  reminder_minutes_before: number;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  title?: string;
  hourly_rate?: number;
  break_minutes?: number;
  notes?: string;
  google_event_id?: string;
  synced_to_calendar: boolean;
  source: string;
  raw_text?: string;
  created_at: string;
}

