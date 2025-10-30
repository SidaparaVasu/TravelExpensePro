import React, { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { X, Plus, Edit2, Trash2, Save, Search, ChevronDown } from 'lucide-react';
import { locationAPI } from "@/src/api/master_location";

// Mock API client (replace with your actual API)
const mockAPI = {
    // Fetch assigned city categories from your DB
    getCityCategories: async () => {
        return [
            { id: 1, city_name: 'Surat', state_name: 'Gujarat', country_name: 'India', category: 'B' },
            { id: 2, city_name: 'Mumbai', state_name: 'Maharashtra', country_name: 'India', category: 'A' },
            { id: 3, city_name: 'Ahmedabad', state_name: 'Gujarat', country_name: 'India', category: 'A' },
        ];
    },

    // External location API (via Django proxy)
    getCountries: async () => {
        return [
            { code: 'IN', name: 'India' },
            { code: 'US', name: 'United States' },
            { code: 'UK', name: 'United Kingdom' },
        ];
    },

    getStates: async (countryCode) => {
        const statesByCountry = {
            IN: [
                { code: 'GJ', name: 'Gujarat' },
                { code: 'MH', name: 'Maharashtra' },
                { code: 'DL', name: 'Delhi' },
                { code: 'KA', name: 'Karnataka' },
            ],
            US: [
                { code: 'CA', name: 'California' },
                { code: 'NY', name: 'New York' },
                { code: 'TX', name: 'Texas' },
            ],
            UK: [
                { code: 'ENG', name: 'England' },
                { code: 'SCT', name: 'Scotland' },
            ],
        };
        return statesByCountry[countryCode] || [];
    },

    getCities: async (countryCode, stateCode) => {
        const citiesByState = {
            'IN-GJ': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
            'IN-MH': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
            'IN-DL': ['New Delhi', 'Delhi Cantonment'],
            'IN-KA': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli'],
            'US-CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
            'US-NY': ['New York City', 'Buffalo', 'Albany', 'Rochester'],
            'UK-ENG': ['London', 'Manchester', 'Birmingham', 'Liverpool'],
        };
        return citiesByState[`${countryCode}-${stateCode}`] || [];
    },

    // CRUD operations
    saveCityCategory: async (data) => {
        console.log('Saving:', data);
        return { ...data, id: Date.now() };
    },

    updateCityCategory: async (id, data) => {
        console.log('Updating:', id, data);
        return { ...data, id };
    },

    deleteCityCategory: async (id) => {
        console.log('Deleting:', id);
    },

    bulkDeleteCityCategories: async (ids) => {
        console.log('Bulk deleting:', ids);
    },
};

export default function CityCategoryManager() {
    const [cityCategories, setCityCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);

    useEffect(() => {
        loadCityCategories();
    }, []);

    const loadCityCategories = async () => {
        setLoading(true);
        try {
            const data = await mockAPI.getCityCategories();
            setCityCategories(data);
        } catch (error) {
            console.error('Failed to load city categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this city category assignment?')) {
            await mockAPI.deleteCityCategory(id);
            setCityCategories(cityCategories.filter((c) => c.id !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (confirm(`Are you sure you want to delete ${selectedRows.length} items?`)) {
            await mockAPI.bulkDeleteCityCategories(selectedRows);
            setCityCategories(cityCategories.filter((c) => !selectedRows.includes(c.id)));
            setSelectedRows([]);
            setShowBulkActions(false);
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingItem) {
                const updated = await mockAPI.updateCityCategory(editingItem.id, formData);
                setCityCategories(cityCategories.map((c) => (c.id === editingItem.id ? updated : c)));
            } else {
                const newItem = await mockAPI.saveCityCategory(formData);
                setCityCategories([...cityCategories, newItem]);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const toggleRowSelection = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === filteredData.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredData.map((c) => c.id));
        }
    };

    const filteredData = cityCategories.filter(
        (c) =>
            c.city_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.country_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryBadge = (category) => {
        const colors = {
            A: 'bg-green-100 text-green-700',
            B: 'bg-blue-100 text-blue-700',
            C: 'bg-orange-100 text-orange-700',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors[category]}`}>
                Category {category}
            </span>
        );
    };

    return (
        <Layout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-800">City Category Assignment</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Assign categories to cities for DA rate calculation
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Assign Category
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        placeholder="Search by city, state, or country..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                    />
                                </div>

                                {selectedRows.length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowBulkActions(!showBulkActions)}
                                            className="px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                        >
                                            Bulk Actions ({selectedRows.length})
                                            <ChevronDown className="w-4 h-4" />
                                        </button>

                                        {showBulkActions && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                <button
                                                    onClick={handleBulkDelete}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    Delete Selected
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-3 px-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">City</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">State</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Country</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Category</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                                                No city categories assigned yet
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.includes(item.id)}
                                                        onChange={() => toggleRowSelection(item.id)}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-slate-700">{item.city_name}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600">{item.state_name}</td>
                                                <td className="py-3 px-4 text-sm text-slate-600">{item.country_name}</td>
                                                <td className="py-3 px-4">{getCategoryBadge(item.category)}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <AssignCategoryModal
                            isOpen={showModal}
                            onClose={() => setShowModal(false)}
                            editingItem={editingItem}
                            onSave={handleSave}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
}

function AssignCategoryModal({ isOpen, onClose, editingItem, onSave }) {
    const [formData, setFormData] = useState(
        editingItem || {
            country_name: '',
            state_name: '',
            city_name: '',
            category: '',
        }
    );

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const [selectedCountry, setSelectedCountry] = useState(editingItem?.country_name || '');
    const [selectedState, setSelectedState] = useState(editingItem?.state_name || '');

    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        loadCountries();
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            loadStates(selectedCountry);
        } else {
            setStates([]);
            setCities([]);
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedCountry && selectedState) {
            loadCities(selectedCountry, selectedState);
        } else {
            setCities([]);
        }
    }, [selectedState]);

    // Mock API calls
    const loadCountries = async () => {
        const data = await mockAPI.getCountries();
        setCountries(data);
    };

    const loadStates = async (countryCode) => {
        setLoadingStates(true);
        try {
            const data = await mockAPI.getStates(countryCode);
            setStates(data);
        } finally {
            setLoadingStates(false);
        }
    };

    const loadCities = async (countryCode, stateCode) => {
        setLoadingCities(true);
        try {
            const data = await mockAPI.getCities(countryCode, stateCode);
            setCities(data);
        } finally {
            setLoadingCities(false);
        }
    };

    // Real API calls
    const fetchCountries = async () => {
        try {
            const data = await locationAPI.getCountries();
            setCountries(data);
        } catch (err) {
            console.error("Failed to fetch countries:", err);
        }
    };

    const fetchStates = async (countryCode: string) => {
        try {
            const data = await locationAPI.getStates(countryCode);
            setStates(data);
        } catch (err) {
            console.error("Failed to fetch states:", err);
        }
    };

    const fetchCities = async (countryCode: string, stateCode: string) => {
        try {
            const data = await locationAPI.getCities(countryCode, stateCode);
            setCities(data);
        } catch (err) {
            console.error("Failed to fetch cities:", err);
        }
    };

    const handleCountryChange = (countryCode) => {
        const country = countries.find((c) => c.code === countryCode);
        setSelectedCountry(countryCode);
        setSelectedState('');
        setFormData({
            ...formData,
            country_name: country?.name || '',
            state_name: '',
            city_name: '',
        });
    };

    const handleStateChange = (stateCode) => {
        const state = states.find((s) => s.code === stateCode);
        setSelectedState(stateCode);
        setFormData({
            ...formData,
            state_name: state?.name || '',
            city_name: '',
        });
    };

    const handleCityChange = (cityName) => {
        setFormData({
            ...formData,
            city_name: cityName,
        });
    };

    const handleSubmit = () => {
        if (!formData.country_name || !formData.state_name || !formData.city_name || !formData.category) {
            alert('Please fill all required fields');
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {editingItem ? 'Edit Category Assignment' : 'Assign City Category'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            disabled={!!editingItem}
                        >
                            <option value="">Select Country</option>
                            {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            State <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            disabled={!selectedCountry || loadingStates || !!editingItem}
                        >
                            <option value="">
                                {loadingStates ? 'Loading states...' : 'Select State'}
                            </option>
                            {states.map((s) => (
                                <option key={s.code} value={s.code}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            City <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.city_name}
                            onChange={(e) => handleCityChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            disabled={!selectedState || loadingCities || !!editingItem}
                        >
                            <option value="">
                                {loadingCities ? 'Loading cities...' : 'Select City'}
                            </option>
                            {cities.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            {['A', 'B', 'C'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                    className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${formData.category === cat
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                        : 'border-gray-200 text-slate-600 hover:border-gray-300'
                                        }`}
                                >
                                    Category {cat}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            A: Metro cities • B: Tier-2 cities • C: Tier-3 cities
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save Assignment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}