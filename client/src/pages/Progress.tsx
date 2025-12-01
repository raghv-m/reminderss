import { useState, useEffect } from 'react';
import { Trophy, Flame, Dumbbell, BookOpen, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { getStats, getWeeklyProgress, getMonthlyProgress } from '../lib/api';

interface WeeklyDay {
  day: string;
  date: string;
  gym: boolean;
  study: number;
  isPast: boolean;
  isToday: boolean;
}

interface MonthlyData {
  month: string;
  year: number;
  startDayOfWeek: number;
  days: {
    day: number;
    date: string;
    completed: boolean;
    partial: boolean;
    hasEvents: boolean;
    isPast: boolean;
    isToday: boolean;
  }[];
}

interface Stats {
  streak: { current: number; longest: number };
  gym: { completed: number; target: number };
  study: { hours: number; target: number };
  completionRate: { value: number };
}

export function Progress() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, weeklyDataRes, monthlyDataRes] = await Promise.all([
        getStats(),
        getWeeklyProgress(),
        getMonthlyProgress(),
      ]);
      setStats(statsData as Stats);
      setWeeklyData(weeklyDataRes as WeeklyDay[]);
      setMonthlyData(monthlyDataRes as MonthlyData);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Progress</h1>
          <p className="text-dark-400">Track your discipline journey</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Current Streak"
          value={`${stats?.streak.current || 0} days`}
          subtitle={`Best: ${stats?.streak.longest || 0} days`}
          icon={<Flame className="w-6 h-6 text-orange-500" />}
        />
        <StatCard
          title="Gym Sessions"
          value={`${stats?.gym.completed || 0}`}
          subtitle="This week"
          icon={<Dumbbell className="w-6 h-6 text-red-500" />}
        />
        <StatCard
          title="Study Hours"
          value={`${stats?.study.hours || 0}h`}
          subtitle="This week"
          icon={<BookOpen className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats?.completionRate.value || 0}%`}
          subtitle="Last 30 days"
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
        />
      </div>

      {/* Weekly Breakdown */}
      {timeRange === 'week' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Weekly Breakdown
          </h2>

          {weeklyData.length > 0 ? (
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {weeklyData.map((day) => (
                <div key={day.day} className={`text-center ${day.isToday ? 'ring-2 ring-primary-500 rounded-lg p-1' : ''}`}>
                  <p className={`text-sm mb-2 md:mb-3 ${day.isToday ? 'text-primary-400 font-semibold' : 'text-dark-400'}`}>
                    {day.day}
                  </p>

                  {/* Gym indicator */}
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                      day.gym
                        ? 'bg-gradient-to-br from-orange-500 to-red-500'
                        : day.isPast ? 'bg-dark-700' : 'bg-dark-800'
                    }`}
                  >
                    <Dumbbell className={`w-4 h-4 md:w-5 md:h-5 ${day.gym ? 'text-white' : 'text-dark-600'}`} />
                  </div>

                  {/* Study hours */}
                  <div className="h-16 md:h-24 bg-dark-800 rounded-lg relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                      style={{ height: `${Math.min((day.study / 8) * 100, 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-medium">
                      {day.study}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">No data for this week yet</p>
          )}
        </div>
      )}

      {/* Monthly Heatmap */}
      {timeRange === 'month' && monthlyData && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-500" />
            {monthlyData.month} {monthlyData.year}
          </h2>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <p key={i} className="text-center text-dark-500 text-xs md:text-sm">{day}</p>
            ))}

            {/* Empty cells for alignment */}
            {Array.from({ length: monthlyData.startDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {monthlyData.days.map((day) => (
              <div
                key={day.day}
                className={`aspect-square rounded-md md:rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                  day.isToday ? 'ring-2 ring-primary-500' : ''
                } ${
                  day.completed
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : day.partial
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : day.hasEvents && day.isPast
                    ? 'bg-red-500/10 text-red-400/50'
                    : 'bg-dark-800 text-dark-500'
                }`}
              >
                {day.day}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500/20 border border-green-500/30 rounded" />
              <span className="text-dark-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-yellow-500/20 border border-yellow-500/30 rounded" />
              <span className="text-dark-400">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-red-500/10 rounded" />
              <span className="text-dark-400">Missed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

