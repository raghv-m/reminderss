import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Briefcase, Check, AlertCircle, Trash2 } from 'lucide-react';
import { ParsedShift, validateShift } from '../lib/shiftParser';

interface ShiftConfirmationModalProps {
  shifts: ParsedShift[];
  onConfirm: (shifts: ParsedShift[]) => void;
  onCancel: () => void;
  syncToCalendar?: boolean;
}

export function ShiftConfirmationModal({ 
  shifts: initialShifts, 
  onConfirm, 
  onCancel,
  syncToCalendar = true 
}: ShiftConfirmationModalProps) {
  const [shifts, setShifts] = useState(initialShifts);
  const [, setEditingIndex] = useState<number | null>(null);

  const handleEdit = (index: number, field: keyof ParsedShift, value: string) => {
    const updated = [...shifts];
    updated[index] = { ...updated[index], [field]: value };
    setShifts(updated);
  };

  const handleDelete = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    // Validate all shifts
    const validShifts = shifts.filter(shift => validateShift(shift).length === 0);
    if (validShifts.length === 0) {
      alert('Please fix all errors before confirming');
      return;
    }
    onConfirm(validShifts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-2xl font-bold">Confirm Shifts</h2>
            <p className="text-sm text-dark-400 mt-1">
              Review and edit before saving • {shifts.length} shift{shifts.length !== 1 ? 's' : ''} detected
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Shifts List */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-4">
          {shifts.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No shifts to confirm</p>
            </div>
          ) : (
            shifts.map((shift, index) => {
              const errors = validateShift(shift);

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    errors.length > 0
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </label>
                        <input
                          type="date"
                          value={shift.date}
                          onChange={(e) => handleEdit(index, 'date', e.target.value)}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          className="input w-full"
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                          <Clock className="w-4 h-4" />
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => handleEdit(index, 'startTime', e.target.value)}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          className="input w-full"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                          <Clock className="w-4 h-4" />
                          End Time
                        </label>
                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => handleEdit(index, 'endTime', e.target.value)}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          className="input w-full"
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                          <Briefcase className="w-4 h-4" />
                          Title
                        </label>
                        <input
                          type="text"
                          value={shift.title || ''}
                          onChange={(e) => handleEdit(index, 'title', e.target.value)}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          placeholder="Work Shift"
                          className="input w-full"
                        />
                      </div>

                      {/* Location */}
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm text-dark-400 mb-2">
                          <MapPin className="w-4 h-4" />
                          Location (optional)
                        </label>
                        <input
                          type="text"
                          value={shift.location || ''}
                          onChange={(e) => handleEdit(index, 'location', e.target.value)}
                          onFocus={() => setEditingIndex(index)}
                          onBlur={() => setEditingIndex(null)}
                          placeholder="Add location..."
                          className="input w-full"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {errors.length === 0 ? (
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        title="Delete shift"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Errors */}
                  {errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400 font-medium mb-1">Errors:</p>
                      <ul className="text-xs text-red-400 list-disc list-inside space-y-1">
                        {errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence Badge */}
                  {shift.confidence && (
                    <div className="mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        shift.confidence >= 0.8 
                          ? 'bg-green-500/20 text-green-400' 
                          : shift.confidence >= 0.6
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {Math.round(shift.confidence * 100)}% confidence
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-700 bg-dark-800/50">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            {syncToCalendar && (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Will sync to Google Calendar</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary px-6">
              Cancel
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={shifts.length === 0}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm {shifts.length} Shift{shifts.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
