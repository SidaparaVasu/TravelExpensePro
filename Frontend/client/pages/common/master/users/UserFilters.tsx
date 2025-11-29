import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserFilters as UserFiltersType, UserType } from '@/src/types/users';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  onAddUser: () => void;
}

export function UserFilters({ filters, onFiltersChange, onAddUser }: UserFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value, page: 1 });
  };

  const handleUserTypeChange = (value: string) => {
    onFiltersChange({ user_type: value as UserType | 'organizational', page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ is_active: value as 'true' | 'true' | 'false', page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      user_type: 'organizational',
      is_active: 'true',
      page: 1,
    });
  };

  const hasActiveFilters = filters.search || filters.user_type !== 'organizational' || filters.is_active !== 'true';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filters.user_type} onValueChange={handleUserTypeChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="organizational">Organizational</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.is_active} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <Button onClick={onAddUser}>
        Add User
      </Button>
    </div>
  );
}
