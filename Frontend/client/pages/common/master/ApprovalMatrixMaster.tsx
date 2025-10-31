import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, X, Check, AlertCircle } from 'lucide-react';
import { approvalMatrixAPI } from "@/src/api/master_approvalmatrix";
import { masterAPI } from "@/src/api/master";
import { travelAPI } from "@/src/api/travel";
import { Layout } from "@/components/Layout";

const ApprovalMatrix = () => {
    const [matrices, setMatrices] = useState([]);
    const [filteredMatrices, setFilteredMatrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('all');
    const [notification, setNotification] = useState(null);
    // const [currentPage, setCurrentPage] = useState(1);
    // const [totalPages, setTotalPages] = useState(1);
    const [pagination, setPagination] = useState({
        next: null,
        previous: null,
        current_page: 1,
        total_pages: 1,
    });


    const [grades, setGrades] = useState([]);
    const [travelModes, setTravelModes] = useState([]);
    const [travelSubOptions, setTravelSubOptions] = useState([]);

    const [formData, setFormData] = useState({
        travel_mode: '',
        travel_sub_option: '',
        employee_grade: '',
        min_amount: '0',
        max_amount: '',
        requires_manager: true,
        requires_chro: false,
        requires_ceo: false,
        flight_above_10k_ceo: true,
        manager_can_view: true,
        manager_can_approve: true,
        advance_booking_required_days: '0',
        is_active: true
    });

    // Fetch dropdown data from APIs
    const fetchDropdownData = async () => {
        try {
            const gradesData = await masterAPI.getGrades();
            setGrades(gradesData.data.results);

            const modesData = await masterAPI.getTravelModes();
            setTravelModes(modesData.data.results);

            const subOptionsData = await travelAPI.getTravelSubOptions();
            setTravelSubOptions(subOptionsData.results);
        } catch (error) {
            showNotification("Failed to fetch dropdown data", "error");
        }
    };

    useEffect(() => {
        fetchMatrices();
        fetchDropdownData();
    }, []);

    useEffect(() => {
        filterMatrices();
    }, [matrices, searchTerm, filterActive]);

    const fetchMatrices = async (page = 1) => {
        setLoading(true);
        try {
            const data = await approvalMatrixAPI.approvalMatrix.getAll();
            setMatrices(data.data.results);
            setPagination({
                next: data.next,
                previous: data.previous,
                current_page: data.current_page,
                total_pages: data.total_pages,
            });
        } catch (error) {
            showNotification('Failed to fetch approval matrices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterMatrices = () => {
        let filtered = matrices;

        if (searchTerm) {
            filtered = filtered.filter(m =>
                m.travel_mode_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.grade_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterActive !== 'all') {
            filtered = filtered.filter(m =>
                filterActive === 'active' ? m.is_active : !m.is_active
            );
        }

        setFilteredMatrices(filtered);
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            travel_mode: parseInt(formData.travel_mode),
            travel_sub_option: formData.travel_sub_option ? parseInt(formData.travel_sub_option) : null,
            employee_grade: parseInt(formData.employee_grade),
            min_amount: parseFloat(formData.min_amount),
            max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
            requires_manager: formData.requires_manager,
            requires_chro: formData.requires_chro,
            requires_ceo: formData.requires_ceo,
            flight_above_10k_ceo: formData.flight_above_10k_ceo,
            manager_can_view: formData.manager_can_view,
            manager_can_approve: formData.manager_can_approve,
            advance_booking_required_days: parseInt(formData.advance_booking_required_days),
            is_active: formData.is_active
        };

        try {
            if (editingItem) {
                await approvalMatrixAPI.approvalMatrix.update(editingItem.id, payload);
                showNotification('Approval matrix updated successfully');
            } else {
                await approvalMatrixAPI.approvalMatrix.create(payload);
                showNotification('Approval matrix created successfully');
            }
            fetchMatrices();
            closeModal();
        } catch (error) {
            showNotification('Operation failed', 'error');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            travel_mode: item.travel_mode,
            travel_sub_option: item.travel_sub_option,
            employee_grade: item.employee_grade,
            min_amount: item.min_amount.toString() || '',
            max_amount: item.max_amount?.toString() || '',
            requires_manager: item.requires_manager,
            requires_chro: item.requires_chro,
            requires_ceo: item.requires_ceo,
            flight_above_10k_ceo: item.flight_above_10k_ceo,
            manager_can_view: item.manager_can_view,
            manager_can_approve: item.manager_can_approve,
            advance_booking_required_days: item.advance_booking_required_days.toString(),
            is_active: item.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this approval matrix?')) {
            try {
                await approvalMatrixAPI.approvalMatrix.delete(id);
                showNotification('Approval matrix deleted successfully');
                fetchMatrices();
            } catch (error) {
                showNotification('Failed to delete approval matrix', 'error');
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            travel_mode: '',
            travel_sub_option: '',
            employee_grade: '',
            min_amount: '0',
            max_amount: '',
            requires_manager: true,
            requires_chro: false,
            requires_ceo: false,
            flight_above_10k_ceo: true,
            manager_can_view: true,
            manager_can_approve: true,
            advance_booking_required_days: '0',
            is_active: true
        });
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        } text-white animate-fade-in`}>
                        {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        {notification.message}
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Approval Matrix Management</h1>
                        <p className="text-slate-600">Manage travel approval workflows and thresholds</p>
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex-1 w-full md:w-auto">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by travel mode or grade..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setFilterActive('all')}
                                        className={`px-4 py-1.5 rounded-md transition-all text-sm font-medium ${filterActive === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterActive('active')}
                                        className={`px-4 py-1.5 rounded-md transition-all text-sm font-medium ${filterActive === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                                            }`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setFilterActive('inactive')}
                                        className={`px-4 py-1.5 rounded-md transition-all text-sm font-medium ${filterActive === 'inactive' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                                            }`}
                                    >
                                        Inactive
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    <Plus size={20} />
                                    <span className="hidden sm:inline">Add New</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading...</p>
                            </div>
                        ) : filteredMatrices.length === 0 ? (
                            <div className="p-12 text-center">
                                <Filter className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-600">No approval matrices found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Travel Mode</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Grade</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount Range</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Approvers</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredMatrices.map((matrix) => (
                                            <tr key={matrix.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-sm text-slate-900">{matrix.travel_mode_name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                                                        {matrix.grade_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                    ₹{matrix.min_amount.toLocaleString()} - {matrix.max_amount ? `₹${matrix.max_amount.toLocaleString()}` : 'No Limit'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {matrix.requires_manager && (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-green-700 rounded text-xs">Manager</span>
                                                        )}
                                                        {matrix.requires_chro && (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-purple-700 rounded text-xs">CHRO</span>
                                                        )}
                                                        {matrix.requires_ceo && (
                                                            <span className="px-2 py-0.5 bg-slate-100 text-orange-700 rounded text-xs">CEO</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${matrix.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {matrix.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(matrix)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(matrix.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {/* Travel Sub Option in modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
                            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {editingItem ? 'Edit Approval Matrix' : 'Create Approval Matrix'}
                                    </h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Travel Mode */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Travel Mode *</label>
                                            <select
                                                value={formData.travel_mode}
                                                onChange={(e) => setFormData({ ...formData, travel_mode: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select travel mode</option>
                                                {travelModes.map(mode => (
                                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Travel Sub Option */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Travel Sub Option</label>
                                            <select
                                                value={formData.travel_sub_option}
                                                onChange={(e) => setFormData({ ...formData, travel_sub_option: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select sub option</option>
                                                {travelSubOptions?.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Employee Grade */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Employee Grade *</label>
                                            <select
                                                value={formData.employee_grade}
                                                onChange={(e) => setFormData({ ...formData, employee_grade: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select grade</option>
                                                {grades.map(grade => (
                                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Min & Max Amount */}
                                        {/* Min Amount */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Amount (₹) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.min_amount}
                                                onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                                                required
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Max Amount */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Maximum Amount (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.max_amount}
                                                onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                                                placeholder="Leave blank for no limit"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Advance Booking Days */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Advance Booking Days</label>
                                            <input
                                                type="number"
                                                value={formData.advance_booking_required_days}
                                                onChange={(e) => setFormData({ ...formData, advance_booking_required_days: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Approval Requirements */}
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Approval Requirements</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.requires_manager}
                                                    onChange={(e) => setFormData({ ...formData, requires_manager: e.target.checked })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-700 font-medium">Requires Manager</span>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.requires_chro}
                                                    onChange={(e) => setFormData({ ...formData, requires_chro: e.target.checked })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-700 font-medium">Requires CHRO</span>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.requires_ceo}
                                                    onChange={(e) => setFormData({ ...formData, requires_ceo: e.target.checked })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-700 font-medium">Requires CEO</span>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.flight_above_10k_ceo}
                                                    onChange={(e) => setFormData({ ...formData, flight_above_10k_ceo: e.target.checked })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-700 font-medium">Flight  ₹10k needs CEO</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Manager Permissions */}
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Manager Permissions</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.manager_can_view}
                                                    onChange={(e) => setFormData({ ...formData, manager_can_view: e.target.checked })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-700 font-medium">Manager Can View</span>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.manager_can_approve}
                                                    onChange={(e) => setFormData({ ...formData, manager_can_approve: e.target.checked })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-700 font-medium">Manager Can Approve</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="mt-6">
                                        <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-slate-700 font-medium">Active</span>
                                        </label>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                        >
                                            {editingItem ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ApprovalMatrix;
