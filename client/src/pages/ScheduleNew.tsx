import { useState, useEffect } from 'react';
import { Calendar, Briefcase, Plus, Trash2, Check } from 'lucide-react';
import { ShiftUploader } from '../components/ShiftUploader';
import { ShiftConfirmationModal } from '../components/ShiftConfirmationModal';
import { useToast } from '../components/Toast';
import { getShifts, addShiftsBatch, deleteShift } from '../lib/api';
import { ParsedShift } from '../lib/shiftParser';
import type { Shift } from '../types';

export function ScheduleNew() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsedShifts, setParsedShifts] = useState<ParsedShift[] | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newShift, setNewShift] = useState({ date: '', startTime: '', endTime: '', title: '', location: '' });
  const { showToast } = useToast();

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data as Shift[]);
    } catch (error) {
      console.error('Failed to load shifts:', error);
      showToast('Failed to load shifts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShiftsParsed = (shifts: ParsedShift[]) => {
    setParsedShifts(shifts);
  };

  const handleConfirmShifts = async (confirmedShifts: ParsedShift[]) => {
    try {
      // Convert ParsedShift to API format
      const shiftsToAdd = confirmedShifts.map(shift => ({
        date: shift.date,
        startTime: shift.startTime + ':00',
        endTime: shift.endTime + ':00',
        location: shift.location,
        title: shift.title || 'Work Shift',
      }));

      await addShiftsBatch(shiftsToAdd);
      
      showToast(`✅ Added ${confirmedShifts.length} shift${confirmedShifts.length !== 1 ? 's' : ''}! ${
        confirmedShifts.length > 0 ? 'Syncing to Google Calendar...' : ''
      }`, 'success');
      
      setParsedShifts(null);
      loadShifts();
    } catch (error: any) {
      showToast(error.message || 'Failed to save shifts', 'error');
    }
  };

  const handleCancelConfirmation = () => {
    setParsedShifts(null);
  };

  const handleOCRError = (error: string) => {
    showToast(error, 'error');
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

  const handleAddManualShift = async () => {
    if (!newShift.date || !newShift.startTime || !newShift.endTime) {
      showToast('Fill in all required fields', 'error');
      return;
    }

    try {
      await addShiftsBatch([{
        date: newShift.date,
        startTime: newShift.startTime + ':00',
        endTime: newShift.endTime + ':00',
        title: newShift.title || 'Work Shift',
        location: newShift.location || undefined,
      }]);

      showToast('Shift added!', 'success');
      setShowManualAdd(false);
      setNewShift({ date: '', startTime: '', endTime: '', title: '', location: '' });
      loadShifts();
    } catch (error) {
      showToast('Failed to add shift', 'error');
    }
  };

  const groupShiftsByWeek = (shifts: Shift[]) => {
    const grouped: { [key: string]: Shift[] } = {};
    
    shifts.forEach(shift => {
      const date = new Date(shift.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(shift);
    });

    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const groupedShifts = groupShiftsByWeek(shifts);

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Work Schedule</h1>
        <p className="text-dark-400">Upload your schedule screenshot or add shifts manually</p>
      </div>

      {/* Upload Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold">Add Shifts</h2>
          </div>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </button>
        </div>

        {showManualAdd && (
          <div className="mb-6 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Date *</label>
                <input
                  type="date"
                  value={newShift.date}
                  onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Start Time *</label>
                <input
                  type="time"
                  value={newShift.startTime}
                  onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">End Time *</label>
                <input
                  type="time"
                  value={newShift.endTime}
                  onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Title</label>
                <input
                  type="text"
                  value={newShift.title}
                  onChange={e => setNewShift({ ...newShift, title: e.target.value })}
                  placeholder="Work Shift"
                  className="input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-dark-400 mb-2">Location</label>
                <input
                  type="text"
                  value={newShift.location}
                  onChange={e => setNewShift({ ...newShift, location: e.target.value })}
                  placeholder="Optional"
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddManualShift} className="btn-primary">
                Add Shift
              </button>
              <button onClick={() => setShowManualAdd(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        <ShiftUploader 
          onShiftsParsed={handleShiftsParsed}
          onError={handleOCRError}
        />
      </div>

      {/* Shifts List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary-500" />
            Your Shifts
          </h2>
          <p className="text-dark-400">{shifts.length} shift{shifts.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-dark-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : shifts.length > 0 ? (
          <div className="space-y-6">
            {groupedShifts.map(([weekStart, weekShifts]) => {
              const weekStartDate = new Date(weekStart);
              const weekEndDate = new Date(weekStartDate);
              weekEndDate.setDate(weekEndDate.getDate() + 6);

              return (
                <div key={weekStart} className="card">
                  <h3 className="text-lg font-semibold mb-4 text-dark-300">
                    Week of {weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {
                      weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  </h3>
                  
                  <div className="space-y-3">
                    {weekShifts.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)).map(shift => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary-500/10 rounded-lg border border-primary-500/30">
                            <p className="text-xs text-primary-400 font-medium">
                              {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                            </p>
                            <p className="text-lg font-bold text-primary-400">
                              {new Date(shift.date).getDate()}
                            </p>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold">{shift.title || 'Work Shift'}</h4>
                              {shift.synced_to_calendar && (
                                <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                  <Check className="w-3 h-3" />
                                  Synced
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-dark-400">
                              <span className="flex items-center gap-1">
                                🕐 {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                              </span>
                              <span>
                                ({calculateDuration(shift.start_time, shift.end_time)}h)
                              </span>
                              {shift.location && (
                                <span className="flex items-center gap-1">
                                  📍 {shift.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          title="Delete shift"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Briefcase className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-dark-300">No shifts yet</h3>
            <p className="text-dark-400 mb-6">
              Upload a screenshot of your work schedule or add shifts manually
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {parsedShifts && (
        <ShiftConfirmationModal
          shifts={parsedShifts}
          onConfirm={handleConfirmShifts}
          onCancel={handleCancelConfirmation}
          syncToCalendar={true}
        />
      )}
    </div>
  );
}
