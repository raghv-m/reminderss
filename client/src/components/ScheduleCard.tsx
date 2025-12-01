import { Check, X, Clock, Dumbbell, BookOpen, Briefcase } from 'lucide-react';
import type { ScheduledEvent } from '../types';

interface ScheduleCardProps {
  event: ScheduledEvent;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
}

const goalIcons = {
  gym: Dumbbell,
  study: BookOpen,
  work: Briefcase,
  custom: Clock,
};

const goalColors = {
  gym: 'from-orange-500 to-red-500',
  study: 'from-blue-500 to-indigo-500',
  work: 'from-green-500 to-emerald-500',
  custom: 'from-purple-500 to-pink-500',
};

export function ScheduleCard({ event, onComplete, onSkip }: ScheduleCardProps) {
  const goalType = (event.goal?.type || 'custom') as keyof typeof goalIcons;
  const Icon = goalIcons[goalType];
  const gradient = goalColors[goalType];

  const startTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = new Date(event.end_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isCompleted = event.status === 'completed';
  const isMissed = event.status === 'missed';
  const isSkipped = event.status === 'skipped';

  return (
    <div
      className={`card relative overflow-hidden ${
        isCompleted
          ? 'border-green-500/30 bg-green-500/5'
          : isMissed
          ? 'border-red-500/30 bg-red-500/5'
          : isSkipped
          ? 'border-dark-600/30 bg-dark-800/30 opacity-60'
          : ''
      }`}
    >
      {/* Gradient accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient}`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-dark-400 text-sm">
              {startTime} - {endTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {event.status === 'scheduled' && (
            <>
              <button
                onClick={() => onComplete?.(event.id)}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                title="Mark as completed"
              >
                <Check className="w-5 h-5 text-green-400" />
              </button>
              <button
                onClick={() => onSkip?.(event.id)}
                className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                title="Skip"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </>
          )}
          {isCompleted && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
              Completed ✓
            </span>
          )}
          {isMissed && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
              Missed
            </span>
          )}
          {isSkipped && (
            <span className="px-3 py-1 bg-dark-600 text-dark-400 rounded-lg text-sm font-medium">
              Skipped
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

