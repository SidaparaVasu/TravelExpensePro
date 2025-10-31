import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Eye, Filter, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { accommodationAPI } from '@/src/api/master_accommodation';
import { locationAPI } from "@/src/api/master_location";
import GuestHouseDetailModal from './GuestHouseDetailModal';

const GuestHouseList = ({ onEdit }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    property_type: '',
    ownership_type: '',
    is_active: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dropdownData, setDropdownData] = useState({ cities: [], states: [] });

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // const response = await accommodationAPI.guestHouse.getAll(searchTerm, filters);
      const response = await accommodationAPI.guestHouse.getAll();
      setData(response.data.results);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load guest houses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [cities, states] = await Promise.all([
        locationAPI.getCities(),
        locationAPI.fetchAllStates()
      ]);
      setDropdownData({ cities: cities.data.data, states: states.data.data });
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      state: '',
      property_type: '',
      ownership_type: '',
      is_active: ''
    });
    setSearchTerm('');
    fetchData();
  };

  const handleToggleActive = async (id, currentStatus, name) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${name}"?`)) return;

    try {
      await accommodationAPI.guestHouse.toggleActive(id, !currentStatus);
      fetchData();
    } catch (error) {
      console.error('Toggle error:', error);
      alert(`Failed to ${action} guest house`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently DELETE "${name}"? This cannot be undone!`)) return;

    try {
      await accommodationAPI.guestHouse.delete(id);
      alert('Guest house deleted permanently');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete guest house');
    }
  };

  const handleView = (id) => {
    setViewId(id);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg border border-b p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Guest Houses</h1>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name, address, contact..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button onClick={handleSearch}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-700">
                  Search
                </button>
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                <Filter size={20} />
                Filters
              </button>
              <button onClick={() => onEdit(null)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded">
                <Plus size={20} />
                Add New
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                <div className="grid grid-cols-5 gap-4">
                  <select value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded">
                    <option value="">All Cities</option>
                    {dropdownData.cities.map(c => (
                      <option key={c.id} value={c.id}>{c.city_name}</option>
                    ))}
                  </select>

                  <select value={filters.state} onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded">
                    <option value="">All States</option>
                    {dropdownData.states.map(s => (
                      <option key={s.id} value={s.id}>{s.state_name}</option>
                    ))}
                  </select>

                  <select value={filters.property_type} onChange={(e) => handleFilterChange('property_type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded">
                    <option value="">All Property Types</option>
                    <option value="guest_house">Guest House</option>
                    <option value="service_apartment">Service Apartment</option>
                    <option value="transit_lodge">Transit Lodge</option>
                  </select>

                  <select value={filters.ownership_type} onChange={(e) => handleFilterChange('ownership_type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded">
                    <option value="">All Ownership</option>
                    <option value="company_owned">Company-owned</option>
                    <option value="leased">Leased</option>
                    <option value="third_party">Third-party</option>
                  </select>

                  <select value={filters.is_active} onChange={(e) => handleFilterChange('is_active', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded">
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={applyFilters}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Apply Filters
                  </button>
                  <button onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-b overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No guest houses found</p>
                <p className="text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rooms</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.ownership_type?.replace('_', ' ')}</div>
                        </td>
                        {/* <td className="px-6 py-4 text-sm text-gray-700">
                          {item.property_type?.replace('_', ' ').toUpperCase()}
                        </td> */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.city_name}</div>
                          <div className="text-sm text-gray-500">{item.state_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.contact_person}</div>
                          <div className="text-sm text-gray-500">{item.phone_number}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.total_rooms || '-'}
                        </td>
                        <td className="px-6 py-8 flex items-center gap-1">
                          <button onClick={() => handleToggleActive(item.id, item.is_active, item.name)}
                            className={`rounded ${item.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                            title={item.is_active ? 'Deactivate' : 'Activate'}>
                            {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          <span className={`inline-flex text-xs font-semibold ${item.is_active ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
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
                              title="Deactivate">
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
        </div>
        {viewId && (
          <GuestHouseDetailModal
            guestHouseId={viewId}
            onClose={() => setViewId(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default GuestHouseList;