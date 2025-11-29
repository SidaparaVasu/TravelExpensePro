import { X, Mail, MapPin, Building, Briefcase, Users, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, GENDER_LABELS, USER_TYPE_LABELS } from '@/src/types/users.types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface UserDetailDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

export function UserDetailDrawer({ user, isOpen, onClose, onEdit }: UserDetailDrawerProps) {
  if (!user) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  console.log(user);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {user.first_name} {user.last_name}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.user_type === 'organizational' ? 'default' : 'secondary'}>
              {USER_TYPE_LABELS[user.user_type]}
            </Badge>
            <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Basic Information
            </h3>
            <div className="space-y-1 rounded-lg border border-border p-4 bg-card">
              <DetailRow label="Employee ID" value={user.employee_id} icon={Briefcase} />
              <DetailRow label="Email" value={user.email} icon={Mail} />
              <DetailRow label="Gender" value={GENDER_LABELS[user.gender]} icon={Briefcase} />
            </div>
          </div>

          {/* Organization Details (for organizational users) */}
          {user.user_type === 'organizational' && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Organization Details
              </h3>
              <div className="space-y-1 rounded-lg border border-border p-4 bg-card">
                <DetailRow label="Company" value={user.company_name} icon={Building} />
                <DetailRow label="Department" value={user.department_name} icon={Building} />
                <DetailRow label="Designation" value={user.designation_name} icon={Briefcase} />
                <DetailRow label="Employee Type" value={user.employee_type_name} /> 
                <DetailRow label="Grade" value={user.grade_name} />
                <DetailRow label="Base Location" value={user.base_location_name} icon={MapPin} />
                <DetailRow label="Reporting Manager" value={user.reporting_manager_name} icon={Users} />
              </div>
            </div>
          )}

          {/* Activity */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Activity
            </h3>
            <div className="space-y-1 rounded-lg border border-border p-4 bg-card">
              <DetailRow label="Date Joined" value={formatDate(user.date_joined)} icon={Calendar} />
              <DetailRow label="Last Login" value={formatDateTime(user.last_login)} icon={Clock} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => onEdit(user)}>
            Edit User
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
