import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { UserFilters } from './UserFilters';
import { UserTable } from './UserTable';
import { UserDetailDrawer } from './UserDetailDrawer';
import { UserFormModal } from './UserFormModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { User, UserFilters as UserFiltersType, UserCreatePayload } from '@/src/types/users.types';
import { userAPI } from '@/src/api/users';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();

  // State for users data
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters state
  const [filters, setFilters] = useState<UserFiltersType>({
    search: '',
    user_type: 'organizational',
    is_active: 'true',
    page: 1,
    page_size: 10,
  });

  // Modal/Drawer states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getAll(filters);
      if (response.success) {
        setUsers(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter handlers
  const handleFiltersChange = (newFilters: Partial<UserFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // User actions
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormModalOpen(true);
  };

  const handleViewUser = async (user: User) => {
    try {
      const response = await userAPI.get(user.id);

      if (response.success) {
        // response.data contains full details from UserDetailSerializer
        console.log(response.data);
        setSelectedUser(response.data);
        setIsDetailDrawerOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    }
  };


  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailDrawerOpen(false);
    setIsFormModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkExport = async () => {
    try {
      const response = await userAPI.export();
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User data exported successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export users data',
        variant: 'destructive',
      });
    }
  }

  const handleFormSubmit = async (data: UserCreatePayload) => {
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        const response = await userAPI.update(selectedUser.id, data);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'User updated successfully',
          });
          setIsFormModalOpen(false);
          fetchUsers();
        }
      } else {
        const response = await userAPI.create(data);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'User created successfully',
          });
          setIsFormModalOpen(false);
          fetchUsers();
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await userAPI.delete(userToDelete.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage organizational and external users
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-content mt-5">
        <div className="space-y-6">
          {/* Filters */}
          <UserFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onAddUser={handleAddUser}
            onExport={handleBulkExport}
            // departments={departments}
            // designations={designations}
            // companies={companies}
            // locations={locations}
          />


          {/* Table */}
          <UserTable
            users={users}
            isLoading={isLoading}
            currentPage={filters.page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={filters.page_size}
            onPageChange={handlePageChange}
            onViewUser={handleViewUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      </main>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={handleEditUser}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        user={userToDelete}
        isOpen={isDeleteDialogOpen}
        isLoading={isSubmitting}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Index;
