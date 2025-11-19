import React, { useState, useEffect } from 'react';
import { Search, Edit, Eye, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { userAPI } from '@/src/api/users';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserTypeFilter } from './Index';

interface UserListProps {
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onCreate: () => void;
  refreshTrigger: number;
}

const UserList: React.FC<UserListProps> = ({ onView, onEdit, onCreate, refreshTrigger }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [currentPage, refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll({
        search: searchTerm || undefined,
        user_type: userTypeFilter !== 'all' ? userTypeFilter : undefined,
        page: currentPage,
        page_size: pageSize,
      });

      if (response.success) {
        setData(response.data.results || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalCount(response.data.count || 0);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchData();
  };

  const handleUserTypeChange = (type: UserTypeFilter) => {
    setUserTypeFilter(type);
    setCurrentPage(1);
    setTimeout(fetchData, 0);
  };

  const getUserTypeBadge = (userType: string) => {
    if (userType === 'organizational') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          👤 Organizational
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        🏢 External
      </Badge>
    );
  };

  const getRoleBadges = (profileSummary: any) => {
    // This will show primary role from profile_summary
    const primaryRole = profileSummary?.primary_role;
    if (!primaryRole) return <span className="text-xs text-gray-400">No roles</span>;

    const roleColors: Record<string, string> = {
      employee: 'bg-blue-500',
      manager: 'bg-green-500',
      admin: 'bg-red-500',
      travel_desk: 'bg-orange-500',
      ceo: 'bg-indigo-600',
      chro: 'bg-purple-600',
      finance: 'bg-teal-500',
      spoc: 'bg-cyan-500',
    };

    const bgColor = roleColors[primaryRole.role_type?.toLowerCase()] || 'bg-gray-500';

    return (
      <Badge className={`${bgColor} text-white text-xs`}>
        {primaryRole.name}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all users - employees, agents, and vendors
            </p>
          </div>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* User Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleUserTypeChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userTypeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => handleUserTypeChange('organizational')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userTypeFilter === 'organizational'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👤 Organizational
          </button>
          <button
            onClick={() => handleUserTypeChange('external')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              userTypeFilter === 'external'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏢 External
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, username, email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Search
          </button>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No users found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Profile Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {user.first_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4">{getUserTypeBadge(user.user_type)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.profile_summary?.type === 'organizational' && (
                          <div>
                            <div className="font-medium">{user.profile_summary.employee_id || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                              {user.profile_summary.department || 'No department'}
                            </div>
                          </div>
                        )}
                        {user.profile_summary?.type === 'external' && (
                          <div>
                            <div className="font-medium">{user.profile_summary.organization_name}</div>
                            <div className="text-xs text-gray-500">{user.profile_summary.profile_type}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{getRoleBadges(user)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? '🟢 Active' : '🔴 Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onView(user.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => onEdit(user.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserList;