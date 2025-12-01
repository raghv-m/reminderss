import { useState, useEffect } from 'react';
import { User, Phone, Globe, Bell, Calendar, LogOut, CheckCircle } from 'lucide-react';
import { getCurrentUser, updateUser, getGoogleAuthUrl } from '../lib/api';
import type { User as UserType } from '../types';

const timezones = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export function Settings() {
  const [user, setUser] = useState<UserType | null>(null);
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data as UserType);
      setPhone((data as UserType).phone || '');
      setTimezone((data as UserType).timezone || 'America/Los_Angeles');
      setName((data as UserType).name || '');
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({ phone, timezone, name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { url } = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-500" />
          Profile
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input w-full bg-dark-900 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number (for SMS)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input w-full"
              placeholder="+1 (555) 123-4567"
            />
            <p className="text-xs text-dark-500 mt-1">
              We'll send daily check-ins and reminders to this number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input w-full"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Integrations
        </h2>

        <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
          <div className="flex items-center gap-4">
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" alt="Google" className="h-6 w-auto" />
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-dark-400">Sync your schedule automatically</p>
            </div>
          </div>
          <button onClick={handleConnectGoogle} className="btn-secondary">
            {user?.email ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saved ? <CheckCircle className="w-5 h-5" /> : null}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

