import React from 'react';
import { Clock, AlertCircle, CheckCircle, Timer, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@/src/types/travel-desk.types';
import { formatHours } from '../utils/format';

interface KPICardsProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

const KPICard = ({ title, value, icon: Icon, bgClass, iconColor }) => (
  <div className="bg-white rounded-md border shadow-[0_2px_2px_0_rgba(59,130,247,0.30)] p-6 transition-all hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className={`w-[70px] h-[70px] rounded-lg flex items-center justify-center ${bgClass}`}>
        <Icon className={`h-7 w-7 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-md border shadow-[0_2px_2px_0_rgba(59,130,247,0.30)] p-6 animate-pulse"
          >
            <div className="h-6 w-20 bg-muted rounded mb-3" />
            <div className="h-10 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Pending Applications',
      value: stats.pending_travel_desk,
      icon: Clock,
      bgClass: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Urgent (Overdue)',
      value: stats.overdue_pending,
      icon: AlertCircle,
      bgClass: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Booking in Progress',
      value: stats.booking_in_progress,
      icon: Timer,
      bgClass: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Avg. Assignment Time',
      value: stats.avg_td_response_hours ? formatHours(stats.avg_td_response_hours) : '—',
      icon: TrendingUp,
      bgClass: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      bgClass: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item, idx) => (
        <KPICard key={idx} {...item} />
      ))}
    </div>
  );
};
