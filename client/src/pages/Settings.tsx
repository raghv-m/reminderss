import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Globe, Calendar, CheckCircle, LogOut, DollarSign, Bell, Download, Trash2, Camera, MapPin, Briefcase, Heart, Mail, Clock, Zap, X, Plus, Sparkles } from 'lucide-react';
import { getCurrentUser, updateUser, getGoogleAuthUrl, logout } from '../lib/api';
import type { User as UserType } from '../types';

const timezones = [
  { value: 'America/Vancouver', label: 'Vancouver (PT)' },
  { value: 'America/Edmonton', label: 'Edmonton / Calgary (MT)' },
  { value: 'America/Winnipeg', label: 'Winnipeg (CT)' },
  { value: 'America/Toronto', label: 'Toronto / Montreal (ET)' },
  { value: 'America/Halifax', label: 'Halifax (AT)' },
  { value: 'America/St_Johns', label: "St. John's (NT)" },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'America/Denver', label: 'Denver (MT)' },
  { value: 'America/Chicago', label: 'Chicago (CT)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
];

interface ExtendedUser extends UserType {
  job_title?: string;
  job_description?: string;
  hobbies?: string[];
  bio?: string;
  workplace_location?: string;
  default_reminder_minutes?: number;
  photo_url?: string;
}

export function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/Edmonton');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [workplaceLocation, setWorkplaceLocation] = useState('');
  const [bio, setBio] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newHobby, setNewHobby] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(60);

  const [shiftReminders, setShiftReminders] = useState(true);
  const [goalNotifications, setGoalNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getCurrentUser() as ExtendedUser;
      setUser(data);
      setPhone(data.phone || '');
      setTimezone(data.timezone || 'America/Edmonton');
      setName(data.name || '');
      setJobTitle(data.job_title || '');
      setJobDescription(data.job_description || '');
      setWorkplaceLocation(data.workplace_location || '');
      setBio(data.bio || '');
      setHobbies(data.hobbies || []);
      setReminderMinutes(data.default_reminder_minutes || 60);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        phone,
        timezone,
        name,
        provinceState: user?.province_state,
        country: user?.country,
        defaultHourlyRate: user?.default_hourly_rate
      });
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

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/welcome');
    }
  };

  const addHobby = () => {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      setHobbies([...hobbies, newHobby.trim()]);
      setNewHobby('');
    }
  };

  const removeHobby = (hobby: string) => {
    setHobbies(hobbies.filter(h => h !== hobby));
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ user, hobbies, settings: { timezone, reminderMinutes, shiftReminders, goalNotifications, weeklySummary } }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disciplineos-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'work', label: 'Work & Payroll', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'data', label: 'Data & Privacy', icon: Download },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary-500" />
          Settings
        </h1>
        <p className="text-dark-400">Customize your DisciplineOS experience</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            {/* Profile Photo & Basic Info */}
            <div className="card">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-orange-500 flex items-center justify-center text-3xl font-bold">
                      {name ? name[0].toUpperCase() : 'U'}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-dark-700 rounded-full hover:bg-dark-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Full Name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                      <input type="email" value={user?.email || ''} disabled className="input w-full bg-dark-900/50 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone (SMS)
                      </label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input w-full" placeholder="+1 (825) 343-1168" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Timezone
                      </label>
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input w-full">
                        {timezones.map(tz => (<option key={tz.value} value={tz.value}>{tz.label}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Hobbies */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                About You
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Short Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input w-full h-24 resize-none" placeholder="Tell us about yourself..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Hobbies & Interests</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {hobbies.map(hobby => (
                      <span key={hobby} className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm flex items-center gap-1">
                        {hobby}
                        <button onClick={() => removeHobby(hobby)} className="hover:text-primary-300"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newHobby} onChange={(e) => setNewHobby(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addHobby()} className="input flex-1" placeholder="Add a hobby..." />
                    <button onClick={addHobby} className="btn-secondary"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Work & Payroll Tab */}
        {activeTab === 'work' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Work & Payroll Settings
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Job Title
                  </label>
                  <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input w-full" placeholder="e.g., Barista, Server" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Hourly Rate (CAD)
                  </label>
                  <input type="number" step="0.01" min="0" value={user?.default_hourly_rate || ''} onChange={(e) => setUser({ ...user!, default_hourly_rate: parseFloat(e.target.value) || 0 })} className="input w-full" placeholder="17.50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Workplace Location
                </label>
                <input type="text" value={workplaceLocation} onChange={(e) => setWorkplaceLocation(e.target.value)} className="input w-full" placeholder="e.g., Starbucks - Downtown Calgary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Country</label>
                  <select value={user?.country || 'Canada'} onChange={(e) => setUser({ ...user!, country: e.target.value })} className="input w-full">
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="United States">🇺🇸 United States</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">{user?.country === 'Canada' ? 'Province' : 'State'}</label>
                  <input type="text" value={user?.province_state || ''} onChange={(e) => setUser({ ...user!, province_state: e.target.value })} className="input w-full" placeholder="Alberta" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Job Description</label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="input w-full h-24 resize-none" placeholder="What do you do at work?" />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                <div>
                  <p className="font-medium">Shift Reminders</p>
                  <p className="text-sm text-dark-400">Get notified before your shifts</p>
                </div>
                <button onClick={() => setShiftReminders(!shiftReminders)} className={`w-12 h-6 rounded-full transition-colors ${shiftReminders ? 'bg-primary-500' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shiftReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                <div>
                  <p className="font-medium">Goal Notifications</p>
                  <p className="text-sm text-dark-400">Alerts for goal progress & completions</p>
                </div>
                <button onClick={() => setGoalNotifications(!goalNotifications)} className={`w-12 h-6 rounded-full transition-colors ${goalNotifications ? 'bg-primary-500' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${goalNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                <div>
                  <p className="font-medium">Weekly Summary</p>
                  <p className="text-sm text-dark-400">Email recap every Sunday</p>
                </div>
                <button onClick={() => setWeeklySummary(!weeklySummary)} className={`w-12 h-6 rounded-full transition-colors ${weeklySummary ? 'bg-primary-500' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${weeklySummary ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Reminder Time (minutes before shift)
                </label>
                <select value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))} className="input w-full">
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Connected Services
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-green-400">✓ Connected</p>
                  </div>
                </div>
                <button onClick={handleConnectGoogle} className="btn-secondary">Reconnect</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Email (Resend)</p>
                    <p className="text-sm text-dark-400">Coming soon</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-dark-700 rounded-full text-xs">Soon</span>
              </div>
            </div>
          </div>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === 'data' && (
          <>
            <div className="card">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-500" />
                Export Your Data
              </h3>
              <p className="text-dark-400 mb-4">Download all your data in JSON format</p>
              <button onClick={handleExportData} className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Data (JSON)
              </button>
            </div>
            <div className="card border-red-500/20">
              <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </h3>
              <p className="text-dark-400 mb-4">These actions are permanent and cannot be undone.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleLogout} className="btn-secondary text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
                <button className="btn-secondary text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-4">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-8">
            {saved ? <CheckCircle className="w-5 h-5" /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Changes'}
          </button>
          {saved && <span className="text-green-400 text-sm">✓ Settings saved successfully</span>}
        </div>
      </div>
    </div>
  );
}

