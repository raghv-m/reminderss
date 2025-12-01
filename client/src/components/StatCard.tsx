import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className = '',
}: StatCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-dark-800 rounded-xl">
          {icon}
        </div>
        {trend && trendValue && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded-lg ${
              trend === 'up'
                ? 'bg-green-500/20 text-green-400'
                : trend === 'down'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-dark-700 text-dark-400'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <p className="text-dark-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-dark-500 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}

