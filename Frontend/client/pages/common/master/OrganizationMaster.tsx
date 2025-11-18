import React, { useEffect, useState } from "react";
import { Building2, ChevronDown, ChevronRight, Plus, Edit2, Trash2, X, Save, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { organizationMasterAPI } from "@/src/api/master_company";
// import { Layout } from "@/components/Layout";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

function CompanyDrawer({ isOpen, onClose, data, onSubmit }) {
    const [formData, setFormData] = useState(data || {});
    const [logoPreview, setLogoPreview] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);

    useEffect(() => {
        setFormData(data || {});
        if (data?.logo) setLogoPreview(data.logo);
        if (data?.signature) setSignaturePreview(data.signature);
    }, [data]);

    const handleFileUpload = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (fieldName === 'logo') {
                    setLogoPreview(reader.result);
                } else if (fieldName === 'signature') {
                    setSignaturePreview(reader.result);
                }
            };
            reader.readAsDataURL(file);
            setFormData({ ...formData, [fieldName]: file });
        }
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.address) {
            toast.error("Please fill required fields");
            return;
        }

        const submitData = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            // only append if value exists
            if (value !== null && value !== undefined) {
                // skip appending non-file previews (base64)
                if (value instanceof File || typeof value === "string") {
                    submitData.append(key, value);
                }
            }
        });

        onSubmit(submitData);
    };


    if (!isOpen) return null;

    return (
        <>
            <div className={`fixed inset-0 transition-opacity bg-black bg-opacity-50 z-40 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-slate-800">
                            {data ? "Edit Company" : "Add Company"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Company Name"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Company Address <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    placeholder="Enter Company Address"
                                    value={formData.address || ""}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Pincode <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Pincode"
                                    value={formData.pincode || ""}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Phone Number"
                                    value={formData.phone_number || ""}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter Email Address"
                                    value={formData.email_address || ""}
                                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Website
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Website"
                                    value={formData.website || ""}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Company Logo
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                                    {logoPreview ? (
                                        <div className="space-y-3">
                                            <img src={logoPreview} alt="Logo preview" className="w-32 h-32 object-contain mx-auto" />
                                            <label className="cursor-pointer">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 text-sm rounded-md transition-colors">
                                                    <Upload className="w-4 h-4" />
                                                    Upload
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="flex flex-col items-center py-8">
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 text-sm rounded-md transition-colors">
                                                    Upload
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, 'logo')}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Signature
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                                    {signaturePreview ? (
                                        <div className="space-y-3">
                                            <img src={signaturePreview} alt="Signature preview" className="w-32 h-32 object-contain mx-auto" />
                                            <label className="cursor-pointer">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 text-sm rounded-md transition-colors">
                                                    <Upload className="w-4 h-4" />
                                                    Upload
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'signature')}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="flex flex-col items-center py-8">
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 text-sm rounded-md transition-colors">
                                                    Upload
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, 'signature')}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div> */}
                        </div> 
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-200 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
        </>
    );
}

function CompanyCard({ expanded, onToggle, company, departments, designations, onEdit, onDelete, onAddDept, onEditDept, onDeleteDept, onAddDesig, onEditDesig, onDeleteDesig }) {
    const companyDepts = departments.filter(d => d.company === company.id);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <button onClick={onToggle} className="text-slate-600 hover:text-slate-800">
                            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800">{company.name}</h3>
                            <p className="text-sm text-slate-600">{company.address}</p>
                            {company.email_address && <p className="text-xs text-slate-500 mt-1">{company.email_address}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onAddDept(company)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                            <Plus className="w-4 h-4" />Add Dept
                        </button>
                        <button onClick={() => onEdit(company)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(company.id)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            {expanded && (
                <div className="p-4">
                    {companyDepts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">No departments found</p>
                            <button onClick={() => onAddDept(company)} className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                                Add first department
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {companyDepts.map(dept => (
                                <DepartmentCard
                                    key={dept.department_id}
                                    department={dept}
                                    designations={designations.filter(d => d.department === dept.department_id)}
                                    onEdit={onEditDept}
                                    onDelete={onDeleteDept}
                                    onAddDesig={onAddDesig}
                                    onEditDesig={onEditDesig}
                                    onDeleteDesig={onDeleteDesig}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DepartmentCard({ department, designations, onEdit, onDelete, onAddDesig, onEditDesig, onDeleteDesig }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <button onClick={() => setExpanded(!expanded)} className="text-slate-600 hover:text-slate-800">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-800">{department.dept_name}</h4>
                            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{department.dept_code}</span>
                            <span className="text-xs text-slate-500">({designations.length} designations)</span>
                        </div>
                        {department.description && <p className="text-xs text-slate-600 mt-1">{department.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onAddDesig(department)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1">
                        <Plus className="w-3 h-3" />Designation
                    </button>
                    <button onClick={() => onEdit(department)} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(department.department_id)} className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="px-3 pb-3">
                    {designations.length === 0 ? (
                        <div className="text-center py-4 text-slate-400">
                            <p className="text-xs">No designations found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                            {designations.map(desig => (
                                <div key={desig.designation_id} className="bg-white p-2 rounded border border-gray-200 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800">{desig.designation_name}</span>
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{desig.designation_code}</span>
                                        </div>
                                        {desig.description && <p className="text-xs text-slate-600 mt-1">{desig.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onEditDesig(desig)} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => onDeleteDesig(desig.designation_id)} className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function OrganizationMaster() {
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [companyDrawer, setCompanyDrawer] = useState({ open: false, data: null });
    const [deptModal, setDeptModal] = useState({ open: false, data: null, companyId: null });
    const [desigModal, setDesigModal] = useState({ open: false, data: null, deptId: null });

    const [expandedCompanyId, setExpandedCompanyId] = useState(
        companies.length > 0 ? companies[0].id : null
    );

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [companyRes, deptRes, desigRes] = await Promise.all([
                organizationMasterAPI.company.getAll(),
                organizationMasterAPI.department.getAll(),
                organizationMasterAPI.designation.getAll(),
            ]);
            setCompanies(companyRes.data.results || []);
            setDepartments(deptRes.data.results || []);
            setDesignations(desigRes.data.results || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const filteredCompanies = searchTerm
        ? companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.address?.toLowerCase().includes(searchTerm.toLowerCase()))
        : companies;

    const handleSaveCompany = async (formData) => {
        try {
            if (companyDrawer.data) {
                await organizationMasterAPI.company.update(companyDrawer.data.id, formData);
                toast.success("Company updated successfully!");
            } else {
                await organizationMasterAPI.company.create(formData);
                toast.success("Company created successfully!");
            }
            await fetchAll();
            setCompanyDrawer({ open: false, data: null });
        } catch (error) {
            console.error("Error saving company:", error);
            toast.error(error.response?.data?.message || "Failed to save company");
        }
    };

    const handleDeleteCompany = async (id) => {
        if (window.confirm("Delete this company? All departments and designations will also be deleted.")) {
            try {
                await organizationMasterAPI.company.delete(id);
                toast.success("Company deleted successfully!");
                await fetchAll();
            } catch (error) {
                console.error("Error deleting company:", error);
                toast.error(error.response?.data?.message || "Failed to delete company");
            }
        }
    };

    const handleSaveDept = async (formData) => {
        try {
            if (deptModal.data) {
                await organizationMasterAPI.department.update(deptModal.data.department_id, formData);
                toast.success("Department updated successfully!");
            } else {
                await organizationMasterAPI.department.create({ ...formData, company: deptModal.companyId });
                toast.success("Department created successfully!");
            }
            await fetchAll();
            setDeptModal({ open: false, data: null, companyId: null });
        } catch (error) {
            console.error("Error saving department:", error);
            toast.error(error.response?.data?.message || "Failed to save department");
        }
    };

    const handleDeleteDept = async (id) => {
        if (window.confirm("Delete this department? All designations will also be deleted.")) {
            try {
                await organizationMasterAPI.department.delete(id);
                toast.success("Department deleted successfully!");
                await fetchAll();
            } catch (error) {
                console.error("Error deleting department:", error);
                toast.error(error.response?.data?.message || "Failed to delete department");
            }
        }
    };

    const handleSaveDesig = async (formData) => {
        try {
            if (desigModal.data) {
                const { designation_id, ...updateData } = formData;
                await organizationMasterAPI.designation.update(desigModal.data.designation_id, updateData);
                toast.success("Designation updated successfully!");
            } else {
                await organizationMasterAPI.designation.create({ ...formData, department: desigModal.deptId });
                toast.success("Designation created successfully!");
            }
            await fetchAll();
            setDesigModal({ open: false, data: null, deptId: null });
        } catch (error) {
            console.error("Error saving designation:", error);
            console.error("Full error details:", error.response);
            toast.error(error.response?.data?.message || "Failed to save designation");
        }
    };

    const handleDeleteDesig = async (id) => {
        if (window.confirm("Delete this designation?")) {
            try {
                await organizationMasterAPI.designation.delete(id);
                toast.success("Designation deleted successfully!");
                await fetchAll();
            } catch (error) {
                console.error("Error deleting designation:", error);
                toast.error(error.response?.data?.message || "Failed to delete designation");
            }
        }
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    return (
        // <Layout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-800">Organization Master</h1>
                            <p className="text-sm text-slate-500 mt-1">Manage organizational hierarchy: Companies, Departments, and Designations</p>
                        </div>
                        <button onClick={() => setCompanyDrawer({ open: true, data: null })} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" />Add Company
                        </button>
                    </div>
                    <div className="mb-4">
                        <div className="relative max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" placeholder="Search companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {filteredCompanies.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-600 mb-2">No companies found</p>
                                <button onClick={() => setCompanyDrawer({ open: true, data: null })} className="text-blue-600 hover:text-blue-700 text-sm">
                                    Add your company
                                </button>
                            </div>
                        ) : (
                            filteredCompanies.map(company => (
                                <CompanyCard
                                    key={company.id}
                                    expanded={expandedCompanyId === company.id}
                                    onToggle={() => {
                                        setExpandedCompanyId(prev => (prev === company.id ? null : company.id));
                                    }}
                                    company={company}
                                    departments={departments}
                                    designations={designations}
                                    onEdit={(c) => setCompanyDrawer({ open: true, data: c })}
                                    onDelete={handleDeleteCompany}
                                    onAddDept={(c) => setDeptModal({ open: true, data: null, companyId: c.id })}
                                    onEditDept={(d) => setDeptModal({ open: true, data: d, companyId: d.company })}
                                    onDeleteDept={handleDeleteDept}
                                    onAddDesig={(d) => setDesigModal({ open: true, data: null, deptId: d.department_id })}
                                    onEditDesig={(d) => setDesigModal({ open: true, data: d, deptId: d.department || d.department_id })}
                                    onDeleteDesig={handleDeleteDesig} />
                            ))
                        )}
                    </div>

                    <CompanyDrawer
                        isOpen={companyDrawer.open}
                        onClose={() => setCompanyDrawer({ open: false, data: null })}
                        data={companyDrawer.data}
                        onSubmit={handleSaveCompany}
                    />

                    <Modal
                        isOpen={deptModal.open}
                        onClose={() => setDeptModal({ open: false, data: null, companyId: null })}
                        title={deptModal.data ? "Edit Department" : "Add Department"}>
                        <DepartmentForm
                            data={deptModal.data}
                            onSubmit={handleSaveDept}
                            onCancel={() => setDeptModal({ open: false, data: null, companyId: null })} />
                    </Modal>
                    <Modal
                        isOpen={desigModal.open}
                        onClose={() => setDesigModal({ open: false, data: null, deptId: null })}
                        title={desigModal.data ? "Edit Designation" : "Add Designation"}>
                        <DesignationForm
                            data={desigModal.data}
                            onSubmit={handleSaveDesig}
                            onCancel={() => setDesigModal({ open: false, data: null, deptId: null })} />
                    </Modal>
                </div>
            </div>
        // </Layout>
    );
}

function DepartmentForm({ data, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(data || {});
    const handleSubmit = () => {
        if (!formData.dept_name || !formData.dept_code) {
            toast.error("Please fill required fields");
            return;
        }
        onSubmit(formData);
    };
    return (
        <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Department Name <span className="text-red-500">*</span></label><input type="text" value={formData.dept_name || ""} onChange={(e) => setFormData({ ...formData, dept_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Department Code <span className="text-red-500">*</span></label><input type="text" value={formData.dept_code || ""} onChange={(e) => setFormData({ ...formData, dept_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
            </div>
        </div>
    );
}

function DesignationForm({ data, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(data || {});
    const handleSubmit = () => {
        if (!formData.designation_name || !formData.designation_code) {
            toast.error("Please fill required fields");
            return;
        }
        onSubmit(formData);
    };
    return (
        <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Designation Name <span className="text-red-500">*</span></label><input type="text" value={formData.designation_name || ""} onChange={(e) => setFormData({ ...formData, designation_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Designation Code <span className="text-red-500">*</span></label><input type="text" value={formData.designation_code || ""} onChange={(e) => setFormData({ ...formData, designation_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="flex justify-end gap-2 pt-4 border-gray-200">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
            </div>
        </div>
    );
}