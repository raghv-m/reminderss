import { useState, useEffect } from 'react';
import { Flame, Dumbbell, Calendar, TrendingUp, AlertCircle, DollarSign, Target, ChevronLeft, ChevronRight, Briefcase, Sparkles, Award, Zap } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ScheduleCard } from '../components/ScheduleCard';
import { getTodaySchedule, completeEvent, getStats, getShifts, getPayrollSummary } from '../lib/api';
import type { ScheduledEvent, Shift } from '../types';

interface Stats {
  streak: { current: number; longest: number };
  gym: { completed: number; target: number; remaining: number };
  study: { hours: number; target: number };
  completionRate: { value: number; totalEvents: number; completedEvents: number };
}

interface PayrollData {
  totalHours: number;
  totalEarnings: number;
  shiftsCount: number;
}

export function Dashboard() {
  const [schedule, setSchedule] = useState<ScheduledEvent[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [payroll, setPayroll] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadSchedule(), loadStats(), loadShifts(), loadPayroll()]);
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

  const loadShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data as Shift[]);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    }
  };

  const loadPayroll = async () => {
    try {
      const data = await getPayrollSummary('weekly') as any;
      setPayroll({
        totalHours: data.totalHours || 0,
        totalEarnings: data.totalEarnings || 0,
        shiftsCount: data.shiftsCount || 0
      });
    } catch (err) {
      console.error('Failed to load payroll:', err);
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

  // Get week days for calendar view
  const getWeekDays = () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + (weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
            {getGreeting()}, Champion! <Sparkles className="w-7 h-7 text-yellow-500" />
          </h1>
          <p className="text-dark-400">{today} • Let's build discipline today</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {stats?.streak.current || 0} day streak
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>{[1, 2, 3, 4].map(i => (<div key={i} className="card animate-pulse"><div className="h-20 bg-dark-800 rounded-lg" /></div>))}</>
        ) : (
          <>
            <StatCard title="Current Streak" value={`${stats?.streak.current || 0} days`} subtitle={`Best: ${stats?.streak.longest || 0}`} icon={<Flame className="w-6 h-6 text-orange-500" />} />
            <StatCard title="Gym This Week" value={`${stats?.gym.completed || 0}/${stats?.gym.target || 5}`} subtitle={stats?.gym.remaining ? `${stats.gym.remaining} left` : '💪 Done!'} icon={<Dumbbell className="w-6 h-6 text-red-500" />} />
            <StatCard title="Hours Worked" value={`${payroll?.totalHours?.toFixed(1) || 0}h`} subtitle={`$${payroll?.totalEarnings?.toFixed(0) || 0} earned`} icon={<DollarSign className="w-6 h-6 text-green-500" />} />
            <StatCard title="Completion" value={`${stats?.completionRate.value || 0}%`} subtitle="Last 30 days" icon={<TrendingUp className="w-6 h-6 text-blue-500" />} />
          </>
        )}
      </div>

      {/* Weekly Calendar View */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            This Week's Shifts
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-dark-800 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setWeekOffset(0)} className="text-sm text-primary-400 hover:underline">Today</button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-dark-800 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentDay = isToday(day);
            return (
              <div key={i} className={`p-2 rounded-lg text-center min-h-[100px] ${isCurrentDay ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-dark-800'}`}>
                <p className={`text-xs font-medium ${isCurrentDay ? 'text-primary-400' : 'text-dark-400'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold ${isCurrentDay ? 'text-white' : 'text-dark-200'}`}>
                  {day.getDate()}
                </p>
                {dayShifts.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {dayShifts.map(s => (
                      <div key={s.id} className="text-xs bg-orange-500/20 text-orange-400 rounded px-1 py-0.5 truncate">
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        {s.start_time?.slice(0, 5)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-dark-600 mt-2">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Today's Goals
          </h2>
        </div>
        {loading ? (
          <div className="card animate-pulse"><div className="h-16 bg-dark-800 rounded-lg" /></div>
        ) : schedule.length > 0 ? (
          <div className="space-y-3">
            {schedule.map((event) => (<ScheduleCard key={event.id} event={event} onComplete={handleComplete} />))}
          </div>
        ) : (
          <div className="card text-center py-8 bg-gradient-to-br from-dark-800 to-dark-900">
            <Award className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 mb-3">No goals scheduled for today</p>
            <a href="/schedule" className="btn-primary inline-block">Generate Schedule</a>
          </div>
        )}
      </div>

      {/* Motivation Quote */}
      <div className="card bg-gradient-to-br from-primary-500/10 to-orange-500/5 border-primary-500/20">
        <p className="text-lg italic text-dark-200">"Discipline is choosing between what you want now and what you want most."</p>
        <p className="text-dark-500 mt-2">— Abraham Lincoln</p>
      </div>
    </div>
  );
}

