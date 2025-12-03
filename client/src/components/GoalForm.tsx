import { useState } from 'react';
import { Dumbbell, BookOpen, Briefcase, Plus } from 'lucide-react';

interface GoalFormProps {
  onSubmit: (data: {
    type: string;
    name: string;
    weekly_target: number;
    daily_hours?: number;
    preferred_times: string[];
    relaxation_time_after?: number;
  }) => void;
  onCancel: () => void;
}

const goalTypes = [
  { id: 'gym', label: 'Gym', icon: Dumbbell, color: 'from-orange-500 to-red-500' },
  { id: 'study', label: 'Study', icon: BookOpen, color: 'from-blue-500 to-indigo-500' },
  { id: 'work', label: 'Work', icon: Briefcase, color: 'from-green-500 to-emerald-500' },
  { id: 'custom', label: 'Custom', icon: Plus, color: 'from-purple-500 to-pink-500' },
];

export function GoalForm({ onSubmit, onCancel }: GoalFormProps) {
  const [type, setType] = useState('gym');
  const [name, setName] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(5);
  const [dailyHours, setDailyHours] = useState(2);
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['06:00-08:00']);
  const [relaxationTime, setRelaxationTime] = useState(15); // default 15 minutes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      name: name || goalTypes.find(g => g.id === type)?.label || 'Goal',
      weekly_target: weeklyTarget,
      daily_hours: (type === 'study' || type === 'work') ? dailyHours : undefined,
      preferred_times: preferredTimes,
      relaxation_time_after: relaxationTime,
    });
  };

  const addTimeSlot = () => {
    setPreferredTimes([...preferredTimes, '18:00-20:00']);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-3">
          Goal Type
        </label>
        <div className="grid grid-cols-4 gap-3">
          {goalTypes.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                type === id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-700 hover:border-dark-500'
              }`}
            >
              <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Goal Name */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Goal Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={goalTypes.find(g => g.id === type)?.label}
          className="input w-full"
        />
      </div>

      {/* Weekly Target */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Weekly Target (days per week)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setWeeklyTarget(n)}
              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                weeklyTarget === n
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Hours (for study and work) */}
      {(type === 'study' || type === 'work') && (
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Daily Hours Target
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
            className="input w-32"
          />
          <p className="text-xs text-dark-400 mt-1">
            {type === 'study' ? 'Hours of study per day' : 'Hours of work per day'}
          </p>
        </div>
      )}

      {/* Relaxation/Travel Time After Goal */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Relaxation/Travel Time After This Goal (minutes)
        </label>
        <p className="text-xs text-dark-400 mb-2">
          How much time do you need to relax or travel after completing this goal?
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={0}
            max={120}
            value={relaxationTime}
            onChange={(e) => setRelaxationTime(Number(e.target.value))}
            className="input w-32"
          />
          <span className="text-sm text-dark-400">minutes</span>
        </div>
        <div className="flex gap-2 mt-2">
          {[0, 15, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setRelaxationTime(mins)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                relaxationTime === mins
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Times */}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-2">
          Preferred Time Slots
        </label>
        {preferredTimes.map((time, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={time}
              onChange={(e) => {
                const newTimes = [...preferredTimes];
                newTimes[index] = e.target.value;
                setPreferredTimes(newTimes);
              }}
              placeholder="06:00-08:00"
              className="input"
            />
            {preferredTimes.length > 1 && (
              <button
                type="button"
                onClick={() => setPreferredTimes(preferredTimes.filter((_, i) => i !== index))}
                className="text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTimeSlot}
          className="text-primary-400 hover:text-primary-300 text-sm"
        >
          + Add another time slot
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn-primary flex-1">
          Create Goal
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

