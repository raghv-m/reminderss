import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  timezone: string;
  province_state?: string;
  country?: string;
  default_hourly_rate?: number;
  created_at: string;
  google_refresh_token?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'gym' | 'study' | 'work' | 'custom';
  name: string;
  weekly_target: number; // e.g., 5 times per week
  daily_hours?: number; // e.g., 4 hours for study
  preferred_times: string[]; // e.g., ['06:00-08:00', '20:00-22:00']
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
  created_at: string;
}

