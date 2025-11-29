import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  size?: 'default' | 'sm' | 'lg';
}

const statusConfig: Record<string, { variant: any; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  submitted: { variant: 'default', label: 'Submitted' },
  manager_pending: { variant: 'warning', label: 'Pending Manager' },
  finance_pending: { variant: 'info', label: 'Pending Finance' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  paid: { variant: 'success', label: 'Paid' },
};

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'secondary', label: status };
  
  return (
    <Badge variant={config.variant} className={size === 'lg' ? 'text-base px-4 py-2' : ''}>
      {config.label}
    </Badge>
  );
}
