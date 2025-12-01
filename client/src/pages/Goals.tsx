import { useState, useEffect } from 'react';
import { Plus, Dumbbell, BookOpen, Briefcase, Trash2, Edit2, Loader2 } from 'lucide-react';
import { GoalForm } from '../components/GoalForm';
import { useToast } from '../components/Toast';
import { getGoals, createGoal, deleteGoal } from '../lib/api';
import type { Goal } from '../types';

const goalIcons = {
  gym: Dumbbell,
  study: BookOpen,
  work: Briefcase,
  custom: Plus,
};

const goalColors = {
  gym: 'from-orange-500 to-red-500',
  study: 'from-blue-500 to-indigo-500',
  work: 'from-green-500 to-emerald-500',
  custom: 'from-purple-500 to-pink-500',
};

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await getGoals();
      setGoals(data as Goal[]);
    } catch (error) {
      console.error('Failed to load goals:', error);
      showToast('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (data: any) => {
    try {
      const newGoal = await createGoal(data);
      setGoals([...goals, newGoal as Goal]);
      setShowForm(false);
      showToast('Goal created! Let\'s crush it! 🔥', 'success');
    } catch (error) {
      console.error('Failed to create goal:', error);
      showToast('Failed to create goal', 'error');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setDeleting(id);
    try {
      await deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
      showToast('Goal deleted', 'info');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      showToast('Failed to delete goal', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Goals</h1>
          <p className="text-dark-400">Define what you're committed to achieving</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      {/* Goal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">Create New Goal</h2>
            <GoalForm onSubmit={handleCreateGoal} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-dark-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          {goals.map((goal) => {
            const type = goal.type as keyof typeof goalIcons;
            const Icon = goalIcons[type] || Plus;
            const gradient = goalColors[type] || goalColors.custom;

            return (
              <div key={goal.id} className="card relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg">
                    <Edit2 className="w-4 h-4 text-dark-400" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 bg-dark-800 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-dark-400 hover:text-red-400" />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{goal.name}</h3>
                    <p className="text-dark-400 text-sm mb-4">
                      {goal.weekly_target}× per week
                      {goal.daily_hours && ` • ${goal.daily_hours}h/day`}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-dark-500">
                        Priority: #{goal.priority}
                      </span>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preferred Times */}
                {goal.preferred_times.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-700">
                    <p className="text-xs text-dark-500 mb-2">Preferred times:</p>
                    <div className="flex flex-wrap gap-2">
                      {goal.preferred_times.map((time, i) => (
                        <span key={i} className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-300">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-dark-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
          <p className="text-dark-400 mb-6">Start by creating your first goal</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}

