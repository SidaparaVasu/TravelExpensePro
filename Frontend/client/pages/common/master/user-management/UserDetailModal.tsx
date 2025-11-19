import React, { useState, useEffect } from 'react';
import { X, User, Mail, Briefcase, Building2, MapPin, Shield, Users } from 'lucide-react';
import { userAPI } from '@/src/api/users';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserDetailModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [userId, isOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.get(userId);
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user details',
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const genderLabels: Record<string, string> = {
    M: 'Male',
    F: 'Female',
    O: 'Other / Non-binary',
    N: 'Prefer not to say',
  };

  const profile = data.profile || {};
  const isOrg = data.user_type === 'organizational' && profile.type === 'organizational';
  const isExt = data.user_type === 'external' && profile.type === 'external';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Header Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {data.first_name?.charAt(0)?.toUpperCase() || data.username?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {data.first_name} {data.last_name}
                  </h3>
                  <p className="text-gray-600 mt-1">@{data.username}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={data.user_type === 'organizational' ? 'default' : 'secondary'}>
                      {data.user_type === 'organizational' ? '👤 Organizational' : '🏢 External'}
                    </Badge>
                    {data.roles?.map((role: any) => (
                      <Badge key={role.id} variant={role.is_primary ? 'default' : 'outline'}>
                        <Shield className="h-3 w-3 mr-1" />
                        {role.name}
                        {role.is_primary && ' ⭐'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoItem label="Email" value={data.email} icon={<Mail className="h-4 w-4" />} />
              <InfoItem label="Gender" value={genderLabels[data.gender] || 'Not specified'} icon={<User className="h-4 w-4" />} />
              <InfoItem 
                label="Status" 
                value={
                  <Badge variant={data.is_active ? 'default' : 'secondary'}>
                    {data.is_active ? '🟢 Active' : '🔴 Inactive'}
                  </Badge>
                } 
                icon={<Shield className="h-4 w-4" />} 
              />
            </CardContent>
          </Card>

          {/* Organizational Profile */}
          {isOrg && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoItem label="Employee ID" value={profile.employee_id || 'Not assigned'} icon={<Briefcase className="h-4 w-4" />} />
                  <InfoItem label="Company" value={profile.company_name || 'Not assigned'} icon={<Building2 className="h-4 w-4" />} />
                  <InfoItem label="Department" value={profile.department_name || 'Not assigned'} icon={<Briefcase className="h-4 w-4" />} />
                  <InfoItem label="Designation" value={profile.designation_name || 'Not assigned'} icon={<Briefcase className="h-4 w-4" />} />
                  <InfoItem label="Grade" value={profile.grade_name || 'Not assigned'} icon={<Briefcase className="h-4 w-4" />} />
                  <InfoItem label="Employee Type" value={profile.employee_type_name || 'Not assigned'} icon={<Briefcase className="h-4 w-4" />} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Location & Reporting
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoItem label="Base Location" value={profile.base_location_name || 'Not assigned'} icon={<MapPin className="h-4 w-4" />} />
                  {profile.base_location_details && (
                    <InfoItem 
                      label="City/State" 
                      value={`${profile.base_location_details.city}, ${profile.base_location_details.state}`} 
                      icon={<MapPin className="h-4 w-4" />} 
                    />
                  )}
                  {profile.reporting_manager_details && (
                    <div className="col-span-2">
                      <InfoItem 
                        label="Reporting Manager" 
                        value={profile.reporting_manager_details.name} 
                        icon={<Users className="h-4 w-4" />} 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* External Profile */}
          {isExt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <InfoItem label="Organization" value={profile.organization_name || 'Not specified'} icon={<Building2 className="h-4 w-4" />} />
                <InfoItem label="Profile Type" value={profile.profile_type_display || profile.profile_type || 'Not specified'} icon={<Briefcase className="h-4 w-4" />} />
                <InfoItem label="Contact Person" value={profile.contact_person || 'Not specified'} icon={<User className="h-4 w-4" />} />
                <InfoItem label="Phone" value={profile.phone || 'Not specified'} icon={<Mail className="h-4 w-4" />} />
                <InfoItem 
                  label="Status" 
                  value={
                    <Badge variant={profile.is_verified ? 'default' : 'secondary'}>
                      {profile.is_verified ? '✅ Verified' : '⏳ Pending'}
                    </Badge>
                  } 
                  icon={<Shield className="h-4 w-4" />} 
                />
              </CardContent>
            </Card>
          )}

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Roles & Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.roles && data.roles.length > 0 ? (
                  data.roles.map((role: any) => (
                    <div key={role.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{role.name}</span>
                          {role.is_primary && <Badge variant="default" className="text-xs">Primary</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{role.description || 'No description'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No roles assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Component
interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
    <div className="text-gray-400 mt-1">{icon}</div>
    <div className="flex-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="text-sm font-medium text-gray-900 mt-1">
        {typeof value === 'string' ? value : value}
      </div>
    </div>
  </div>
);

export default UserDetailModal;