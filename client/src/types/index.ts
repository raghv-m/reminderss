export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  timezone?: string;
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

