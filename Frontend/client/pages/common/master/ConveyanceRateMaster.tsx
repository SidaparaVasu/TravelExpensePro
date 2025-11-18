import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, AlertCircle, XCircle } from 'lucide-react';
import { conveyanceRateAPI } from "@/src/api/master_conveyance";
// import { Layout } from "@/components/Layout";

const ConveyanceRateMaster = () => {
  const [rates, setRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterConveyanceType, setFilterConveyanceType] = useState('');
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const conveyanceTypeOptions = [
    { value: 'own_vehicle', label: 'Own Vehicle' },
    { value: 'taxi_with_receipt', label: 'Taxi with Receipt' },
    { value: 'taxi_without_receipt', label: 'Taxi without Receipt (Self Declaration)' },
    { value: 'auto_rickshaw', label: 'Auto Rickshaw' },
    { value: 'public_transport', label: 'Public Transport' },
  ];

  const [formData, setFormData] = useState({
    conveyance_type: '',
    rate_per_km: '',
    max_distance_per_day: '',
    requires_receipt: false,
    max_claim_amount: '',
    effective_from: '',
    effective_to: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    filterRates();
  }, [rates, searchTerm, filterActive, filterConveyanceType]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await conveyanceRateAPI.conveyanceRate.getAll();
      setRates(data.data.results || data);
    } catch (error) {
      showNotification('Failed to fetch conveyance rates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterRates = () => {
    let filtered = rates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => {
        const typeName = conveyanceTypeOptions.find(opt => opt.value === r.conveyance_type)?.label || '';
        return typeName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Active/Inactive filter
    if (filterActive !== 'all') {
      filtered = filtered.filter(r =>
        filterActive === 'active' ? r.is_active : !r.is_active
      );
    }

    // Conveyance type filter
    if (filterConveyanceType) {
      filtered = filtered.filter(r => r.conveyance_type === filterConveyanceType);
    }

    setFilteredRates(filtered);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      conveyance_type: formData.conveyance_type,
      rate_per_km: parseFloat(formData.rate_per_km),
      max_distance_per_day: formData.max_distance_per_day ? parseInt(formData.max_distance_per_day) : null,
      requires_receipt: formData.requires_receipt,
      max_claim_amount: formData.max_claim_amount ? parseFloat(formData.max_claim_amount) : null,
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || null,
      is_active: formData.is_active,
    };

    try {
      if (editingItem) {
        await conveyanceRateAPI.conveyanceRate.update(editingItem.id, payload);
        showNotification('Conveyance rate updated successfully');
      } else {
        await conveyanceRateAPI.conveyanceRate.create(payload);
        showNotification('Conveyance rate created successfully');
      }
      fetchRates();
      closeModal();
    } catch (error) {
      showNotification('Operation failed', 'error');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      conveyance_type: item.conveyance_type,
      rate_per_km: item.rate_per_km.toString(),
      max_distance_per_day: item.max_distance_per_day?.toString() || '',
      requires_receipt: item.requires_receipt,
      max_claim_amount: item.max_claim_amount?.toString() || '',
      effective_from: item.effective_from,
      effective_to: item.effective_to || '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSoftDelete = async (item) => {
    try {
      const payload = { ...item, is_active: false };
      await conveyanceRateAPI.conveyanceRate.update(item.id, payload);
      showNotification('Conveyance rate deactivated successfully');
      fetchRates();
    } catch (error) {
      showNotification('Failed to deactivate rate', 'error');
    }
  };

  const handleHardDelete = async () => {
    if (!deleteTarget) return;

    try {
      await conveyanceRateAPI.conveyanceRate.delete(deleteTarget.id);
      showNotification('Conveyance rate deleted successfully');
      fetchRates();
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      showNotification('Failed to delete rate', 'error');
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
      conveyance_type: '',
      rate_per_km: '',
      max_distance_per_day: '',
      requires_receipt: false,
      max_claim_amount: '',
      effective_from: '',
      effective_to: '',
      is_active: true,
    });
  };

  const getConveyanceTypeLabel = (value) => {
    return conveyanceTypeOptions.find(opt => opt.value === value)?.label || value;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Ongoing';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
                Are you sure you want to permanently delete this conveyance rate? This action cannot be undone.
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
              Conveyance Rate Master
            </h1>
            <p className="text-slate-600">Manage reimbursement rates for different travel modes</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full md:w-auto flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by conveyance type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* <select
                  value={filterConveyanceType}
                  onChange={(e) => setFilterConveyanceType(e.target.value)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {conveyanceTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select> */}
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
            ) : filteredRates.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-600">No conveyance rates found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Conveyance Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Rate per KM
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Max Distance/Day
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Max Claim
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Receipt Required
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Effective Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Currently Effective
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-900">
                            {getConveyanceTypeLabel(rate.conveyance_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          ₹{parseFloat(rate.rate_per_km).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {rate.max_distance_per_day ? `${rate.max_distance_per_day} km` : 'No Limit'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {rate.max_claim_amount ? `₹${parseFloat(rate.max_claim_amount).toLocaleString()}` : 'No Limit'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rate.requires_receipt
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>
                            {rate.requires_receipt ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700 text-sm">
                          {formatDate(rate.effective_from)} - {formatDate(rate.effective_to)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rate.currently_effective
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>
                            {rate.currently_effective ? 'Effective' : 'Not Effective'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${rate.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            {rate.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(rate)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            {rate.is_active && (
                              <button
                                onClick={() => handleSoftDelete(rate)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Deactivate"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => openDeleteConfirm(rate)}
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
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingItem ? 'Edit Conveyance Rate' : 'Create Conveyance Rate'}
                  </h2>
                  <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Conveyance Type */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Conveyance Type *
                      </label>
                      <select
                        value={formData.conveyance_type}
                        onChange={(e) => setFormData({ ...formData, conveyance_type: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select conveyance type</option>
                        {conveyanceTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Rate per KM */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Rate per KM (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.rate_per_km}
                        onChange={(e) => setFormData({ ...formData, rate_per_km: e.target.value })}
                        required
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Max Distance per Day */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Max Distance per Day (km)
                      </label>
                      <input
                        type="number"
                        value={formData.max_distance_per_day}
                        onChange={(e) => setFormData({ ...formData, max_distance_per_day: e.target.value })}
                        placeholder="Leave blank for no limit"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Max Claim Amount */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Max Claim Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.max_claim_amount}
                        onChange={(e) => setFormData({ ...formData, max_claim_amount: e.target.value })}
                        placeholder="Leave blank for no limit"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Effective From */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Effective From *
                      </label>
                      <input
                        type="date"
                        value={formData.effective_from}
                        onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Effective To */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Effective To
                      </label>
                      <input
                        type="date"
                        value={formData.effective_to}
                        onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                        placeholder="Leave blank for ongoing"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="mt-6 space-y-4">
                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.requires_receipt}
                        onChange={(e) => setFormData({ ...formData, requires_receipt: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 font-medium">Requires Receipt</span>
                    </label>

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
    // </Layout>
  );
};

export default ConveyanceRateMaster;