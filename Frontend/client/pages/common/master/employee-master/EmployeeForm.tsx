import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { userAPI, UserCreatePayload, User } from '@/src/api/user';
import { organizationMasterAPI } from '@/src/api/master_organization';
import { masterAPI } from '@/src/api/master';
import { locationAPI } from '@/src/api/master_location';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface EmployeeFormProps {
  editId: number | null;
  onCancel: () => void;
}

interface DropdownData {
  departments: any[];
  designations: any[];
  employeeTypes: any[];
  companies: any[];
  grades: any[];
  locations: any[];
  users: any[];
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ editId, onCancel }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<any>({
    employee_id: '',
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    designation: '',
    employee_type: '',
    company: '',
    grade: '',
    base_location: '',
    reporting_manager: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<any>({});
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    departments: [],
    designations: [],
    employeeTypes: [],
    companies: [],
    grades: [],
    locations: [],
    users: [],
  });

  // Fetch dropdown data and edit data
  useEffect(() => {
    fetchDropdownData();
    if (editId) {
      fetchEditData();
    } else {
      setLoading(false);
    }
  }, [editId]);

  const fetchDropdownData = async () => {
    try {
      const [departments, designations, employeeTypes, companies, grades, locations, users] =
        await Promise.all([
          organizationMasterAPI.department.getAll(),
          organizationMasterAPI.designation.getAll(),
          organizationMasterAPI.employeeType.getAll(),
          organizationMasterAPI.company.getAll(),
          masterAPI.getGrades(),
          locationAPI.location.getAll(),
          userAPI.getAll({ page_size: 1000 }), // Get all users for reporting manager
        ]);

      setDropdownData({
        departments: departments.data?.results || departments.results || [],
        designations: designations.data?.results || designations.results || [],
        employeeTypes: employeeTypes.data?.results || employeeTypes.results || [],
        companies: companies.data?.results || companies.results || [],
        grades: grades.results || [],
        locations: locations.data?.results || locations.results || [],
        users: users.data?.results || [],
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
      const response = await userAPI.get(editId!);
      if (response.success) {
        const user = response.data;
        setFormData({
          employee_id: user.employee_id || '',
          username: user.username || '',
          password: '',
          confirm_password: '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          department: user.department || '',
          designation: user.designation || '',
          employee_type: user.employee_type || '',
          company: user.company || '',
          grade: user.grade || '',
          base_location: user.base_location || '',
          reporting_manager: user.reporting_manager || '',
          is_active: user.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
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

  const validate = () => {
    const newErrors: any = {};

    // Username validation
    if (!formData.username) newErrors.username = 'Username is required';

    // Password validation (only for create mode)
    if (!editId) {
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.confirm_password) newErrors.confirm_password = 'Please confirm password';
      if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    // Personal info validation
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

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

      // Prepare payload
      const payload: any = {
        employee_id: formData.employee_id,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        department: formData.department || null,
        designation: formData.designation || null,
        employee_type: formData.employee_type || null,
        company: formData.company || null,
        grade: formData.grade || null,
        base_location: formData.base_location || null,
        reporting_manager: formData.reporting_manager || null,
        is_active: formData.is_active,
      };

      // Add password fields only for create mode
      if (!editId) {
        payload.password = formData.password;
        payload.confirm_password = formData.confirm_password;
      }

      let response;
      if (editId) {
        response = await userAPI.update(editId, payload);
      } else {
        response = await userAPI.create(payload);
      }

      toast({
        title: 'Success',
        description: `Employee ${editId ? 'updated' : 'created'} successfully`,
      });

      onCancel();
    } catch (error: any) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save employee';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    {editId ? 'Edit Employee' : 'Add New Employee'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {editId ? 'Update employee information' : 'Fill in the details to create a new employee'}
                  </p>
                </div>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-8">
                {/* Account Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Account Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateField('username', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter username"
                      />
                      {errors.username && (
                        <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={formData.employee_id}
                        onChange={(e) => updateField('employee_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter employee ID"
                      />
                    </div>

                    {!editId && (
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
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                          )}
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
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {errors.first_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                      )}
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
                      {errors.last_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
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
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Organizational Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Organizational Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => updateField('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Department</option>
                        {dropdownData.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation
                      </label>
                      <select
                        value={formData.designation}
                        onChange={(e) => updateField('designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Designation</option>
                        {dropdownData.designations.map((des) => (
                          <option key={des.id} value={des.id}>
                            {des.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => updateField('grade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Grade</option>
                        {dropdownData.grades.map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Type
                      </label>
                      <select
                        value={formData.employee_type}
                        onChange={(e) => updateField('employee_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Employee Type</option>
                        {dropdownData.employeeTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <select
                        value={formData.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Company</option>
                        {dropdownData.companies.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Location
                      </label>
                      <select
                        value={formData.base_location}
                        onChange={(e) => updateField('base_location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Location</option>
                        {dropdownData.locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reporting Manager
                      </label>
                      <input
                        list="managers"
                        value={
                          formData.reporting_manager
                            ? dropdownData.users.find((u) => u.id === Number(formData.reporting_manager))
                                ?.username || ''
                            : ''
                        }
                        onChange={(e) => {
                          const selectedUser = dropdownData.users.find(
                            (u) => u.username === e.target.value
                          );
                          updateField('reporting_manager', selectedUser?.id || '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type to search manager..."
                      />
                      <datalist id="managers">
                        {dropdownData.users.map((user) => (
                          <option key={user.id} value={user.username}>
                            {user.first_name} {user.last_name} ({user.employee_id})
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Status
                  </h2>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Saving...' : editId ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeForm;