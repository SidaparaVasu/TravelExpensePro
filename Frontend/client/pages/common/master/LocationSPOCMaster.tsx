import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, AlertCircle, XCircle, UserCheck } from 'lucide-react';
// import { toast } from "sonner";
import { useToast } from '@/components/ui/use-toast';
// import { Layout } from "@/components/Layout";
import { locationSpocAPI } from "@/src/api/master_location_spoc";
import { locationAPI } from "@/src/api/master_location";
import { userAPI } from "@/src/api/users";

const LocationSPOCMaster = () => {
    const [spocs, setSpocs] = useState([]); 
    const [filteredSpocs, setFilteredSpocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('all');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterSpocType, setFilterSpocType] = useState('');
    const [notification, setNotification] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { toast } = useToast();

    // Dropdown data
    const [locations, setLocations] = useState([]);
    const [locationsMaster, setLocationsMaster] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const SPOC_TYPE_CHOICES = [
        { value: 'local', label: 'Local Transport' },
        { value: 'inter_unit', label: 'Inter-Unit Transport' },
        { value: 'both', label: 'Both Local & Inter-Unit' },
    ];

    const [formData, setFormData] = useState({
        location: '',
        spoc_user: '',
        spoc_type: '',
        phone_number: '',
        email: '',
        backup_spoc: '',
        is_active: true,
    });

    useEffect(() => {
        fetchSpocs();
        fetchDropdownData();
    }, []);

    useEffect(() => {
        filterSpocs();
    }, [spocs, searchTerm, filterActive, filterLocation, filterSpocType]);

    // Filter users based on selected location
    // useEffect(() => {
    //     if (formData.location) {
    //         console.log(formData.location, parseInt(formData.location)); // formData.location (value: string), parseInt(formData.location) (value: NaN)
    //         // TODO: API call to fetch users filtered by location
    //         const filtered = users.filter(u => u.base_location === parseInt(formData.location));
    //         setFilteredUsers(filtered);

    //         // Reset user selections if location changes
    //         // Reset only if NOT editing
    //         if (!editingItem) {
    //             setFormData((prev) => ({
    //                 ...prev,
    //                 spoc_user: '',
    //                 backup_spoc: '',
    //             }));
    //         }
    //     } else {
    //         setFilteredUsers([]);
    //     }
    // }, [formData.location, users, editingItem]);
    // 🔹 Fetch users from backend based on selected location
    useEffect(() => {
        const fetchUsersByLocation = async () => {
            if (!formData.location) {
                setFilteredUsers([]);
                return;
            }

            try {
                console.log("Form Data: ", formData)
                // Call backend API for users filtered by base_location
                const data = await userAPI.getAll({base_location: Number(formData.location),});

                // Handle both possible DRF formats
                const results = data.data?.results || data.results || data;
                setFilteredUsers(results);

                // Reset spoc_user and backup_spoc when location changes
                if (!editingItem) { 
                    setFormData(prev => ({
                        ...prev,
                        spoc_user: '',
                        backup_spoc: '',
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch users by location:', error);
                setFilteredUsers([]);
            }
        };

        fetchUsersByLocation();
    }, [formData.location, editingItem]);


    const fetchDropdownData = async () => {
        try {
            // TODO: API call to fetch locations
            const locationsData = await locationSpocAPI.getAll();
            setLocations(locationsData.data.results || locationsData.results);

            const locMasterData = await locationAPI.location.getAll();
            setLocationsMaster(locMasterData.data.results || []);

            // TODO: API call to fetch all users (will be filtered by location)
            const usersData = await userAPI.getAll();
            setUsers(usersData.data.results || usersData.results);
        } catch (error) {
            console.log(error);
            showNotification('Failed to fetch dropdown data', 'error');
        }
    };

    const fetchSpocs = async () => {
        setLoading(true);
        try {
            // TODO: API call to fetch Location SPOCs with filters
            // Example: 
            const params = new URLSearchParams();
            if (filterLocation) params.append('base_location', filterLocation);
            if (filterSpocType) params.append('spoc_type', filterSpocType);

            console.log(params);
            const data = await locationSpocAPI.getAll(params);
            setSpocs(data.data.results || data.results);

            setLoading(false);
        } catch (error) {
            console.log(error);
            showNotification('Failed to fetch Location SPOCs', 'error');
            setLoading(false);
        }
    };

    const filterSpocs = () => {
        let filtered = spocs;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.spoc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.phone_number?.includes(searchTerm)
            );
        }

        // Active/Inactive filter
        if (filterActive !== 'all') {
            filtered = filtered.filter(s =>
                filterActive === 'active' ? s.is_active : !s.is_active
            );
        }

        // Location filter
        if (filterLocation) {
            console.log("FILTER LOCATIONS: ", parseInt(filterLocation));
            filtered.filter(s => console.log(s.location));
            filtered = filtered.filter(s => s.location === parseInt(filterLocation));
        }

        // SPOC Type filter
        if (filterSpocType) {
            filtered = filtered.filter(s => s.spoc_type === filterSpocType);
        }

        console.log("Filtered: ", filtered);
        setFilteredSpocs(filtered);
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            location: parseInt(formData.location),
            spoc_user: parseInt(formData.spoc_user),
            spoc_type: formData.spoc_type,
            phone_number: formData.phone_number,
            email: formData.email,
            backup_spoc: formData.backup_spoc ? parseInt(formData.backup_spoc) : null,
            is_active: formData.is_active,
        };

        console.log(payload);

        // TODO: API call to create/update Location SPOC
        if (editingItem) {
            try {
                await locationSpocAPI.update(editingItem.id, payload);
                showNotification('Location SPOC updated successfully');
            } catch (error) {
                console.log(error.response);
                const response = error.response?.data;
                if (response) {
                    const errors = response.errors
                        ? Object.entries(response.errors)
                            .map(([field, msgs]) => `• ${field}: ${msgs.join(', ')}`)
                            .join('\n')
                        : '';

                    toast({ title: response.message || "SPOC Type must be unique", description: "SPOC Type is already associated with this location!", variant: 'destructive' });
                } else {
                    toast({ description: "Network error or server unavailable", variant: 'destructive' });
                }
            }
        } else {
            try {
                await locationSpocAPI.create(payload);
                showNotification('Location SPOC created successfully');
            } catch (error) {
                console.log(error.response);
                const response = error.response?.data;
                if (response) {
                    const errors = response.errors
                        ? Object.entries(response.errors)
                            .map(([field, msgs]) => `• ${field}: ${msgs.join(', ')}`)
                            .join('\n')
                        : '';

                    toast({ title: response.message || "SPOC Type must be unique", description: "SPOC Type is already associated with this location!", variant: 'destructive' });
                } else {
                    toast({ description: "Network error or server unavailable", variant: 'destructive' });
                }
            }
        }
        fetchSpocs();
        closeModal();
    };

    const handleEdit = (item) => {
        setEditingItem(item);

        setFormData({
            location: item.location?.toString() || '',
            spoc_user: item.spoc_user?.toString() || '',
            spoc_type: item.spoc_type || '',
            phone_number: item.phone_number || '',
            email: item.email || '',
            backup_spoc: item.backup_spoc?.toString() || '',
            is_active: item.is_active ?? true,
        });

        setShowModal(true);
    };


    const handleSoftDelete = async (item) => {
        try {
            const payload = { ...item, is_active: false };
            // TODO: API call to soft delete (deactivate) Location SPOC
            await locationSpocAPI.update(item.id, payload);
            showNotification('Location SPOC deactivated successfully');
            fetchSpocs();
        } catch (error) {
            showNotification('Failed to deactivate Location SPOC', 'error');
        }
    };

    const handleHardDelete = async () => {
        if (!deleteTarget) return;

        try {
            // TODO: API call to permanently delete Location SPOC
            await locationSpocAPI.delete(deleteTarget.id);
            showNotification('Location SPOC deleted successfully');
            fetchSpocs();
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        } catch (error) {
            showNotification('Failed to delete Location SPOC', 'error');
        }
    };

    const openDeleteConfirm = (item) => {
        setDeleteTarget(item);
        setShowDeleteConfirm(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            location: '',
            spoc_user: '',
            spoc_type: '',
            phone_number: '',
            email: '',
            backup_spoc: '',
            is_active: true,
        });
    };

    const getSpocTypeLabel = (value) => {
        const choice = SPOC_TYPE_CHOICES.find(c => c.value === value);
        return choice ? choice.label : value;
    };

    return (
        // <Layout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        } text-white animate-fade-in`}>
                        {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        {notification.message}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Confirm Delete</h3>
                                <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to permanently delete this Location SPOC? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleHardDelete}
                                    className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Confirm
                                </button>
                            </div>
                        </div> 
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                            Location SPOC Master
                        </h1>
                        <p className="text-slate-600">Manage location-wise single points of contact for vehicle bookings</p>
                    </div>

                    {/* Controls */}
                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by SPOC name, location, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <select
                                    value={filterLocation}
                                    onChange={(e) => setFilterLocation(e.target.value)}
                                    className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Locations</option>
                                    {locationsMaster.map(location => (
                                        <option key={location.location_id} value={location.location_id}>{location.location_name}</option>
                                    ))}
                                </select>

                                <select
                                    value={filterSpocType}
                                    onChange={(e) => setFilterSpocType(e.target.value)}
                                    className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All SPOC Types</option>
                                    {SPOC_TYPE_CHOICES.map(choice => (
                                        <option key={choice.value} value={choice.value}>{choice.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 justify-between items-center">
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
                        ) : filteredSpocs.length === 0 ? (
                            <div className="p-12 text-center">
                                <UserCheck className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-600">No Location SPOCs found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                SPOC Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                SPOC Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Phone Number
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Backup SPOC
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredSpocs.map((spoc) => (
                                            <tr key={spoc.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-900">{spoc.location_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                    {spoc.spoc_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                                        {getSpocTypeLabel(spoc.spoc_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                    {spoc.phone_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                    {spoc.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                    {spoc.backup_spoc_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${spoc.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {spoc.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(spoc)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        {spoc.is_active && (
                                                            <button
                                                                onClick={() => handleSoftDelete(spoc)}
                                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                title="Deactivate"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openDeleteConfirm(spoc)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Permanently"
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

                    {/* Form Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
                            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {editingItem ? 'Edit Location SPOC' : 'Create Location SPOC'}
                                    </h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Location *
                                            </label>
                                            <select
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="" disabled>Select location</option>
                                                {locationsMaster.map(location => (
                                                    <option key={location.location_id} value={location.location_id}>
                                                        {location.location_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* SPOC Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                SPOC Type *
                                            </label>
                                            <select
                                                value={formData.spoc_type}
                                                onChange={(e) => setFormData({ ...formData, spoc_type: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="" disabled>Select SPOC type</option>
                                                {SPOC_TYPE_CHOICES.map(choice => (
                                                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* SPOC User */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                SPOC User *
                                            </label>
                                            <select
                                                value={formData.spoc_user}
                                                onChange={(e) => setFormData({ ...formData, spoc_user: e.target.value })}
                                                disabled={!formData.location}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                                required
                                            >
                                                <option value="" disabled>Select SPOC user</option>
                                                {filteredUsers.map(user => (
                                                    <option key={user.id} value={user.id.toString()}>{user.full_name || user.username}</option>
                                                ))}
                                            </select>
                                            {!formData.location && (
                                                <p className="text-xs text-slate-500 mt-1">Select a location first</p>
                                            )}
                                        </div>

                                        {/* Backup SPOC */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Backup SPOC
                                            </label>
                                            <select
                                                value={formData.backup_spoc}
                                                onChange={(e) => setFormData({ ...formData, backup_spoc: e.target.value })}
                                                disabled={!formData.location}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                            >
                                                <option value="" disabled>Select backup SPOC (optional)</option>
                                                {filteredUsers.filter(u => u.id !== parseInt(formData.spoc_user)).map(user => (
                                                    <option key={user.id} value={user.id.toString()}>{user.full_name || user.username}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                maxLength={15}
                                                placeholder="e.g., +91 9876543210"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="e.g., spoc@company.com"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Active Status */}
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
                                            type="button"
                                            onClick={handleSubmit}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                                        >
                                            {editingItem ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        // </Layout>
    );
};

export default LocationSPOCMaster;