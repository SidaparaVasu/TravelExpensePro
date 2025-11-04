import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Eye, X, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { toast } from "sonner";
import {Layout} from "@/components/Layout";
import ARCHotelDetailModal from './ARCHotelDetailModel';
import { accommodationAPI } from "@/src/api/master_accommodation";


const ARCHotelList = ({ onEdit }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewId, setViewId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (search = '') => {
        try {
            setLoading(true);
            // Replace with actual API call
            const response = await accommodationAPI.arcHotel.getAll(search);
            setData(response.data.data.results || []);

            // Mock data for demonstration
            // setTimeout(() => {
            //     setData([
            //         {
            //             id: 1,
            //             name: 'Taj Mahal Palace',
            //             hotel_type: 'resort',
            //             star_rating: 5,
            //             category: '5_star',
            //             city_name: 'Mumbai',
            //             state_name: 'Maharashtra',
            //             phone_number: '+91 22 6665 3366',
            //             email: 'reservations@tajhotels.com',
            //             total_rooms: 285,
            //             rate_per_night: 15000.00,
            //             tax_percentage: 12.00,
            //             contract_start_date: '2024-01-01',
            //             contract_end_date: '2024-12-31',
            //             is_active: true
            //         },
            //         {
            //             id: 2,
            //             name: 'ITC Grand Central',
            //             hotel_type: 'business',
            //             star_rating: 5,
            //             category: '5_star',
            //             city_name: 'Mumbai',
            //             state_name: 'Maharashtra',
            //             phone_number: '+91 22 2410 1010',
            //             email: 'reservations@itchotels.in',
            //             total_rooms: 251,
            //             rate_per_night: 12000.00,
            //             tax_percentage: 12.00,
            //             contract_start_date: '2024-01-01',
            //             contract_end_date: '2024-12-31',
            //             is_active: true
            //         }
            //     ]);
            //     setLoading(false);
            // }, 500);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error("Failed to load ARC Hotels");
            setLoading(false);
        }finally {
      setLoading(false);
    }
    };

    const handleSearch = () => {
        fetchData(searchTerm);
    };

    const handleToggleActive = async (id, currentStatus, name) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} "${name}"?`)) return;

        try {
            await accommodationAPI.arcHotel.toggleActive(id, !currentStatus);
            fetchData(searchTerm);
        } catch (error) {
            console.error('Toggle error:', error);
            toast.error(`Failed to ${action} hotel`);            
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently DELETE "${name}"? This cannot be undone!`)) return;

        try {
            await accommodationAPI.arcHotel.delete(id);
            toast.success('Hotel deleted permanently');
            fetchData(searchTerm);
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete hotel');
        }
    };

    const handleView = (id) => {
        setViewId(id);
    };

    const getContractStatus = (startDate, endDate) => {
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (today >= start && today <= end) {
            return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Valid</span>;
        }
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">Expired</span>;
    };

    const calculateTotalRate = (rate, tax) => {
        const taxAmount = (parseFloat(rate) * parseFloat(tax)) / 100;
        const total = parseFloat(rate) + taxAmount;
        return total.toFixed(2);
    };

    return (
        <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg border border-b p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-800">ARC Hotels</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by name, group, city, state, contact, email, GSTIN, PAN..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            {/* <button onClick={handleSearch}
                                className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
                                Search
                            </button> */}
                            {searchTerm && (
                                <button onClick={() => { setSearchTerm(''); fetchData(); }}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    title="Clear Search">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        <button onClick={() => onEdit(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            <Plus size={20} />
                            Add New
                        </button>
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
                            <p className="text-lg">No hotels found</p>
                            <p className="text-sm mt-2">Try adjusting your search</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hotel Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category & Rating</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rooms</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (incl. tax)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                <div className="text-sm text-gray-500 capitalize">{item.hotel_type?.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 capitalize">{item.category?.replace('_', ' ')}</div>
                                                <div className="flex items-center gap-1 text-sm text-yellow-600">
                                                    {item.star_rating && (
                                                        <>
                                                            <Star size={14} fill="currentColor" />
                                                            <span>{item.star_rating} Star</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{item.city_name}</div>
                                                <div className="text-sm text-gray-500">{item.state_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{item.phone_number}</div>
                                                <div className="text-sm text-gray-500">{item.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {item.total_rooms || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    ₹{calculateTotalRate(item.rate_per_night, item.tax_percentage)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Base: ₹{item.rate_per_night} + {item.tax_percentage}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getContractStatus(item.contract_start_date, item.contract_end_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleToggleActive(item.id, item.is_active, item.name)}
                                                        className={`rounded ${item.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                                                        title={item.is_active ? 'Deactivate' : 'Activate'}>
                                                        {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                    </button>
                                                    <span className={`text-xs font-semibold ${item.is_active ? 'text-green-800' : 'text-red-800'}`}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleView(item.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details">
                                                        <Eye size={18} />
                                                    </button>
                                                    <button onClick={() => onEdit(item.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                        title="Edit">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id, item.name)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete">
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

                {viewId && (
                    <ARCHotelDetailModal
                        hotelId={viewId}
                        onClose={() => setViewId(null)}
                    />
                )}
            </div>
        </div>
        </Layout>
    );
};

export default ARCHotelList;