import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  Settings, 
  Trophy,
  Flame,
  DollarSign
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
  { path: '/progress', icon: Trophy, label: 'Progress' },
  { path: '/payroll', icon: DollarSign, label: 'Payroll' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-dark-700/30 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent">
            DisciplineOS
          </span>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
            <p className="text-sm text-dark-300 mb-2">Current Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <span className="text-2xl font-bold">7 days</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}

