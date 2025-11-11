import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Check, AlertCircle, Building2, DollarSign, MapPin, Phone, Users, Clock, Trash2 } from 'lucide-react';
import { Layout } from "@/components/Layout";
import { masterAPI } from "@/src/api/master";
import { locationAPI } from "@/src/api/master_location";
import { accommodationAPI } from '@/src/api/master_accommodation';

const GuestHouseForm = ({ editId = null, onCancel }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '', property_type: '', ownership_type: '', is_active: true, manager: '',
    gstin: '', registration_number: '', vendor_code: '', gl_code: '', rate_card: '', billing_type: '',
    address: '', city: '', district: '', state: '', country: '', pin_code: '',
    contact_person: '', phone_number: '', email: '', emergency_contact: '',
    total_rooms: '', max_occupancy: '', room_types: [], amenities: {},
    check_in_time: '', check_out_time: '', booking_window_days: 30
  });
  const [errors, setErrors] = useState({});
  const [roomTypeInput, setRoomTypeInput] = useState({ type: '', count: '' });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);  

  // States
  const [dropdownData, setDropdownData] = useState({
    countries: [],
    states: [],
    cities: [],
    glCodes: [],
  });

  // Fetch countries and initial data on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        const [countryRes, glCodeRes] = await Promise.all([
          locationAPI.getCountries(),
          masterAPI.getGLCodes(),
        ]);
        
        const countriesList = countryRes.data.results || countryRes.data.data || [];
        const glCodeList = glCodeRes.data.results || glCodeRes.data.results || [];

        setDropdownData((prev) => ({
          ...prev,
          countries: countriesList,
          glCodes: glCodeList,
        }));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  // When country changes → fetch states
  useEffect(() => {
    const fetchStates = async () => {
      console.log(formData.country);
      if (!formData.country) {
        setDropdownData((prev) => ({ ...prev, states: [], cities: [] }));
        return;
      }

      try {
        const res = await locationAPI.getStates(formData.country);
        const statesList = res.data.results || res.data.data || [];
        setDropdownData((prev) => ({ ...prev, states: statesList, cities: [] }));
      } catch (error) {
        console.error("Error fetching states:", error);
        setDropdownData((prev) => ({ ...prev, states: [], cities: [] }));
      }
    };

    fetchStates();
  }, [formData.country]);

  // When state changes → fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.state || !formData.country) {
        setDropdownData((prev) => ({ ...prev, cities: [] }));
        return;
      }

      try {
        const res = await locationAPI.getCities(formData.country, formData.state);
        const citiesList = res.data.results || res.data.data || [];
        setDropdownData((prev) => ({ ...prev, cities: citiesList }));
      } catch (error) {
        console.error("Error fetching cities:", error);
        setDropdownData((prev) => ({ ...prev, cities: [] }));
      }
    };

    fetchCities();
  }, [formData.state]);

  const tabs = [
    { id: 0, label: 'Basic Info', icon: Building2 },
    { id: 1, label: 'Financial', icon: DollarSign },
    { id: 2, label: 'Location', icon: MapPin },
    { id: 3, label: 'Contact', icon: Phone },
    { id: 4, label: 'Capacity', icon: Users },
    { id: 5, label: 'Operations', icon: Clock }
  ];

  const amenitiesList = ['WiFi', 'Parking', 'AC', 'TV', 'Gym', 'Restaurant', 'Laundry', 'Room Service'];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const addRoomType = () => {
    if (roomTypeInput.type && roomTypeInput.count) {
      setFormData(prev => ({
        ...prev,
        room_types: [...prev.room_types, { ...roomTypeInput }]
      }));
      setRoomTypeInput({ type: '', count: '' });
    }
  };

  const removeRoomType = (idx) => {
    setFormData(prev => ({
      ...prev,
      room_types: prev.room_types.filter((_, i) => i !== idx)
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [amenity]: !prev.amenities[amenity] }
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Required';
    if (!formData.address) newErrors.address = 'Required';
    if (!formData.contact_person) newErrors.contact_person = 'Required';
    if (!formData.phone_number) newErrors.phone_number = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (editId) {
      const fetchData = async () => {
        try {
          const response = await accommodationAPI.guestHouse.get(editId);
          const data = response.data;

          // Properly map the response data to formData structure
          setFormData({
            name: data.name || '',
            property_type: data.property_type || '',
            ownership_type: data.ownership_type || '',
            is_active: data.is_active ?? true,
            manager: data.manager || '',

            gstin: data.gstin || '',
            registration_number: data.registration_number || '',
            vendor_code: data.vendor_code || '',
            gl_code: data.gl_code || '',
            rate_card: data.rate_card || '',
            billing_type: data.billing_type || '',

            address: data.address || '',
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            district: data.district || '',
            pin_code: data.pin_code || '',

            contact_person: data.contact_person || '',
            phone_number: data.phone_number || '',
            email: data.email || '',
            emergency_contact: data.emergency_contact || '',

            total_rooms: data.total_rooms || '',
            max_occupancy: data.max_occupancy || '',
            room_types: data.room_types || [],
            amenities: data.amenities || {},

            check_in_time: data.check_in_time || '',
            check_out_time: data.check_out_time || '',
            booking_window_days: data.booking_window_days || 30
          });
        } catch (error) {
          console.error('Error fetching guest house:', error);
          toast.error("Failed to load guest house data");
        }
      };
      fetchData();
    }
  }, [editId]);

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setSubmitting(true);
      // const response = await accommodationAPI.guestHouse.create(formData);
      const response = editId
        ? await accommodationAPI.guestHouse.update(editId, formData)
        : await accommodationAPI.guestHouse.create(formData);
      toast.success("Guest House saved successfully!");

      if (onCancel) onCancel(); // Redirect back to list
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to save. Please try again.');

    } finally {
      setSubmitting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Basic Info
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Type</label>
                <select value={formData.property_type} onChange={(e) => updateField('property_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select</option>
                  <option value="guest_house">Guest House</option>
                  <option value="service_apartment">Service Apartment</option>
                  <option value="transit_lodge">Transit Lodge</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ownership Type</label>
                <select value={formData.ownership_type} onChange={(e) => updateField('ownership_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select</option>
                  <option value="company_owned">Company-owned</option>
                  <option value="leased">Leased</option>
                  <option value="third_party">Third-party</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Manager</label>
              <select value={formData.manager} onChange={(e) => updateField('manager', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">Select Manager</option>
                <option value="1">John Doe</option>
                <option value="2">Jane Smith</option>
              </select>
            </div>
            <div className="flex items-center">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => updateField('is_active', e.target.checked)}
                className="mr-2" />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>
        );

      case 1: // Financial
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <input type="text" value={formData.gstin} onChange={(e) => updateField('gstin', e.target.value)} maxLength="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Registration Number</label>
                <input type="text" value={formData.registration_number} onChange={(e) => updateField('registration_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vendor Code</label>
                <input type="text" value={formData.vendor_code} onChange={(e) => updateField('vendor_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GL Code</label>
                <select value={formData.gl_code} onChange={(e) => updateField('gl_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select GL Code</option>
                  {dropdownData.glCodes.map(gl => (
                    <option key={gl.id} value={gl.id}>{gl.gl_code}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rate Card</label>
                <input type="number" value={formData.rate_card} onChange={(e) => updateField('rate_card', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Type</label>
                <select value={formData.billing_type} onChange={(e) => updateField('billing_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select</option>
                  <option value="per_night">Per Night</option>
                  <option value="per_stay">Per Stay</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2: // Location
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <textarea value={formData.address || ''} onChange={(e) => updateField('address', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                rows="3" />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select value={formData.country} onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select Country</option>
                  {dropdownData.countries?.map(c => (
                    <option key={c.id} value={c.id}>{c.country_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <select value={formData.state} onChange={(e) => updateField('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select State</option>
                  {dropdownData.states.map(s => (
                    <option key={s.id} value={s.id}>{s.state_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <select value={formData.city} onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded">
                  <option value="">Select City</option>
                  {dropdownData.cities?.map(c => (
                    <option key={c.id} value={c.id}>{c.city_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <input type="text" value={formData.district} onChange={(e) => updateField('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PIN Code</label>
              <input type="text" value={formData.pin_code} onChange={(e) => updateField('pin_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="400001" />
            </div>
          </div>
        );

      case 3: // Contact
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person *</label>
              <input type="text" value={formData.contact_person} onChange={(e) => updateField('contact_person', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${errors.contact_person ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.contact_person && <p className="text-red-500 text-xs mt-1">{errors.contact_person}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input type="tel" value={formData.phone_number} onChange={(e) => updateField('phone_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${errors.phone_number ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="+91 1234567890" />
              {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="contact@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Emergency Contact</label>
              <input type="text" value={formData.emergency_contact} onChange={(e) => updateField('emergency_contact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Name & Number" />
            </div>
          </div>
        );

      case 4: // Capacity
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Rooms</label>
                <input type="number" value={formData.total_rooms} onChange={(e) => updateField('total_rooms', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Occupancy</label>
                <input type="number" value={formData.max_occupancy} onChange={(e) => updateField('max_occupancy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Room Types</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={roomTypeInput.type} onChange={(e) => setRoomTypeInput({ ...roomTypeInput, type: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded" placeholder="Type (e.g., Deluxe)" />
                <input type="number" value={roomTypeInput.count} onChange={(e) => setRoomTypeInput({ ...roomTypeInput, count: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded" placeholder="Count" />
                <button onClick={addRoomType} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary">Add</button>
              </div>
              <div className="">
                {formData.room_types && formData.room_types.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-2 sm:grid-cols-1">
                    {formData.room_types.map((rt, idx) => (
                      <div key={idx} className="flex justify-between border border-gray-300 items-center p-2 rounded">
                        <span>{rt.type}: {rt.count} rooms</span>
                        <button onClick={() => removeRoomType(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {amenitiesList.map(amenity => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(formData.amenities?.[amenity] || false)}
                      onChange={() => toggleAmenity(amenity)}
                      className="mr-2"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}

              </div>
            </div>
          </div>
        );

      case 5: // Operations
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in Time</label>
                <input type="time" value={formData.check_in_time} onChange={(e) => updateField('check_in_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out Time</label>
                <input type="time" value={formData.check_out_time} onChange={(e) => updateField('check_out_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Booking Window (Days)</label>
              <input type="number" value={formData.booking_window_days} onChange={(e) => updateField('booking_window_days', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded" />
              <p className="text-xs text-gray-500 mt-1">Maximum days in advance for booking</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form data...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white border border-b rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
                <h1 className="text-2xl font-bold text-slate-800">Guest House</h1>
                <button onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>

              {/* Content */}

              <div className="flex">
                {/* Sidebar Tabs */}
                <div className="w-64 bg-gray-50 border-r border-gray-200">
                  <nav className="space-y-0">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-200'
                            }`}>
                          <Icon size={20} />
                          <span className="font-medium">{tab.label}</span>
                          {isActive && <Check size={16} className="ml-auto" />}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Form Content */}

                <div className="flex-1 p-8">
                  <div className="max-w-4xl">
                    <h2 className="text-xl font-semibold mb-6">{tabs[activeTab].label}</h2>
                    {renderTabContent()}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                      <button onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                        disabled={activeTab === 0}
                        className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                      </button>
                      {activeTab < tabs.length - 1 ? (
                        <button onClick={() => setActiveTab(activeTab + 1)}
                          className="px-6 py-2 bg-primary text-white rounded hover:bg-primary">
                          Next
                        </button>
                      ) : (
                        <button onClick={handleSubmit} disabled={submitting}
                          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                          {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GuestHouseForm;