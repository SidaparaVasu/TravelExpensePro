import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Shield } from 'lucide-react';
import { userAPI } from '@/src/api/users';
import { organizationMasterAPI } from '@/src/api/master_company';
import { masterAPI } from '@/src/api/master';
import { locationAPI } from '@/src/api/master_location';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface UserFormModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DropdownData {
  departments: any[];
  designations: any[];
  employeeTypes: any[];
  companies: any[];
  grades: any[];
  locations: any[];
  users: any[];
  roles: any[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ userId, isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<any>({
    user_type: 'organizational',
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    is_active: true,
    // Organizational fields
    employee_id: '',
    company: '',
    department: '',
    designation: '',
    employee_type: '',
    grade: '',
    base_location: '',
    reporting_manager: '',
    // External fields
    profile_type: 'other',
    organization_name: '',
    contact_person: '',
    phone: '',
    service_categories: [],
  });

  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState<number | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    departments: [],
    designations: [],
    employeeTypes: [],
    companies: [],
    grades: [],
    locations: [],
    users: [],
    roles: [],
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      if (userId) {
        fetchEditData();
      } else {
        setLoading(false);
      }
    }
  }, [isOpen, userId]);

  const fetchDropdownData = async () => {
    try {
      const [departments, designations, employeeTypes, companies, grades, locations, users, rolesResponse] =
        await Promise.all([
          organizationMasterAPI.department.getAll(),
          organizationMasterAPI.designation.getAll(),
          organizationMasterAPI.employeeType.getAll(),
          organizationMasterAPI.company.getAll(),
          masterAPI.getGrades(),
          locationAPI.location.getAll(),
          userAPI.getAll({ page_size: 1000 }),
          fetch('http://localhost:8000/api/roles/', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          }).then(r => r.json()),
        ]);

      setDropdownData({
        departments: departments.data?.results || departments.results || [],
        designations: designations.data?.results || designations.results || [],
        employeeTypes: employeeTypes.data?.results || employeeTypes.results || [],
        companies: companies.data?.results || companies.results || [],
        grades: grades.data?.results || [],
        locations: locations.data?.results || locations.results || [],
        users: users.data?.results || [],
        roles: rolesResponse.data?.results || rolesResponse.results || [],
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data',
        variant: 'destructive',
      });
    }
  };

  const fetchEditData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.get(userId!);
      if (response.success) {
        const user = response.data;
        const profile = user.profile || {};

        setFormData({
          user_type: user.user_type,
          username: user.username || '',
          password: '',
          confirm_password: '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          gender: user.gender || '',
          is_active: user.is_active ?? true,
          // Organizational
          employee_id: profile.employee_id || '',
          company: profile.company || '',
          department: profile.department || '',
          designation: profile.designation || '',
          employee_type: profile.employee_type || '',
          grade: profile.grade || '',
          base_location: profile.base_location || '',
          reporting_manager: profile.reporting_manager || '',
          // External
          profile_type: profile.profile_type || 'other',
          organization_name: profile.organization_name || '',
          contact_person: profile.contact_person || '',
          phone: profile.phone || '',
          service_categories: profile.service_categories || [],
        });

        // Set roles
        if (user.roles && user.roles.length > 0) {
          const roleIds = user.roles.map((r: any) => r.id);
          setSelectedRoles(roleIds);
          const primary = user.roles.find((r: any) => r.is_primary);
          if (primary) setPrimaryRoleId(primary.id);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        // If removing and it was primary, clear primary
        if (primaryRoleId === roleId) setPrimaryRoleId(null);
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const setPrimaryRole = (roleId: number) => {
    if (selectedRoles.includes(roleId)) {
      setPrimaryRoleId(roleId);
    }
  };

  const validate = () => {
    const newErrors: any = {};

    if (!formData.username) newErrors.username = 'Username is required';
    if (!userId) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.confirm_password) newErrors.confirm_password = 'Confirm password is required';
      if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.gender) newErrors.gender = 'Gender is required';

    if (selectedRoles.length === 0) {
      newErrors.roles = 'Please assign at least one role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        user_type: formData.user_type,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        gender: formData.gender,
        is_active: formData.is_active,
      };

      if (!userId) {
        payload.password = formData.password;
        payload.confirm_password = formData.confirm_password;
      }

      // Add profile-specific fields
      if (formData.user_type === 'organizational') {
        payload.employee_id = formData.employee_id || null;
        payload.company = formData.company || null;
        payload.department = formData.department || null;
        payload.designation = formData.designation || null;
        payload.employee_type = formData.employee_type || null;
        payload.grade = formData.grade || null;
        payload.base_location = formData.base_location || null;
        payload.reporting_manager = formData.reporting_manager || null;
      } else {
        payload.profile_type = formData.profile_type;
        payload.organization_name = formData.organization_name;
        payload.contact_person = formData.contact_person;
        payload.phone = formData.phone;
        payload.service_categories = formData.service_categories;
      }

      let response;
      if (userId) {
        response = await userAPI.update(userId, payload);
      } else {
        response = await userAPI.create(payload);
      }

      // Now assign roles
      if (response.success && response.data?.id) {
        const createdUserId = response.data.id;
        await assignRoles(createdUserId);
      }

      toast({
        title: 'Success',
        description: `User ${userId ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save user';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const assignRoles = async (targetUserId: number) => {
    try {
      const assignPromises = selectedRoles.map((roleId) => {
        const role = dropdownData.roles.find((r: any) => r.id === roleId);
        if (!role) return Promise.resolve();

        return fetch('http://localhost:8000/api/user-roles/assign/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: targetUserId,
            role_name: role.name,
            is_primary: roleId === primaryRoleId,
            action: 'assign',
          }),
        });
      });

      await Promise.all(assignPromises);
    } catch (error) {
      console.error('Error assigning roles:', error);
      toast({
        title: 'Warning',
        description: 'User created but role assignment may have failed',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {userId ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {userId ? 'Update user information and roles' : 'Create a new user account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Type Selection */}
          {!userId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                User Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="organizational"
                    checked={formData.user_type === 'organizational'}
                    onChange={(e) => updateField('user_type', e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">👤 Organizational User (Employee)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="external"
                    checked={formData.user_type === 'external'}
                    onChange={(e) => updateField('user_type', e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">🏢 External User (Agent/Vendor)</span>
                </label>
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  disabled={!!userId}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  } ${userId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter username"
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>

              {!userId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={(e) => updateField('confirm_password', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other / Non-binary</option>
                  <option value="N">Prefer not to say</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
            </div>
          </div>

          {/* Organizational Profile Fields */}
          {formData.user_type === 'organizational' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => updateField('employee_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <select
                    value={formData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Company</option>
                    {dropdownData.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => updateField('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {dropdownData.departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.dept_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Designation</option>
                    {dropdownData.designations.map((d) => (
                      <option key={d.designation_id} value={d.designation_id}>
                        {d.designation_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => updateField('grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    {dropdownData.grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                  <select
                    value={formData.employee_type}
                    onChange={(e) => updateField('employee_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee Type</option>
                    {dropdownData.employeeTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Location</label>
                  <select
                    value={formData.base_location}
                    onChange={(e) => updateField('base_location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Location</option>
                    {dropdownData.locations.map((l) => (
                      <option key={l.location_id} value={l.location_id}>
                        {l.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                  <input
                    list="managers"
                    value={
                      formData.reporting_manager
                        ? dropdownData.users.find((u) => u.id === Number(formData.reporting_manager))?.username || ''
                        : ''
                    }
                    onChange={(e) => {
                      const selected = dropdownData.users.find((u) => u.username === e.target.value);
                      updateField('reporting_manager', selected?.id || '');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type to search..."
                  />
                  <datalist id="managers">
                    {dropdownData.users.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          )}

          {/* External Profile Fields */}
          {formData.user_type === 'external' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
                  <select
                    value={formData.profile_type}
                    onChange={(e) => updateField('profile_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="booking_agent">Booking Agent</option>
                    <option value="hotel_vendor">Hotel Vendor</option>
                    <option value="transport_vendor">Transport Vendor</option>
                    <option value="airline_vendor">Airline Vendor</option>
                    <option value="consultant">Consultant</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => updateField('organization_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => updateField('contact_person', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Role Assignment */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Role Assignment
            </h3>
            {errors.roles && (
              <p className="text-red-500 text-sm mb-3">{errors.roles}</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dropdownData.roles.map((role: any) => (
                <div
                  key={role.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                    selectedRoles.includes(role.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{role.name}</div>
                      <div className="text-xs text-gray-500">{role.description || 'No description'}</div>
                    </div>
                  </label>
                  {selectedRoles.includes(role.id) && (
                    <button
                      type="button"
                      onClick={() => setPrimaryRole(role.id)}
                      className={`ml-3 px-3 py-1 text-xs rounded-full transition-colors ${
                        primaryRoleId === role.id
                          ? 'bg-yellow-400 text-yellow-900 font-semibold'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {primaryRoleId === role.id ? '⭐ Primary' : 'Set as Primary'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select at least one role. The primary role determines the default dashboard.
            </p>
          </div>

          {/* Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Active User</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : userId ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;