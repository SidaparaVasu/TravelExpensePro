import {
  X,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  KeyRound,
  User2,
  Layers,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface UserDetailDrawerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: any) => void;
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: any;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">{value || '-'}</p>
      </div>
    </div>
  );
}

export function UserDetailDrawer({ user, isOpen, onClose, onEdit }: UserDetailDrawerProps) {
  if (!user) return null;

  const formatDate = (dt?: string) =>
    dt
      ? new Date(dt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '-';

  const formatDateTime = (dt?: string) =>
    dt
      ? new Date(dt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto px-6">
        <SheetHeader className="space-y-4 pb-2 border-b border-border">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>

              <div>
                <SheetTitle className="text-2xl font-semibold">
                  {user.first_name} {user.last_name}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* User Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="flex items-center gap-1">
              <User2 className="h-3 w-3" />
              {user.user_type_display}
            </Badge>

            <Badge
              variant={user.is_active ? 'success' : 'destructive'}
              className="flex items-center gap-1"
            >
              <BadgeCheck className="h-3 w-3" />
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </SheetHeader>

        {/* Content Section */}
        <div className="mt-6 space-y-8">

          {/* Summary Card */}
          <div className="rounded-lg border border-border p-4 bg-muted/40">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quick Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Company" value={user.company_name} icon={Building2} />
              <InfoItem label="Department" value={user.department_name} icon={Layers} />
              <InfoItem label="Designation" value={user.designation_name} icon={Briefcase} />
              <InfoItem label="Grade" value={user.grade_name} icon={BadgeCheck} />
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Basic Information
            </h3>
            <div className="space-y-1 rounded-lg border border-border p-4 bg-card">
              <InfoItem label="Employee ID" value={user.profile_summary?.employee_id} icon={Briefcase} />
              <InfoItem label="Email" value={user.email} icon={Mail} />
              <InfoItem label="Gender" value={user.gender} icon={User2} />
            </div>
          </div>

          {/* Organizational Details */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Organization Details
            </h3>
            <div className="rounded-lg border border-border p-4 bg-card space-y-2">
              <InfoItem label="Company" value={user.company_name} icon={Building2} />
              <InfoItem label="Department" value={user.department_name} icon={Layers} />
              <InfoItem label="Designation" value={user.designation_name} icon={Briefcase} />
              <InfoItem label="Employee Type" value={user.employee_type_name} icon={Users} />
              <InfoItem label="Base Location" value={user.base_location_name} icon={MapPin} />
              <InfoItem label="Reporting Manager" value={user.reporting_manager_name} icon={Users} />
            </div>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Roles
            </h3>
            <div className="rounded-lg border border-border p-4 bg-card flex flex-wrap gap-2">
              {user.roles?.length > 0 ? (
                user.roles.map((role: any) => (
                  <Badge key={role.id} variant="default" className="flex items-center gap-1 px-2 py-1">
                    <ShieldCheck className="h-3 w-3" />
                    {role.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              )}
            </div>
          </div>

          {/* Account Activity */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Account Activity
            </h3>
            <div className="space-y-1 rounded-lg border border-border p-4 bg-card">
              <InfoItem label="Date Joined" value={formatDate(user.date_joined)} icon={Calendar} />
              <InfoItem label="Last Login" value={formatDateTime(user.last_login)} icon={Clock} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex gap-3 border-t border-border pt-4">
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
