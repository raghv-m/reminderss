import { useState, useEffect, useRef } from 'react';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight, Upload, Briefcase, Trash2, Plus, Loader2, CloudUpload, MapPin, Clock, Check } from 'lucide-react';
import { ScheduleCard } from '../components/ScheduleCard';
import { getTodaySchedule, generateSchedule, completeEvent, uploadScheduleImage, getShifts, addShift, deleteShift, syncShiftsToCalendar } from '../lib/api';
import { useToast } from '../components/Toast';
import type { ScheduledEvent, Shift } from '../types';

export function Schedule() {
  const [schedule, setSchedule] = useState<ScheduledEvent[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShift, setNewShift] = useState({ date: '', startTime: '', endTime: '', location: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadSchedule();
    loadShifts();
  }, [selectedDate]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await getTodaySchedule();
      setSchedule(data as ScheduledEvent[]);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data as Shift[]);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadScheduleImage(file) as { 
        shifts: Shift[], 
        parsed: number, 
        synced?: number,
        message?: string,
        calendarErrors?: any[]
      };
      
      let message = `✅ Parsed ${result.parsed} shifts from your schedule!`;
      if (result.synced !== undefined) {
        message += ` ${result.synced} synced to Google Calendar with driving time.`;
      }
      if (result.message) {
        message = result.message;
      }
      
      showToast(message, 'success');
      loadShifts();
      loadSchedule(); // Reload schedule in case shifts were added
    } catch (error: any) {
      showToast(error.message || 'Failed to parse schedule', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddShift = async () => {
    if (!newShift.date || !newShift.startTime || !newShift.endTime) {
      showToast('Fill in all fields', 'error');
      return;
    }
    try {
      await addShift(newShift.date, newShift.startTime + ':00', newShift.endTime + ':00', newShift.location);
      showToast('Shift added!', 'success');
      setShowAddShift(false);
      setNewShift({ date: '', startTime: '', endTime: '', location: '' });
      loadShifts();
    } catch (error) {
      showToast('Failed to add shift', 'error');
    }
  };

  const handleSyncToCalendar = async () => {
    setSyncing(true);
    try {
      const result = await syncShiftsToCalendar() as any;
      if (result.synced > 0) {
        showToast(`✅ Synced ${result.synced} shifts to Google Calendar with driving time! ❄️`, 'success');
      } else {
        showToast('No new shifts to sync', 'success');
      }
      loadShifts();
    } catch (error: any) {
      showToast(error.message || 'Failed to sync to calendar', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await deleteShift(id);
      setShifts(shifts.filter(s => s.id !== id));
      showToast('Shift deleted', 'success');
    } catch (error) {
      showToast('Failed to delete shift', 'error');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateSchedule() as { success?: boolean; events?: ScheduledEvent[]; error?: string };
      if (result.success && result.events) {
        setSchedule(result.events);
        showToast(`✅ Generated ${result.events.length} scheduled events!`, 'success');
        loadSchedule(); // Reload to get fresh data
      } else if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Schedule generated successfully!', 'success');
        loadSchedule(); // Reload to get fresh data
      }
    } catch (error: any) {
      console.error('Failed to generate schedule:', error);
      showToast(error.message || 'Failed to generate schedule', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeEvent(id);
      setSchedule(schedule.map(e => 
        e.id === id ? { ...e, status: 'completed' } : e
      ));
    } catch (error) {
      console.error('Failed to complete event:', error);
    }
  };

  const handleSkip = async (id: string) => {
    setSchedule(schedule.map(e => 
      e.id === id ? { ...e, status: 'skipped' } : e
    ));
  };

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const completedCount = schedule.filter(e => e.status === 'completed').length;
  const totalCount = schedule.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Schedule</h1>
          <p className="text-dark-400">Upload your work shifts, then generate around them</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={shifts.length === 0 ? 'Will generate schedule for your goals. Add work shifts to schedule around them.' : 'Generate optimized schedule'}
        >
          <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate Schedule'}
        </button>
      </div>

      {/* Work Shifts Section */}
      <div className="card border-2 border-dashed border-dark-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold">Your Work Shifts</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowAddShift(!showAddShift)} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Add Manually
            </button>
            <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Processing...' : 'Upload Screenshot'}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {shifts.filter(s => !s.synced_to_calendar).length > 0 && (
              <button onClick={handleSyncToCalendar} disabled={syncing} className="btn-primary flex items-center gap-2 text-sm">
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                {syncing ? 'Syncing...' : `Sync ${shifts.filter(s => !s.synced_to_calendar).length} to Calendar`}
              </button>
            )}
          </div>
        </div>

        {/* Add Shift Form */}
        {showAddShift && (
          <div className="bg-dark-800 p-4 rounded-lg mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Date</label>
              <input type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Start</label>
              <input type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">End</label>
              <input type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Location</label>
              <input type="text" value={newShift.location} onChange={e => setNewShift({ ...newShift, location: e.target.value })} className="input" placeholder="e.g., Downtown" />
            </div>
            <button onClick={handleAddShift} className="btn-primary">Add</button>
          </div>
        )}

        {/* Shifts List */}
        {shifts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shifts.map(shift => (
              <div key={shift.id} className={`bg-dark-800 p-3 rounded-lg flex justify-between items-start ${shift.synced_to_calendar ? 'border-l-4 border-green-500' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    {shift.synced_to_calendar && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-dark-400 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                  </p>
                  {shift.location && (
                    <p className="text-dark-500 text-xs flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {shift.location}
                    </p>
                  )}
                </div>
                <button onClick={() => handleDeleteShift(shift.id)} className="text-red-500 hover:text-red-400 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-400">
            <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No work shifts yet</p>
            <p className="text-sm">Upload a screenshot of your work schedule or add shifts manually</p>
          </div>
        )}
      </div>

      {/* Date Navigator */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-2xl font-bold">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <p className="text-dark-400">
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            {isToday && (
              <span className="inline-block mt-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm">
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-400">Daily Progress</span>
              <span className="font-medium">{completedCount}/{totalCount} completed</span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-green-500 transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Schedule List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-16 bg-dark-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : schedule.length > 0 ? (
        <div className="space-y-4">
          {schedule.map((event) => (
            <ScheduleCard
              key={event.id}
              event={event}
              onComplete={handleComplete}
              onSkip={handleSkip}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Calendar className="w-16 h-16 text-dark-600 mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">No events scheduled</h3>
          <p className="text-dark-400 mb-6">
            Generate a schedule based on your goals and calendar
          </p>
          <button onClick={handleGenerate} className="btn-primary">
            Generate Schedule
          </button>
        </div>
      )}
    </div>
  );
}

