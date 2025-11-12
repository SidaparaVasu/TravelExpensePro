import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userAPI, User } from '@/src/api/users';
import { useToast } from '@/components/ui/use-toast';

interface EmployeeDetailModalProps {
    employeeId: number;
    onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employeeId, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (employeeId) fetchEmployeeData();
    }, [employeeId]);

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const response = await userAPI.get(employeeId);
            if (response.success) {
                setData(response.data);
            }
        } catch (error: any) {
            console.error('Error fetching employee:', error);
            toast({
                title: 'Error',
                description: 'Failed to load employee details',
                variant: 'destructive',
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 shadow-lg">
                    <div className="animate-spin border-b-2 border-blue-500 rounded-full h-10 w-10 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const renderStatus = (status: boolean) =>
        status ? (
            <span className="text-green-700 font-medium">Active</span>
        ) : (
            <span className="text-red-700 font-medium">Inactive</span>
        );

    const genderLabels = {
        M: 'Male',
        F: 'Female',
        O: 'Other / Non-binary',
        N: 'Prefer not to say',
    };

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-50">
            <div className="bg-white w-[100%] max-w-4xl shadow-2xl border border-gray-200 p-6 max-h-[100vh] overflow-y-auto relativeo">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Employee Details</h2>
                    <p className="text-sm text-gray-600">Detailed information about the employee</p>
                </div>

                {/* Account Information */}
                <SectionTable
                    title="Account Information"
                    headers={['Employee ID', 'Username', 'Status']}
                    row={[
                        data.employee_id || '-',
                        data.username || '-',
                        renderStatus(data.is_active),
                    ]}
                />

                {/* Personal Information */}
                <SectionTable
                    title="Personal Information"
                    headers={['First Name', 'Last Name', 'Email', 'Gender']}
                    row={[data.first_name || '-', data.last_name || '-', data.email || '-', genderLabels[data.gender] || '-']}
                />

                {/* Organizational Information */}
                <SectionTable
                    title="Organizational Information"
                    headers={['Department', 'Designation', 'Grade', 'Employee Type']}
                    row={[
                        data.department_name || '-',
                        data.designation_name || '-',
                        data.grade_name || '-',
                        data.employee_type_name || '-',
                    ]}
                />

                {/* Company & Location */}
                <SectionTable
                    title="Company & Location"
                    headers={['Company', 'Base Location']}
                    row={[data.company_name || '-', data.base_location_name || '-']}
                />

                {/* Reporting Manager */}
                {data.reporting_manager_details && (
                    <SectionTable
                        title="Reporting Structure"
                        headers={['Reporting Manager', 'Manager Employee ID']}
                        row={[
                            data.reporting_manager_details.name || '-',
                            data.reporting_manager_details.employee_id || '-',
                        ]}
                    />
                )}

                {/* Audit Information */}
                <SectionTable
                    title="Audit Information"
                    headers={['Date Joined', 'Last Login']}
                    row={[
                        data.date_joined ? new Date(data.date_joined).toLocaleString() : '-',
                        data.last_login ? new Date(data.last_login).toLocaleString() : 'Never',
                    ]}
                />

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
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

// Section Table Component
const SectionTable: React.FC<{
    title: string;
    headers: string[];
    row: React.ReactNode[];
}> = ({ title, headers, row }) => (
    <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        {headers.map((h, idx) => (
                            <th
                                key={idx}
                                className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {row.map((val, idx) => (
                            <td key={idx} className="border border-gray-300 px-4 py-2 text-gray-800">
                                {val}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

export default EmployeeDetailModal; 