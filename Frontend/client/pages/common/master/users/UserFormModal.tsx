import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, UserType, Gender, UserCreatePayload } from '@/src/types/users';
import { userAPI } from '@/src/api/users';
import { organizationMasterAPI } from '@/src/api/master_company';
import { masterAPI } from '@/src/api/master';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserCreatePayload) => void;
    user?: User | null;
    isLoading?: boolean;
}

interface MasterData {
    companies: { id: number; name: string }[];
    departments: { department_id: number; dept_name: string; company: number }[];
    designations: { designation_id: number; designation_name: string; department: number }[];
    locations: { location_id: number; location_name: string }[];
    grades: { id: number; name: string }[];
    employeeTypes: { id: number; type: string }[];
    managers: { id: number; first_name: string; last_name: string; id: number }[];
}

export function UserFormModal({ isOpen, onClose, onSubmit, user, isLoading }: UserFormModalProps) {
    const isEditMode = !!user;
    const [activeTab, setActiveTab] = useState<UserType>('organizational');

    const [masterData, setMasterData] = useState<MasterData>({
        companies: [],
        departments: [],
        designations: [],
        locations: [],
        grades: [],
        employeeTypes: [],
        managers: [],
    });

    // Filtered lists for dependent selects
    const [filteredDepartments, setFilteredDepartments] = useState<
        { department_id: number; dept_name: string; company: number }[]
    >([]);
    const [filteredDesignations, setFilteredDesignations] = useState<
        { designation_id: number; designation_name: string; department: number }[]
    >([]);

    // Form state (keep values as strings for Select compatibility)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
        email: '',
        gender: 'N' as Gender,
        is_active: true,
        // Organizational profile (all strings)
        employee_id: '',
        company: '',
        department: '',
        designation: '',
        employee_type: '',
        grade: '',
        base_location: '',
        reporting_manager: '',
        // External profile
        organization_name: '',
        organization_type: '',
        contact_phone: '',
        external_reference_id: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMasterData();
            if (user) {
                // Prefill values (convert numbers to strings)
                setActiveTab(user.user_type);
                setFormData({
                    username: user.username || '',
                    password: '',
                    confirm_password: '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    gender: user.gender || 'N',
                    is_active: user.is_active ?? true,
                    employee_id: user.employee_id || '',
                    company: user.company ? String(user.company) : '',
                    department: user.department ? String(user.department) : '',
                    designation: user.designation ? String(user.designation) : '',
                    employee_type: user.employee_type ? String(user.employee_type) : '',
                    grade: user.grade ? String(user.grade) : '',
                    base_location: user.base_location ? String(user.base_location) : '',
                    reporting_manager: user.reporting_manager ? String(user.reporting_manager) : '',
                    organization_name: '',
                    organization_type: '',
                    contact_phone: '',
                    external_reference_id: '',
                });

                // If company exists, build filtered lists so selects show proper options
                if (user.company) {
                    // Wait for master data loaded; if not loaded yet, loadMasterData will set these later
                    // We'll set them after loadMasterData completes (it uses setMasterData + console logs)
                }
            } else {
                resetForm();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]);

    const loadMasterData = async () => {
        try {
            // NOTE: order must match assignment below
            const [companies, departments, designations, employeeTypes, grades, locations, managers] =
                await Promise.all([
                    organizationMasterAPI.company.getAll(),
                    organizationMasterAPI.department.getAll(),
                    organizationMasterAPI.designation.getAll(),
                    organizationMasterAPI.employeeType.getAll(),
                    masterAPI.getGrades(),
                    masterAPI.getLocations(),
                    userAPI.getAll(),
                ]);

            const comps = companies?.data?.results ?? [];
            const depts = departments?.data?.results ?? [];
            const desis = designations?.data?.results ?? [];
            const etypes = employeeTypes?.data?.results ?? [];
            const grs = grades?.data?.results ?? [];
            const locs = locations?.data?.results ?? [];
            const mgrs = managers?.data?.results ?? [];

            setMasterData({
                companies: comps,
                departments: depts,
                designations: desis,
                employeeTypes: etypes,
                grades: grs,
                locations: locs,
                managers: mgrs,
            });

            // If editing and a company is already selected, set filtered lists so selects render correctly
            if (formData.company) {
                const fd = depts.filter((d: any) => String(d.company) === String(formData.company));
                setFilteredDepartments(fd);
            }
            if (formData.department) {
                const fdes = desis.filter((d: any) => String(d.department) === String(formData.department));
                setFilteredDesignations(fdes);
            }
        } catch (err) {
            console.error('Failed to load master data', err);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            confirm_password: '',
            first_name: '',
            last_name: '',
            email: '',
            gender: 'N',
            is_active: true,
            employee_id: '',
            company: '',
            department: '',
            designation: '',
            employee_type: '',
            grade: '',
            base_location: '',
            reporting_manager: '',
            organization_name: '',
            organization_type: '',
            contact_phone: '',
            external_reference_id: '',
        });
        setErrors({});
        setActiveTab('organizational');
        setFilteredDepartments([]);
        setFilteredDesignations([]);
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }

        // Dynamic filtering and reset logic
        if (field === 'company') {
            // filter departments by company
            const dept = masterData.departments.filter(d => String(d.company) === String(value));
            setFilteredDepartments(dept);
            // clear downstream filters & values
            setFilteredDesignations([]);
            setFormData(prev => ({ ...prev, department: '', designation: '' }));
        }

        if (field === 'department') {
            // filter designations by department
            const desi = masterData.designations.filter(d => String(d.department) === String(value));
            setFilteredDesignations(desi);
            // clear designation value
            setFormData(prev => ({ ...prev, designation: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) newErrors.username = 'Username is required';
        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!isEditMode) {
            if (!formData.password) newErrors.password = 'Password is required';
            else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
            if (formData.password !== formData.confirm_password) {
                newErrors.confirm_password = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Build flattened payload the backend serializer expects (not nested organizational_profile)
        const payload: any = {
            username: formData.username,
            password: formData.password,
            confirm_password: formData.confirm_password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            gender: formData.gender,
            user_type: activeTab,
            is_active: formData.is_active,
        };

        if (activeTab === 'organizational') {
            // convert string ids to numbers or null
            payload.employee_id = formData.employee_id || '';
            payload.company = formData.company ? parseInt(formData.company, 10) : null;
            payload.department = formData.department ? parseInt(formData.department, 10) : null;
            payload.designation = formData.designation ? parseInt(formData.designation, 10) : null;
            payload.employee_type = formData.employee_type ? parseInt(formData.employee_type, 10) : null;
            payload.grade = formData.grade ? parseInt(formData.grade, 10) : null;
            payload.base_location = formData.base_location ? parseInt(formData.base_location, 10) : null;
            payload.reporting_manager = formData.reporting_manager ? parseInt(formData.reporting_manager, 10) : null;
        } else {
            payload.profile_type = formData.organization_type || '';
            payload.organization_name = formData.organization_name || '';
            payload.contact_person = ''; // optional - you can map if you collect
            payload.phone = formData.contact_phone || '';
            payload.service_categories = [];
        }

        onSubmit(payload as UserCreatePayload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserType)}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="organizational" disabled={isEditMode}>
                                Organizational
                            </TabsTrigger>
                            <TabsTrigger value="external" disabled={isEditMode}>
                                External
                            </TabsTrigger>
                        </TabsList>

                        {/* Account Information */}
                        <div className="mt-6 space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Account Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className={errors.username ? 'border-destructive' : ''}
                                        disabled={isEditMode}
                                    />
                                    {errors.username && (
                                        <p className="text-xs text-destructive">{errors.username}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">Employee ID</Label>
                                    <Input
                                        id="employee_id"
                                        value={formData.employee_id}
                                        onChange={(e) => handleInputChange('employee_id', e.target.value)}
                                    />
                                </div>
                            </div>

                            {!isEditMode && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password *</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-xs text-destructive">{errors.password}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm_password">Confirm Password *</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirm_password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.confirm_password}
                                                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                                                className={errors.confirm_password ? 'border-destructive pr-10' : 'pr-10'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.confirm_password && (
                                            <p className="text-xs text-destructive">{errors.confirm_password}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Personal Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name *</Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                        className={errors.first_name ? 'border-destructive' : ''}
                                    />
                                    {errors.first_name && (
                                        <p className="text-xs text-destructive">{errors.first_name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name *</Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                                        className={errors.last_name ? 'border-destructive' : ''}
                                    />
                                    {errors.last_name && (
                                        <p className="text-xs text-destructive">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive">{errors.email}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(v) => handleInputChange('gender', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M">Male</SelectItem>
                                            <SelectItem value="F">Female</SelectItem>
                                            <SelectItem value="O">Other / Non-binary</SelectItem>
                                            <SelectItem value="N">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Organizational Profile Tab Content */}
                        <TabsContent value="organizational" className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Organizational Information
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Select
                                        value={formData.company}
                                        onValueChange={(v) => handleInputChange('company', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterData.companies.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="grade">Grade</Label>
                                    <Select
                                        value={formData.grade}
                                        onValueChange={(v) => handleInputChange('grade', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterData.grades.map((g) => (
                                                <SelectItem key={g.id} value={String(g.id)}>
                                                    {g.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Select
                                        disabled={!formData.company}
                                        value={formData.department}
                                        onValueChange={(v) => handleInputChange('department', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(filteredDepartments.length > 0 ? filteredDepartments : [])
                                                .map((d) => (
                                                    <SelectItem key={d.department_id} value={String(d.department_id)}>
                                                        {d.dept_name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Select
                                        disabled={!formData.department}
                                        value={formData.designation}
                                        onValueChange={(v) => handleInputChange('designation', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select designation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(filteredDesignations.length > 0 ? filteredDesignations : [])
                                                .map((d) => (
                                                    <SelectItem key={d.designation_id} value={String(d.designation_id)}>
                                                        {d.designation_name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_type">Employee Type</Label>
                                    <Select
                                        value={formData.employee_type}
                                        onValueChange={(v) => handleInputChange('employee_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterData.employeeTypes.map((e) => (
                                                <SelectItem key={e.id} value={String(e.id)}>
                                                    {e.type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="base_location">Base Location</Label>
                                    <Select
                                        value={formData.base_location}
                                        onValueChange={(v) => handleInputChange('base_location', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterData.locations.map((l) => (
                                                <SelectItem key={l.location_id} value={String(l.location_id)}>
                                                    {l.location_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reporting_manager">Reporting Manager</Label>
                                    <Select
                                        value={formData.reporting_manager}
                                        onValueChange={(v) => handleInputChange('reporting_manager', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterData.managers.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)}>
                                                    {m.first_name} {m.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between space-y-2 pt-6">
                                    <Label htmlFor="is_active">Active Status</Label>
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(v) => handleInputChange('is_active', v)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* External Profile Tab Content */}
                        <TabsContent value="external" className="mt-6 space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                External Profile
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="organization_name">Organization Name</Label>
                                    <Input
                                        id="organization_name"
                                        value={formData.organization_name}
                                        onChange={(e) => handleInputChange('organization_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="organization_type">Organization Type</Label>
                                    <Select
                                        value={formData.organization_type}
                                        onValueChange={(v) => handleInputChange('organization_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vendor">Vendor</SelectItem>
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="partner">Partner</SelectItem>
                                            <SelectItem value="consultant">Consultant</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone">Contact Phone</Label>
                                    <Input
                                        id="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="external_reference_id">External Reference ID</Label>
                                    <Input
                                        id="external_reference_id"
                                        value={formData.external_reference_id}
                                        onChange={(e) => handleInputChange('external_reference_id', e.target.value)}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
