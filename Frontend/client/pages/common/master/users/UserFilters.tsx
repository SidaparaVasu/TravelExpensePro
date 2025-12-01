import { Search, Filter, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UserFilters as UserFiltersType, UserType } from "@/src/types/users.types";

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  onAddUser: () => void;
  onExport: () => void; // <-- NEW: Export handler
  departments?: any[];  // dropdown options
  designations?: any[];
  companies?: any[];
  locations?: any[];
}

export function UserFilters({
  filters,
  onFiltersChange,
  onAddUser,
  onExport,
  departments = [],
  designations = [],
  companies = [],
  locations = [],
}: UserFiltersProps) {
  
  // search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value, page: 1 });
  };

  const handleUserTypeChange = (value: string) => {
    onFiltersChange({ user_type: value as UserType | "all", page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ is_active: value === "all" ? undefined : value, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      user_type: "all",
      is_active: undefined,
      company: undefined,
      department: undefined,
      designation: undefined,
      base_location: undefined,
      page: 1,
    });
  };

  const hasFilters =
    filters.search ||
    filters.user_type !== "all" ||
    filters.is_active ||
    filters.company ||
    filters.department ||
    filters.designation ||
    filters.base_location;

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card shadow-sm">

      {/* TOP FILTER ROW */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Right side: Add User + Export */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport} className="flex gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button onClick={onAddUser}>Add User</Button>
        </div>
      </div>

      {/* SECOND ROW OF FILTERS */}
      <div className="flex flex-wrap gap-3">

        {/* User Type */}
        <Select value={filters.user_type || "all"} onValueChange={handleUserTypeChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="organizational">Organizational</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>

        {/* Active / Inactive */}
        <Select value={filters.is_active ?? "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Records</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Company */}
        <Select
          value={String(filters.company || "all")}
          onValueChange={(v) => onFiltersChange({ company: v === "all" ? undefined : Number(v), page: 1 })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department */}
        <Select
          value={String(filters.department || "all")}
          onValueChange={(v) => onFiltersChange({ department: v === "all" ? undefined : Number(v), page: 1 })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Designation */}
        <Select
          value={String(filters.designation || "all")}
          onValueChange={(v) =>
            onFiltersChange({ designation: v === "all" ? undefined : Number(v), page: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Designation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Designations</SelectItem>
            {designations.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Base Location */}
        <Select
          value={String(filters.base_location || "all")}
          onValueChange={(v) =>
            onFiltersChange({ base_location: v === "all" ? undefined : Number(v), page: 1 })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="flex gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
