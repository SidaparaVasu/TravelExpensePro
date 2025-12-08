import React from 'react';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ClipboardList, 
  TrendingUp,
  Timer
} from 'lucide-react';
import type { BookingAgentDashboardStats } from '@/src/api/bookingAgentAPI';
import { formatHours } from '../utils/format';

interface KPICardsProps {
  stats: BookingAgentDashboardStats | null;
  isLoading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bgClass: string;
  iconColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, bgClass, iconColor }) => (
  <div className="bg-card rounded-md border shadow-[0_2px_2px_0_rgba(59,130,247,0.30)] p-6 transition-all hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className={`w-[70px] h-[70px] rounded-lg flex items-center justify-center ${bgClass}`}>
        <Icon className={`h-7 w-7 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  </div>
);

const KPICardSkeleton: React.FC = () => (
  <div className="bg-card rounded-md border shadow-[0_2px_2px_0_rgba(59,130,247,0.30)] p-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-[70px] h-[70px] rounded-lg bg-muted" />
      <div className="space-y-2">
        <div className="h-6 w-16 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    </div>
  </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const items: KPICardProps[] = [
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      bgClass: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Timer,
      bgClass: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Confirmed',
      value: stats.confirmed,
      icon: CheckCircle,
      bgClass: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      bgClass: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Total Assigned',
      value: stats.total_assigned,
      icon: ClipboardList,
      bgClass: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Overdue',
      value: stats.overdue_pending,
      icon: AlertCircle,
      bgClass: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Avg Response',
      value: stats.avg_response_hours ? formatHours(stats.avg_response_hours) : '—',
      icon: TrendingUp,
      bgClass: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {items.map((item, idx) => (
        <KPICard key={idx} {...item} />
      ))}
    </div>
  );
};
