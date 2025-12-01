const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export function setUserId(id: string): void {
  localStorage.setItem('userId', id);
}

export function clearUserId(): void {
  localStorage.removeItem('userId');
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const userId = getUserId();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId || '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth
export async function getGoogleAuthUrl(): Promise<{ url: string }> {
  return fetchAPI('/api/auth/google/url');
}

export async function getCurrentUser() {
  return fetchAPI('/api/auth/me');
}

export async function updateUser(data: { phone?: string; timezone?: string; name?: string }) {
  return fetchAPI('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Goals
export async function getGoals() {
  return fetchAPI('/api/goals');
}

export async function createGoal(data: {
  type: string;
  name: string;
  weekly_target: number;
  daily_hours?: number;
  preferred_times?: string[];
  priority?: number;
}) {
  return fetchAPI('/api/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGoal(goalId: string, data: Partial<{
  name: string;
  weekly_target: number;
  daily_hours: number;
  preferred_times: string[];
  priority: number;
  active: boolean;
}>) {
  return fetchAPI(`/api/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteGoal(goalId: string) {
  return fetchAPI(`/api/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export async function getCheckIns(goalId: string, days = 30) {
  return fetchAPI(`/api/goals/${goalId}/checkins?days=${days}`);
}

// Calendar
export async function getTodaySchedule() {
  return fetchAPI('/api/calendar/today');
}

export async function generateSchedule() {
  return fetchAPI('/api/calendar/generate', {
    method: 'POST',
  });
}

export async function getFreeSlots(date?: string) {
  const query = date ? `?date=${date}` : '';
  return fetchAPI(`/api/calendar/free-slots${query}`);
}

export async function completeEvent(eventId: string) {
  return fetchAPI(`/api/calendar/events/${eventId}/complete`, {
    method: 'POST',
  });
}

// Stats
export async function getStats() {
  return fetchAPI('/api/stats');
}

// Progress
export async function getWeeklyProgress() {
  return fetchAPI('/api/progress/weekly');
}

export async function getMonthlyProgress() {
  return fetchAPI('/api/progress/monthly');
}

// Stripe/Billing
export async function createCheckoutSession(planId: string): Promise<{ url: string }> {
  return fetchAPI('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

export async function getSubscriptionStatus() {
  return fetchAPI('/api/billing/status');
}

export async function cancelSubscription() {
  return fetchAPI('/api/billing/cancel', {
    method: 'POST',
  });
}

// Shifts (Work Schedule)
export async function uploadScheduleImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const userId = localStorage.getItem('userId');
  const response = await fetch(`${API_URL}/api/shifts/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': userId || '',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export async function getShifts() {
  return fetchAPI('/api/shifts');
}

export async function addShift(date: string, startTime: string, endTime: string) {
  return fetchAPI('/api/shifts', {
    method: 'POST',
    body: JSON.stringify({ date, startTime, endTime }),
  });
}

export async function deleteShift(shiftId: string) {
  return fetchAPI(`/api/shifts/${shiftId}`, {
    method: 'DELETE',
  });
}

