import {
  Eye,
  Edit,
  Trash2,
  Layers,
  Briefcase,
  Building2,
  MapPin,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { User } from "@/src/types/users.types";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export function UserTable({
  users,
  isLoading,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onViewUser,
  onEditUser,
  onDeleteUser,
}: UserTableProps) {

  const startItem = (currentPage - 1) * pageSize + 1;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* TABLE */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Username/Employee ID</TableHead>
              <TableHead>Name/Email</TableHead>
              <TableHead>Company/Location</TableHead>
              <TableHead>Department/Designation</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={user.id} className="hover:bg-muted/40">

                  {/* SERIAL NUMBER */}
                  <TableCell className="font-medium">{startItem + index}</TableCell>

                  {/* USERNAME + EMPLOYEE ID */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">@{user.username}</span>
                      {user.profile_summary?.employee_id && (
                        <span className="text-xs text-muted-foreground">
                          ID: {user.profile_summary.employee_id}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* FULL NAME + EMAIL */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>

                  {/* COMPANY + LOCATION */}
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {user.company_name || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {user.base_location_name || "N/A"}
                      </div>
                    </div>
                  </TableCell>

                  {/* DEPARTMENT + DESIGNATION */}
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {user.department_name || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {user.designation_name || "N/A"}
                      </div>
                    </div>
                  </TableCell>

                  {/* GRADE */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {user.grade_name || "N/A"}
                    </Badge>
                  </TableCell>

                  {/* ROLE */}
                  <TableCell>
                    {user.primary_role ? (
                      <Badge className="flex items-center gap-1 text-xs">
                        <BadgeCheck className="h-3 w-3" />
                        {user.primary_role.name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No Role</span>
                    )}
                  </TableCell>

                  {/* ACTION BUTTONS */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-100 hover:text-blue-600" onClick={() => onViewUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100 hover:text-green-600" onClick={() => onEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-red-100 hover:text-red-600"
                        onClick={() => onDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}–{Math.min(startItem + users.length - 1, totalCount)} of {totalCount} users
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

    </div>
  );
}
