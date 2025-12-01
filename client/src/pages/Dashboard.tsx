import { useState, useEffect } from 'react';
import { Flame, Dumbbell, BookOpen, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ScheduleCard } from '../components/ScheduleCard';
import { getTodaySchedule, completeEvent, getStats } from '../lib/api';
import type { ScheduledEvent } from '../types';

interface Stats {
  streak: { current: number; longest: number };
  gym: { completed: number; target: number; remaining: number };
  study: { hours: number; target: number };
  completionRate: { value: number; totalEvents: number; completedEvents: number };
}

export function Dashboard() {
  const [schedule, setSchedule] = useState<ScheduledEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadSchedule(), loadStats()]);
  };

  const loadSchedule = async () => {
    try {
      const data = await getTodaySchedule();
      setSchedule(data as ScheduledEvent[]);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data as Stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeEvent(id);
      setSchedule(schedule.map(e =>
        e.id === id ? { ...e, status: 'completed' } : e
      ));
      // Reload stats after completing
      loadStats();
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{getGreeting()}, Champion! 🔥</h1>
        <p className="text-dark-400">{today} • Let's build discipline today</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-dark-800 rounded-lg" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Current Streak"
              value={`${stats?.streak.current || 0} days`}
              subtitle={`Longest: ${stats?.streak.longest || 0} days`}
              icon={<Flame className="w-6 h-6 text-orange-500" />}
            />
            <StatCard
              title="Gym This Week"
              value={`${stats?.gym.completed || 0}/${stats?.gym.target || 5}`}
              subtitle={stats?.gym.remaining ? `${stats.gym.remaining} more to go` : 'Target hit! 💪'}
              icon={<Dumbbell className="w-6 h-6 text-red-500" />}
            />
            <StatCard
              title="Study Hours"
              value={`${stats?.study.hours || 0}h`}
              subtitle={`Target: ${stats?.study.target || 0}h/week`}
              icon={<BookOpen className="w-6 h-6 text-blue-500" />}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats?.completionRate.value || 0}%`}
              subtitle="Last 30 days"
              icon={<TrendingUp className="w-6 h-6 text-green-500" />}
            />
          </>
        )}
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Today's Schedule
          </h2>
          <button className="btn-secondary text-sm py-2">
            Regenerate Schedule
          </button>
        </div>

        {loading ? (
          <div className="card animate-pulse">
            <div className="h-16 bg-dark-800 rounded-lg" />
          </div>
        ) : schedule.length > 0 ? (
          <div className="space-y-4">
            {schedule.map((event) => (
              <ScheduleCard
                key={event.id}
                event={event}
                onComplete={handleComplete}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 mb-4">No scheduled events for today</p>
            <button className="btn-primary">
              Generate Today's Schedule
            </button>
          </div>
        )}
      </div>

      {/* Motivation Quote */}
      <div className="card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
        <p className="text-lg italic text-dark-200">
          "Discipline is choosing between what you want now and what you want most."
        </p>
        <p className="text-dark-500 mt-2">— Abraham Lincoln</p>
      </div>
    </div>
  );
}

