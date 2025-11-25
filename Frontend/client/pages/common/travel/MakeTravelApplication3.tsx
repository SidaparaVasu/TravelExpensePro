import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, Send, ChevronRight, ChevronLeft, Calendar, MapPin, Plane, Home, Car, Wallet } from 'lucide-react';
// import { Layout } from '@/components/Layout';
import { travelAPI } from '@/src/api/travel';
import { locationAPI } from '@/src/api/master_location';
import GuestHouseSelector from './components/GuestHouseSelector';
import GuestSelector from "./components/GuestSelector";

// =============================================
// UTILITY FUNCTIONS
// =============================================    
// const getEmptyTripDetails = () => ({
//     trip_from_location: '',
//     trip_to_location: '',
//     start_date: '',
//     end_date: '',
//     guest_count: '',
// });

const getEmptyTicketing = () => ({
    booking_type: '',
    sub_option: '',
    from_location: '',
    from_label: '',
    to_location: '',
    to_label: '',
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    estimated_cost: '',
    special_instruction: '',
    not_required: false,
});

const getEmptyAccommodation = () => ({
    accommodation_type: '',
    accomodation_type_id: '',
    accommodation_sub_option: '',
    guest_house: '',
    arc_hotel: '',
    place: '',
    check_in_date: '',
    check_in_time: '',
    check_out_date: '',
    check_out_time: '',
    estimated_cost: '',
    special_instruction: '',
    not_required: false,
});

const getEmptyConveyance = () => ({
    from_location: '',
    to_location: '',
    report_at: '',
    drop_location: '',
    vehicle_type: '',
    vehicle_sub_option: '',
    start_date: '',
    start_time: '',
    estimated_cost: '',
    special_instruction: '',
    not_required: false,
    club_booking: true,
    guests: [],
});

// =============================================
// REUSABLE COMPONENTS
// =============================================

// Input Component
const FormInput = ({ label, required, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            {...props}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
    </div>
);

// Textarea Component
const FormTextarea = ({ label, required, rows = 3, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            {...props}
            rows={rows}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
    </div>
);

// Select Component
const FormSelect = ({ label, required, options, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            {...props}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// Datalist Component
// const FormDatalist = ({ label, required, options, name, value, listId, onChange, placeholder = '', ...props }) => (
//   <div>
//     <label className="block text-sm font-medium text-slate-700 mb-1.5">
//       {label} {required && <span className="text-red-500">*</span>}
//     </label>

//     <input
//       {...props}
//       type="text"
//       name={name}
//       list={listId}
//       placeholder={placeholder}
//       value={value || ""}
//       onChange={onChange}
//       autoComplete="off"
//       className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//     />

//     <datalist id={listId}>
//       {options.map((opt, index) => (
//         <option key={`${opt.value}-${index}`} value={opt.value}>
//           {opt.label}
//         </option>
//       ))}
//     </datalist>
//   </div>
// );
const FormDatalist = ({ label, required, options, value, onChange, listId, placeholder, ...props }) => {
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    const handleInputChange = (e) => {
        const newInput = e.target.value;
        setInputValue(newInput);

        // Find selected city by its name
        const selected = options.find(
            (opt) => opt.label.toLowerCase() === newInput.toLowerCase()
        );

        if (selected) {
            onChange(selected.value, selected.label); // send id + label
        } else {
            onChange(null, newInput); // send only text if not matched
        }

        // If valid city selected, send its primary key (value)
        // if (selected) {
        //     onChange(selected.value);
        // } else {
        //     onChange(""); // reset if no valid city
        // }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <input
                list={listId}
                placeholder={placeholder || "Start typing..."}
                value={inputValue}
                onChange={handleInputChange}
                {...props}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />

            <datalist id={listId}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.label} />
                ))}
            </datalist>
        </div>
    );
};

// Button Component
const Button = ({ children, variant = 'primary', icon: Icon, ...props }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
        danger: "bg-red-600 text-white hover:bg-red-700"
    };

    return (
        <button {...props} className={`${baseClasses} ${variants[variant]}`}>
            {Icon && <Icon size={18} />}
            {children}
        </button>
    );
};

// Toast Notification
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000); // Increased to 5 seconds for error messages
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in max-w-md ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
            <div className="flex items-start gap-2">
                <span className="flex-1 text-sm leading-relaxed whitespace-pre-line">
                    {message}
                </span>
                <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors ml-2"
                >
                    ×
                </button>
            </div>
        </div>
    );
};



// Tab Navigation Component
const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="border-b border-slate-200 bg-white">
            <div className="flex overflow-x-auto">
                {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-2 whitespace-nowrap ${isActive
                                ? 'text-blue-600 border-blue-600 bg-blue-50'
                                : 'text-slate-600 border-transparent hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={20} />
                            <span>{tab.label}</span>
                            {index < tabs.length - 1 && !isActive && (
                                <ChevronRight size={16} className="text-slate-400" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// =============================================
// SECTION COMPONENTS
// =============================================

// Purpose Section Component
const PurposeSection = ({ formData, setFormData, setOtherExpenses, cities, glCodes }) => {
    const cityOptions = cities.map(city => ({
        value: city.id,
        label: `${city.city_name} (${city.state_name}, ${city.country_name})`
    }));

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Travel Purpose & Details</h2>
                    <p className="text-sm text-slate-500">Provide basic information about your travel</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <FormTextarea
                        label="Purpose of Travel"
                        required
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        placeholder="Describe the purpose of your travel..."
                        rows={4}
                    />
                </div>

                <FormInput
                    label="Internal Order (IO)"
                    required
                    value={formData.internal_order}
                    onChange={(e) => setFormData({ ...formData, internal_order: e.target.value })}
                    placeholder="Enter IO number"
                    maxLength="19"
                />

                <FormSelect
                    label="GL Code"
                    required
                    value={formData.general_ledger}
                    onChange={(e) =>
                        setFormData({ ...formData, general_ledger: e.target.value })
                    }
                    options={[
                        { value: '', label: 'Select GL Code' },
                        ...glCodes.map((m) => ({
                            value: m.id.toString(),
                            label: `${m.gl_code} - ${m.vertical_name}`,
                        })),
                    ]}
                />

                <FormInput
                    label="Sanction Number"
                    value={formData.sanction_number}
                    onChange={(e) => setFormData({ ...formData, sanction_number: e.target.value })}
                    placeholder="Enter Sanction number (if applicable)"
                />

                <FormInput
                    label="Advance Amount"
                    type="number"
                    value={formData.advance_amount}
                    onChange={(e) => {
                        const v = Number(e.target.value) || '';
                        setFormData({ ...formData, advance_amount: v });
                        setOtherExpenses(v);
                    }}
                    min='0'
                    placeholder="0.00"
                />

                <FormDatalist
                    label="Trip Origin City"
                    required
                    name="trip_from_location"
                    listId="fromList"
                    placeholder="Departure Location"
                    value={formData.trip_from_location_label}
                    options={cityOptions}
                    // onChange={(e) => setFormData({ ...formData, trip_from_location: e.target.value })}
                    onChange={(id, label) =>
                        setFormData((prev) => ({
                            ...prev,
                            trip_from_location: id,            // backend ID
                            trip_from_location_label: label,   // visible text
                        }))
                    }
                />

                <FormDatalist
                    label="Trip Destination City"
                    required
                    listId="toList"
                    placeholder="Arrival Location"
                    options={cityOptions}
                    value={formData.trip_to_location_label || ""}
                    onChange={(id, label) =>
                        setFormData((prev) => ({
                            ...prev,
                            trip_to_location: id,
                            trip_to_location_label: label,
                        }))
                    }
                />

                <FormInput label="Trip Start Date" required type="date" value={formData.departure_date} onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })} />
                <FormInput label="Trip Start Time" required type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                <FormInput label="Trip End Date" required type="date" value={formData.return_date} onChange={(e) => setFormData({ ...formData, return_date: e.target.value })} />
                <FormInput label="Trip End Time" required type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
            </div>
        </div>
    );
};

// Data Table Component
const DataTable = ({ columns, data, onEdit, onDelete, emptyMessage }) => (
    <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    {columns.map((col, idx) => (
                        <th key={idx} className={`px-4 py-3 text-sm font-semibold text-slate-700 ${col.align || 'text-left'}`}>
                            {col.label}
                        </th>
                    ))}
                    <th className="px-4 py-3 text-sm font-semibold text-slate-700 text-center w-24">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    data.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                            {columns.map((col, colIdx) => (
                                <td key={colIdx} className={`px-4 py-3 text-sm text-slate-700 ${col.align || ''}`}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-left gap-2">
                                    <button
                                        onClick={() => onEdit(idx)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(idx)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// Ticketing Section Component
const TicketingSection = ({ ticketing, setTicketing, showToast, cities, travelModes, subOptions, onModeChange, form, setForm, notRequired, setNotRequired }) => {
    // const [form, setForm] = useState(getEmptyTicketing());
    const [editIndex, setEditIndex] = useState(null);

    const [fieldErrors, setFieldErrors] = useState({});
    const [fieldWarnings, setFieldWarnings] = useState({});
    const [isCheckingEntitlement, setIsCheckingEntitlement] = useState(false);

    // Frontend validation - Advance booking
    const validateReturnDate = (departureDate, arrivalDate) => {
        if (!departureDate || !arrivalDate) return null;

        const depDate = new Date(departureDate);
        const arrDate = new Date(arrivalDate);

        if (arrDate < depDate) {
            return `Return date cannot be earlier than departure date`;
        }

        return null;
    };

    const validateDepartureDate = (departureDate, modeId) => {
        if (!departureDate || !modeId) return null;

        const depDate = new Date(departureDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysAhead = Math.floor((depDate - today) / (1000 * 60 * 60 * 24));

        const mode = availableModes.find(m => m.id === parseInt(modeId));
        if (!mode) return null;

        if (mode.name === 'Flight' && daysAhead < 7) {
            return `Flight requires 7 days advance booking (current: ${daysAhead} days)`;
        }

        if (mode.name === 'Train' && daysAhead < 3) {
            return `Train requires 3 days advance booking (current: ${daysAhead} days)`;
        }

        return null;
    };

    // Backend validation - Entitlement check
    const checkEntitlement = async (subOptionId, cityId) => {
        if (!subOptionId || !cityId) return;

        setIsCheckingEntitlement(true);
        try {
            // Get city category from cityId (you may need to fetch this)
            const city = cities.find(c => c.id === parseInt(cityId));
            if (!city?.category_id) {
                setIsCheckingEntitlement(false);
                return;
            }

            const response = await travelAPI.realTimeValidate('entitlement', {
                sub_option_id: subOptionId,
                city_category_id: city.category_id
            });

            if (response.data?.is_entitled === false) {
                setFieldErrors(prev => ({
                    ...prev,
                    sub_option: response.data.message
                }));
            } else {
                setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.sub_option;
                    return newErrors;
                });

                // Show max amount as info
                if (response.data?.max_amount) {
                    setFieldWarnings(prev => ({
                        ...prev,
                        estimated_cost: `Maximum allowed: ₹${response.data.max_amount.toLocaleString('en-IN')}`
                    }));
                }
            }
        } catch (error) {
            console.error('Entitlement check failed:', error);
        } finally {
            setIsCheckingEntitlement(false);
        }
    };

    // Backend validation - Cost check
    const checkCostLimit = async (cost, subOptionId) => {
        if (!cost || !subOptionId) return;

        try {
            const mode = availableModes.find(m =>
                currentSubOptions.find(s => s.id === parseInt(subOptionId))?.mode === m.id
            );

            if (mode?.name === 'Flight' && parseFloat(cost) > 10000) {
                setFieldWarnings(prev => ({
                    ...prev,
                    estimated_cost: `CEO approval required for flights above ₹10,000`
                }));
            } else {
                setFieldWarnings(prev => {
                    const newWarnings = { ...prev };
                    delete newWarnings.estimated_cost;
                    return newWarnings;
                });
            }
        } catch (error) {
            console.error('Cost check failed:', error);
        }
    };

    const cityOptions = cities.map(city => ({
        value: city.id,
        label: `${city.city_name} (${city.state_name}, ${city.country_name})`
    }));

    const handleSubmit = () => {
        if (!form.booking_type || !form.sub_option || !form.from_location || !form.to_location || !form.departure_date) {
            console.log(form);
            showToast('Please fill all required fields', 'error');
            return;
        }

        // Check for validation errors
        const dateError = validateDepartureDate(form.departure_date, form.booking_type);
        if (dateError) {
            setFieldErrors({ departure_date: dateError });
            showToast('Please fix validation errors before adding', 'error');
            return;
        }

        const returnError = validateReturnDate(form.departure_date, form.arrival_date);
        if (returnError) {
            setFieldErrors(prev => ({ ...prev, arrival_date: returnError }));
            showToast('Please fix validation errors before adding', 'error');
            return;
        }

        // Check if entitlement validation failed
        if (fieldErrors.sub_option) {
            showToast('Please fix entitlement errors before adding', 'error');
            return;
        }

        if (editIndex !== null) {
            const updated = [...ticketing];
            updated[editIndex] = { ...form, id: updated[editIndex].id };
            setTicketing(updated);
            showToast('Ticket updated successfully', 'success');
        } else {
            setTicketing([...ticketing, { ...form, id: Date.now() }]);
            showToast('Ticket added successfully', 'success');
        }

        setForm(getEmptyTicketing());
        setEditIndex(null);
        setFieldErrors({});
        setFieldWarnings({});
    };

    const handleEdit = (index) => {
        setEditIndex(index);
        setForm(ticketing[index]);
    };

    const handleDelete = (index) => {
        if (window.confirm('Delete this ticket?')) {
            setTicketing(ticketing.filter((_, i) => i !== index));

            // Reset form if currently editing deleted item or any item after it
            if (editIndex !== null && editIndex >= index) {
                setForm(getEmptyTicketing());
                setEditIndex(null);
                setFieldErrors({});
                setFieldWarnings({});
            }
            showToast('Ticket deleted', 'success');
        }
    };

    const handleModeChange = (modeId) => {
        setForm({ ...form, booking_type: modeId, sub_option: '' });

        // Re-validate departure date
        if (form.departure_date) {
            const error = validateDepartureDate(form.departure_date, modeId);
            setFieldErrors(prev => ({ ...prev, departure_date: error }));
        }

        // Clear sub-option errors
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.sub_option;
            return newErrors;
        });

        if (modeId) {
            onModeChange(parseInt(modeId));
        }
    };


    const columns = [
        {
            label: 'Travel Mode',
            render: (row) => {
                const mode = travelModes?.find(m => m.id === parseInt(row.booking_type));
                const subOption = subOptions[row.booking_type?.toString()]?.find(s => s.id === parseInt(row.sub_option));
                return `${mode?.name || row.booking_type} - ${subOption?.name || row.sub_option}`;
            }
        },
        {
            label: 'Route',
            render: (row) => {
                const fromCity = cities.find(c => c.id === parseInt(row.from_location));
                const toCity = cities.find(c => c.id === parseInt(row.to_location));
                const fromName = fromCity ? `${fromCity.city_name}` : row.from_location;
                const toName = toCity ? `${toCity.city_name}` : row.to_location;
                return `${fromName} → ${toName}`;
            }
        },
        { label: 'Departure', render: (row) => `${row.departure_date} ${row.departure_time || ''}` },
        { label: 'Arrival', render: (row) => row.arrival_date ? `${row.arrival_date} ${row.arrival_time || ''}` : '-' },
        { label: 'Cost (₹)', key: 'estimated_cost', align: 'text-right', render: (row) => `₹${Number(row.estimated_cost || 0).toLocaleString('en-IN')}` }
    ];

    // Get available travel modes (Flight and Train only)
    const availableModes = travelModes?.filter((m) => m.name === 'Flight' || m.name === 'Train') || [];

    // Get sub-options for selected mode
    // const currentSubOptions = form.booking_type ? (subOptions[form.booking_type] || []) : [];
    // Get sub-options for selected mode - ensure string key matching
    const currentSubOptions = form.booking_type ? (subOptions[form.booking_type.toString()] || []) : [];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Flight & Train Bookings</h2>
                    <p className="text-sm text-slate-500">Add your ticketing requirements</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notRequired}
                            onChange={(e) => {
                                setNotRequired(e.target.checked);
                                if (e.target.checked) {
                                    setForm(getEmptyTicketing());
                                    setEditIndex(null);
                                    setFieldErrors({});
                                    setFieldWarnings({});
                                }
                            }}
                            className="mt-1"
                        />
                        <span className="text-sm text-slate-700">
                            I hereby declare that I do not need ticket in any form - neither Company nor Self for this travel.
                        </span>
                    </label>
                </div>
                {!notRequired && (
                    <>
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">
                            {editIndex !== null ? 'Edit Ticket' : 'Add New Ticket'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormSelect
                                label="Travel Mode"
                                required
                                value={form.booking_type}
                                onChange={(e) => handleModeChange(e.target.value)}
                                options={[
                                    { value: '', label: 'Select travel mode' },
                                    ...availableModes.map(m => ({
                                        value: m.id.toString(),
                                        label: m.name
                                    }))
                                ]}
                            />
                            {/* <FormSelect
                            label="Travel Sub-Option"
                            required
                            value={form.sub_option}
                            onChange={(e) => setForm({ ...form, sub_option: e.target.value })}
                            options={[
                                { value: '', label: form.booking_type ? 'Select sub-option' : 'Select travel mode first' },
                                ...currentSubOptions.filter(s => s.mode === parseInt(form.booking_type)).map(s => ({
                                    value: s.id.toString(),
                                    label: s.name
                                }))
                            ]}
                            disabled={!form.booking_type}
                        /> */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Travel Sub-Option <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.sub_option}
                                    onChange={(e) => {
                                        const subOptionId = e.target.value;
                                        setForm({ ...form, sub_option: subOptionId });

                                        // Check entitlement when sub-option selected
                                        if (subOptionId && form.to_location) {
                                            checkEntitlement(subOptionId, form.to_location);
                                        }
                                    }}
                                    disabled={!form.booking_type}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${fieldErrors.sub_option
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-300 focus:ring-blue-500'
                                        }`}
                                >
                                    <option value="">
                                        {form.booking_type ? 'Select sub-option' : 'Select travel mode first'}
                                    </option>
                                    {currentSubOptions
                                        .filter(s => s.mode === parseInt(form.booking_type))
                                        .map(s => (
                                            <option key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </option>
                                        ))
                                    }
                                </select>
                                {isCheckingEntitlement && (
                                    <p className="text-blue-600 text-xs mt-1">Checking entitlement...</p>
                                )}
                                {fieldErrors.sub_option && (
                                    <p className="text-red-600 text-xs mt-1 font-medium">
                                        {fieldErrors.sub_option}
                                    </p>
                                )}
                            </div>
                            {/* <FormInput label="From" required value={form.from_location} onChange={(e) => setForm({ ...form, from_location: e.target.value })} placeholder="Origin" /> */}
                            {/* <FormSelect
                            label="From"
                            required
                            value={form.from_location}
                            onChange={(e) => setForm({ ...form, from_location: e.target.value })}
                            options={[
                                { value: '', label: 'Select From Location' },
                                ...cities.map((m) => ({
                                    value: m.id.toString(),
                                    label: m.city_name,
                                })),
                            ]}
                        /> */}

                            <FormDatalist
                                label="From"
                                required
                                name="from_location"
                                listId="fromList"
                                placeholder="Enter From Location"
                                options={cityOptions}
                                value={form.from_label || ""} // display name in input
                                onChange={(id, label) =>
                                    setForm(prev => ({
                                        ...prev,
                                        from_location: id,   // store ID for backend
                                        from_label: label,   // store label for UI
                                    }))
                                }
                            />


                            {/* <FormInput label="To" required value={form.to_location} onChange={(e) => setForm({ ...form, to_location: e.target.value })} placeholder="Destination" /> */}
                            {/* <FormDatalist
                            label="To"
                            required
                            name="to_location"
                            listId="toList"
                            placeholder="Enter To Location"
                            // value={form.to_location}
                            options={cityOptions}
                            // onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                            onChange={(id) => setForm(prev => ({ ...prev, to_location: id }))}
                        /> */}
                            <FormDatalist
                                label="To"
                                required
                                name="to_location"
                                listId="toList"
                                placeholder="Enter To Location"
                                options={cityOptions}
                                value={form.to_label || ""}
                                onChange={(id, label) => {
                                    setForm(prev => ({
                                        ...prev,
                                        to_location: id,
                                        to_label: label,
                                    }));
                                    if (form.sub_option && id) {
                                        checkEntitlement(form.sub_option, id);
                                    }
                                }}
                            />

                            {/* <FormSelect
                            label="To"
                            required
                            value={form.to_location}
                            onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                            options={[
                                { value: '', label: 'Select To Location' },
                                ...cities.map((m) => ({
                                    value: m.id.toString(),
                                    label: m.city_name,
                                })),
                            ]}
                        /> */}
                            {/* <FormInput label="Departure Date" required type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} /> */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Departure Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.departure_date}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        setForm({ ...form, departure_date: newDate });

                                        const error = validateDepartureDate(newDate, form.booking_type);
                                        setFieldErrors(prev => ({
                                            ...prev,
                                            departure_date: error
                                        }));

                                        // Also re-validate arrival date if exists
                                        if (form.arrival_date) {
                                            const returnError = validateReturnDate(newDate, form.arrival_date);
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                arrival_date: returnError
                                            }));
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${fieldErrors.departure_date
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-300 focus:ring-blue-500'
                                        }`}
                                />
                                {fieldErrors.departure_date && (
                                    <p className="text-red-600 text-xs mt-1 font-medium">
                                        {fieldErrors.departure_date}
                                    </p>
                                )}
                            </div>
                            <FormInput label="Departure Time" type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} />
                            {/* <FormInput label="Arrival Date" type="date" value={form.arrival_date || ''} onChange={(e) => setForm({ ...form, arrival_date: e.target.value })} /> */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Arrival Date
                                </label>
                                <input
                                    type="date"
                                    value={form.arrival_date || ''}
                                    onChange={(e) => {
                                        const newArrivalDate = e.target.value;
                                        setForm({ ...form, arrival_date: newArrivalDate });

                                        // Validate return date
                                        if (form.departure_date && newArrivalDate) {
                                            const error = validateReturnDate(form.departure_date, newArrivalDate);
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                arrival_date: error
                                            }));
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${fieldErrors.arrival_date
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-300 focus:ring-blue-500'
                                        }`}
                                />
                                {fieldErrors.arrival_date && (
                                    <p className="text-red-600 text-xs mt-1 font-medium">
                                        {fieldErrors.arrival_date}
                                    </p>
                                )}
                            </div>
                            <FormInput label="Arrival Time" type="time" value={form.arrival_time || ''} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} />

                            {/* <FormInput label="Estimated Cost (₹)" type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} placeholder="0.00" /> */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Estimated Cost (₹)
                                </label>
                                <input
                                    type="number"
                                    value={form.estimated_cost}
                                    onChange={(e) => {
                                        const cost = e.target.value;
                                        setForm({ ...form, estimated_cost: cost });

                                        // Check cost limits
                                        if (cost && form.sub_option) {
                                            checkCostLimit(cost, form.sub_option);
                                        }
                                    }}
                                    min='0'
                                    placeholder="₹8000"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all ${fieldErrors.estimated_cost
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-300 focus:ring-blue-500'
                                        }`}
                                />
                                {fieldWarnings.estimated_cost && (
                                    <p className="text-amber-600 text-xs mt-1 font-medium">
                                        {fieldWarnings.estimated_cost}
                                    </p>
                                )}
                                {fieldErrors.estimated_cost && (
                                    <p className="text-red-600 text-xs mt-1 font-medium">
                                        {fieldErrors.estimated_cost}
                                    </p>
                                )}
                            </div>
                            <div className="md:col-span-3">
                                <FormInput label="Special Instructions" value={form.special_instruction || ''} onChange={(e) => setForm({ ...form, special_instruction: e.target.value })} placeholder="e.g., Window seat preference, meal preference..." />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => { setForm(getEmptyTicketing()); setEditIndex(null); setFieldErrors({}); setFieldWarnings({}); }}>
                                Clear
                            </Button>
                            <Button icon={Plus} onClick={handleSubmit}>
                                {editIndex !== null ? 'Update' : 'Add'} Ticket
                            </Button>
                        </div>
                    </>)}
            </div>

            <DataTable
                columns={columns}
                data={ticketing}
                onEdit={handleEdit}
                onDelete={handleDelete}
                emptyMessage="No tickets added yet. Add your first ticket above."
            />
        </div>
    );
};

// Accommodation Section Component
const AccommodationSection = ({
    accommodation,
    setAccommodation,
    showToast,
    travelModes,
    subOptions,
    onModeChange,
    guestHouses,
    arcHotels,
    form,
    setForm,
    notRequired,
    setNotRequired
}) => {

    const [editIndex, setEditIndex] = useState(null);
    const [guestHousePreferences, setGuestHousePreferences] = useState([]);

    // ===== Find "Accommodation" mode =====
    const accommodationMode = travelModes?.find(m => m.name === "Accommodation");
    const accommodationModeId = accommodationMode?.id;
    form.accommodation_type_id = accommodationModeId;

    const hasLoadedAccommodation = useRef(false);

    // ===== Load sub-options first time =====
    useEffect(() => {
        if (
            accommodationModeId &&
            onModeChange &&
            !hasLoadedAccommodation.current &&
            !subOptions?.[accommodationModeId?.toString()]
        ) {
            hasLoadedAccommodation.current = true;
            onModeChange(accommodationModeId);
        }
    }, [accommodationModeId, subOptions, onModeChange]);

    // ===== Extract only accommodation-related sub-options =====
    const currentAccommodationSubOptions =
        subOptions?.[accommodationModeId?.toString()]
            ?.filter((s) => s.mode === accommodationModeId) || [];

    // ===== Auto-select Guest House when Company is chosen =====
    useEffect(() => {
        if (form.accommodation_type === "company" && !form.accommodation_sub_option) {
            const gh = currentAccommodationSubOptions.find(s =>
                s.name?.toLowerCase().includes("guest house")
            );

            if (gh) {
                setForm(prev => ({
                    ...prev,
                    accommodation_sub_option: gh.id.toString()
                }));
            }
        }
    }, [form.accommodation_type, currentAccommodationSubOptions]);


    // ===========================
    //        SUBMIT HANDLER
    // ===========================
    const handleSubmit = () => {
        if (!form.place || !form.check_in_date || !form.check_out_date) {
            showToast("Please fill Place, Check-in date, and Check-out date", "error");
            return;
        }

        // Guest House preferences required only when guest house selected
        if (form.accommodation_type === "company") {
            const sub = currentAccommodationSubOptions.find(
                s => s.id === parseInt(form.accommodation_sub_option)
            );

            if (sub?.name?.toLowerCase().includes("guest house") &&
                guestHousePreferences.length === 0
            ) {
                showToast("Please select at least one guest house preference", "error");
                return;
            }
        }

        const bookingData = {
            ...form,
            guest_house_preferences: guestHousePreferences,
            id: editIndex !== null ? accommodation[editIndex].id : Date.now()
        };

        if (editIndex !== null) {
            const updated = [...accommodation];
            updated[editIndex] = bookingData;
            setAccommodation(updated);
            showToast("Accommodation updated successfully", "success");
        } else {
            setAccommodation([...accommodation, bookingData]);
            showToast("Accommodation added successfully", "success");
        }

        setForm(getEmptyAccommodation());
        setGuestHousePreferences([]);
        setEditIndex(null);
    };


    // ===========================
    //         EDIT HANDLER
    // ===========================
    const handleEdit = (index) => {
        setEditIndex(index);
        const booking = accommodation[index];
        setForm(booking);
        setGuestHousePreferences(booking.guest_house_preferences || []);
    };


    // ===========================
    //         DELETE HANDLER
    // ===========================
    const handleDelete = (index) => {
        if (window.confirm("Delete this accommodation?")) {
            setAccommodation(accommodation.filter((_, i) => i !== index));

            // Reset form if deleted row was being edited
            if (editIndex !== null && editIndex >= index) {
                setForm(getEmptyAccommodation());
                setGuestHousePreferences([]);
                setEditIndex(null);
            }

            showToast("Accommodation deleted", "success");
        }
    };


    // ===========================
    //       TABLE COLUMNS
    // ===========================
    const columns = [
        {
            label: "Type",
            render: (row) => (
                <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                    {row.accommodation_type}
                </span>
            )
        },
        { label: "Place", key: "place" },
        { label: "Check-in", render: (row) => `${row.check_in_date} ${row.check_in_time || ""}` },
        { label: "Check-out", render: (row) => `${row.check_out_date} ${row.check_out_time || ""}` },
        {
            label: "Cost (₹)",
            align: "text-right",
            render: (row) => `₹${Number(row.estimated_cost || 0).toLocaleString("en-IN")}`
        }
    ];


    // ===========================
    //           RETURN JSX
    // ===========================
    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Home className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Accommodation</h2>
                    <p className="text-sm text-slate-500">Add your hotel and lodging requirements</p>
                </div>
            </div>


            {/* MAIN CARD */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">

                {/* Not Required Checkbox */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notRequired}
                            onChange={(e) => {
                                setNotRequired(e.target.checked);
                                if (e.target.checked) {
                                    setForm(getEmptyAccommodation());
                                    setEditIndex(null);
                                }
                            }}
                            className="mt-1"
                        />
                        <span className="text-sm text-slate-700">
                            I hereby declare that I do not need accommodation in any form - neither
                            Company nor Self for this travel.
                        </span>
                    </label>
                </div>

                {/* ======================== FORM ======================== */}
                {!notRequired && (
                    <>
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">
                            {editIndex !== null ? "Edit Accommodation" : "Add New Accommodation"}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* Accommodation Type */}
                            <FormSelect
                                label="Accommodation Type"
                                required
                                value={form.accommodation_type}
                                onChange={(e) => {
                                    setForm({
                                        ...form,
                                        accommodation_type: e.target.value,
                                        accommodation_sub_option: ""
                                    });
                                    setGuestHousePreferences([]);
                                }}
                                options={[
                                    { value: "", label: "Select accommodation type" },
                                    { value: "company", label: "Company Arranged" },
                                    { value: "self", label: "Self Arranged" }
                                ]}
                            />

                            {/* Auto-selected Guest House Sub-option */}
                            {form.accommodation_type === "company" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Accommodation Sub-Option <span className="text-red-500">*</span>
                                    </label>
                                    <div className="px-3 py-2 border border-slate-300 bg-slate-50 rounded-lg text-sm text-slate-600">
                                        Guest House (Auto-selected)
                                    </div>
                                </div>
                            )}

                            {/* Guest House Preferences */}
                            {form.accommodation_type === "company" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Select Guest House Preferences <span className="text-red-500">*</span>
                                    </label>
                                    <GuestHouseSelector
                                        guestHouses={guestHouses?.data?.results || []}
                                        selectedPreferences={guestHousePreferences}
                                        setSelectedPreferences={setGuestHousePreferences}
                                    />
                                </div>
                            )}

                            <FormInput
                                label="Place/Location"
                                required
                                value={form.place}
                                onChange={(e) => setForm({ ...form, place: e.target.value })}
                                placeholder="City or area"
                            />

                            <FormInput
                                label="Check-in Date"
                                required
                                type="date"
                                value={form.check_in_date}
                                onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                            />

                            <FormInput
                                label="Check-in Time"
                                type="time"
                                value={form.check_in_time}
                                onChange={(e) => setForm({ ...form, check_in_time: e.target.value })}
                            />

                            <FormInput
                                label="Check-out Date"
                                required
                                type="date"
                                value={form.check_out_date}
                                onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                            />

                            <FormInput
                                label="Check-out Time"
                                type="time"
                                value={form.check_out_time}
                                onChange={(e) => setForm({ ...form, check_out_time: e.target.value })}
                            />

                            <FormInput
                                label="Estimated Cost (₹)"
                                type="number"
                                value={form.estimated_cost}
                                onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                                min="0"
                                placeholder="₹12000"
                            />

                            <div className="md:col-span-2">
                                <FormInput
                                    label="Special Instructions"
                                    value={form.special_instruction}
                                    onChange={(e) => setForm({ ...form, special_instruction: e.target.value })}
                                    placeholder="e.g., Veg meal preference, room preference..."
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setForm(getEmptyAccommodation());
                                    setGuestHousePreferences([]);
                                    setEditIndex(null);
                                }}
                            >
                                Clear
                            </Button>

                            <Button icon={Plus} onClick={handleSubmit}>
                                {editIndex !== null ? "Update" : "Add"} Accommodation
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={accommodation}
                onEdit={handleEdit}
                onDelete={handleDelete}
                emptyMessage="No accommodation added yet. Add your first accommodation above."
            />
        </div>
    );
};


// Conveyance Section Component
const ConveyanceSection = ({
    conveyance,
    setConveyance,
    travelModes,
    subOptions,
    onModeChange,
    showToast,
    form,
    setForm,
    notRequired,
    setNotRequired
}) => {
    const [editIndex, setEditIndex] = useState(null);
    const [localGuests, setLocalGuests] = useState([]);

    const handleModeChange = (modeId) => {
        setForm({ ...form, vehicle_type: modeId, vehicle_sub_option: '' });
        if (modeId) {
            onModeChange(parseInt(modeId));
        }
    };

    const availableModes = travelModes?.filter((m) => m.name === 'Car') || [];
    const currentSubOptions = form.vehicle_type ? (subOptions[form.vehicle_type.toString()] || []) : [];

    const handleSubmit = () => {
        // Validation
        if (!form.vehicle_type || !form.vehicle_sub_option) {
            showToast('Please select Vehicle Type and Mode Class', 'error');
            return;
        }

        if (!form.from_location || !form.to_location || !form.start_date) {
            showToast('Please fill From, To, and Start date', 'error');
            return;
        }

        if (!form.report_at || !form.drop_location) {
            showToast('Please fill Report At and Drop At locations', 'error');
            return;
        }

        if (!form.club_booking && !form.club_reason?.trim()) {
            showToast('Reason is required when NOT clubbing car booking', 'error');
            return;
        }

        const bookingData = {
            ...form,
            guests: localGuests,
            id: editIndex !== null ? conveyance[editIndex].id : Date.now()
        };

        if (editIndex !== null) {
            const updated = [...conveyance];
            updated[editIndex] = bookingData;
            setConveyance(updated);
            showToast('Conveyance updated successfully', 'success');
        } else {
            setConveyance([...conveyance, bookingData]);
            showToast('Conveyance added successfully', 'success');
        }

        setForm(getEmptyConveyance());
        setLocalGuests([]);
        setEditIndex(null);
    };

    const handleEdit = (index) => {
        const booking = conveyance[index];
        setEditIndex(index);
        setForm(booking);
        setLocalGuests(booking.guests || []);
    };

    const handleDelete = (index) => {
        if (window.confirm('Delete this conveyance?')) {
            setConveyance(conveyance.filter((_, i) => i !== index));

            // Reset if editing deleted item
            if (editIndex !== null && editIndex >= index) {
                setForm(getEmptyConveyance());
                setLocalGuests([]);
                setEditIndex(null);
            }
            showToast('Conveyance deleted', 'success');
        }
    };

    const columns = [
        {
            label: 'Vehicle',
            render: (row) => {
                const mode = travelModes?.find(m => m.id === parseInt(row.vehicle_type));
                const subOption = subOptions[row.vehicle_type?.toString()]?.find(s => s.id === parseInt(row.vehicle_sub_option));
                return `${mode?.name || '-'} - ${subOption?.name || '-'}`;
            },
        },
        {
            label: 'Route',
            render: (row) => `${row.from_location} → ${row.to_location}`,
        },
        {
            label: 'Start',
            render: (row) => `${row.start_date || '-'} ${row.start_time || ''}`,
        },
        {
            label: 'Guests',
            render: (row) => row.guests?.length > 0 ? (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {row.guests.length} guest{row.guests.length > 1 ? 's' : ''}
                </span>
            ) : '-'
        },
        {
            label: 'Cost (₹)',
            align: 'text-right',
            render: (row) => `₹${Number(row.estimated_cost || 0).toLocaleString('en-IN')}`,
        },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Local Conveyance</h2>
                    <p className="text-sm text-slate-500">Add your local transportation requirements</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notRequired}
                            onChange={(e) => {
                                setNotRequired(e.target.checked);
                                if (e.target.checked) {
                                    setForm(getEmptyConveyance());
                                    setLocalGuests([]);
                                    setEditIndex(null);
                                }
                            }}
                            className="mt-1"
                        />
                        <span className="text-sm text-slate-700">
                            I hereby declare that I do not need car in any form - neither Company nor Self for this travel.
                        </span>
                    </label>
                </div>

                {!notRequired && (
                    <>
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">
                            {editIndex !== null ? 'Edit Conveyance' : 'Add New Conveyance'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormSelect
                                label="Vehicle Type"
                                required
                                value={form.vehicle_type}
                                onChange={(e) => handleModeChange(e.target.value)}
                                options={[
                                    { value: '', label: 'Select vehicle type' },
                                    ...availableModes.map(m => ({
                                        value: m.id.toString(),
                                        label: m.name
                                    }))
                                ]}
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Vehicle Mode Class <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.vehicle_sub_option}
                                    onChange={(e) => setForm({ ...form, vehicle_sub_option: e.target.value })}
                                    disabled={!form.vehicle_type}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all border-slate-300 focus:ring-blue-500"
                                >
                                    <option value="">
                                        {form.vehicle_type ? 'Select sub-option' : 'Select vehicle type first'}
                                    </option>
                                    {currentSubOptions
                                        .filter(s => s.mode === parseInt(form.vehicle_type))
                                        .map(s => (
                                            <option key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Car Disposal Warning */}
                            {(() => {
                                const selectedSubOption = currentSubOptions.find(
                                    s => s.id === parseInt(form.vehicle_sub_option)
                                );
                                if (selectedSubOption?.name?.toLowerCase().includes('disposal')) {
                                    return (
                                        <div className="col-span-full bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-lg p-3">
                                            ⚠️ You are opting for <strong>Car at Disposal</strong> from the start time to end time mentioned.
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <FormInput
                                label="From"
                                required
                                value={form.from_location}
                                onChange={(e) => setForm({ ...form, from_location: e.target.value })}
                                placeholder="Starting Point (e.g., Mumbai Airport)"
                            />

                            <FormInput
                                label="To"
                                required
                                value={form.to_location}
                                onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                                placeholder="Destination (e.g., Guest House)"
                            />

                            <FormInput
                                label="Report At"
                                required
                                value={form.report_at}
                                onChange={(e) => setForm({ ...form, report_at: e.target.value })}
                                placeholder="Report location (e.g., Office Gate)"
                            />

                            <FormInput
                                label="Drop At"
                                required
                                value={form.drop_location}
                                onChange={(e) => setForm({ ...form, drop_location: e.target.value })}
                                placeholder="Drop location (e.g., Railway Station)"
                            />

                            <FormInput
                                label="Start Date"
                                required
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                            />

                            <FormInput
                                label="Start Time"
                                type="time"
                                value={form.start_time}
                                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                            />

                            <FormInput
                                label="Estimated Cost (₹)"
                                type="number"
                                value={form.estimated_cost}
                                onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                                min="0"
                                placeholder="₹500"
                            />

                            <div className="md:col-span-3">
                                <FormInput
                                    label="Special Instructions"
                                    value={form.special_instruction}
                                    onChange={(e) => setForm({ ...form, special_instruction: e.target.value })}
                                    placeholder="Any special requirements"
                                />
                            </div>
                        </div>

                        {/* Club Booking & Guests */}
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Club Booking */}
                                <div>
                                    <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.club_booking || false}
                                            onChange={(e) => setForm({
                                                ...form,
                                                club_booking: e.target.checked,
                                                club_reason: e.target.checked ? '' : form.club_reason // Clear reason if checked
                                            })}
                                            className="mt-0.5"
                                        />
                                        <span>
                                            I am open to club my car booking with any other officer traveling on the same route.
                                        </span>
                                    </label>

                                    {/* ✅ FIX: Show reason field when NOT clubbing */}
                                    {!form.club_booking && (
                                        <div className="mt-3">
                                            <FormInput
                                                label="Reason for NOT clubbing"
                                                required
                                                value={form.club_reason || ''}
                                                onChange={(e) => setForm({ ...form, club_reason: e.target.value })}
                                                placeholder="Why do you need exclusive car?"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Right: Guest Selector */}
                                <div>
                                    <GuestSelector
                                        selectedGuests={localGuests}
                                        setSelectedGuests={setLocalGuests}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Table */}
                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full text-sm border border-slate-300 rounded-lg">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-3 py-2 text-center border">Conveyance</th>
                                        <th className="px-3 py-2 text-center border">Details</th>
                                        <th className="px-3 py-2 text-center border">Senior Approval Required</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-3 py-2 border">Radio Cab</td>
                                        <td className="px-3 py-2 border">Company provided OLA/UBER services</td>
                                        <td className="px-3 py-2 border">No</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2 border">Pick up & Drop</td>
                                        <td className="px-3 py-2 border">Accommodation to Station/Airport only</td>
                                        <td className="px-3 py-2 border">No</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2 border">Car at Disposal</td>
                                        <td className="px-3 py-2 border">Company Arranged Car</td>
                                        <td className="px-3 py-2 border">Yes (if Radio Cab available)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2 border">Car At All Points</td>
                                        <td className="px-3 py-2 border">As per ticketing details</td>
                                        <td className="px-3 py-2 border font-semibold">Yes</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setForm(getEmptyConveyance());
                                    setLocalGuests([]);
                                    setEditIndex(null);
                                }}
                            >
                                Clear
                            </Button>
                            <Button icon={Plus} onClick={handleSubmit}>
                                {editIndex !== null ? 'Update' : 'Add'} Conveyance
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <DataTable
                columns={columns}
                data={conveyance}
                onEdit={handleEdit}
                onDelete={handleDelete}
                emptyMessage="No conveyance added yet. Add your first conveyance above."
            />
        </div>
    );
};

// Travel Advance Section Component
const TravelAdvanceSection = ({ sums, otherExpenses, setOtherExpenses, totalAdvance }) => (
    <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-slate-800">Travel Advance Summary</h2>
                <p className="text-sm text-slate-500">Review and finalize your travel advance request</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense Breakdown</h3>

                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-slate-700">Flight & Train Tickets</span>
                        <span className="font-semibold text-slate-900">₹{sums.ticketSum.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-slate-700">Accommodation</span>
                        <span className="font-semibold text-slate-900">₹{sums.accSum.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-slate-700">Local Conveyance</span>
                        <span className="font-semibold text-slate-900">₹{sums.convSum.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-slate-700">Other Expenses</span>
                        <input
                            type="number"
                            className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-right font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={otherExpenses}
                            min="0"
                            placeholder="₹0"
                            onChange={(e) => setOtherExpenses(Number(e.target.value) || '')}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-2">
                        <span className="text-lg font-bold text-slate-900">Total Advance Request</span>
                        <span className="text-2xl font-bold text-blue-600">₹{totalAdvance.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Important Notes</h3>

                <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>This advance will be adjusted against actual expenses after trip completion</p>
                    </div>

                    <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>Submit all original bills and receipts within 30 days of return</p>
                    </div>

                    <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>Excess advance must be refunded within 10 days</p>
                    </div>

                    <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>Additional approvals may be required based on amount and travel policy</p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">
                        <strong>Note:</strong> Ensure all bookings comply with company travel policy before submission.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

// Helper to extract readable error message
// Helper function to parse backend errors recursively
const parseBackendError = (error) => {
    const backendError = error.response?.data;

    if (!backendError) {
        return error.message || 'An unexpected error occurred';
    }

    const errorMessages = [];

    // Recursive function to extract all error messages
    const extractMessages = (obj, prefix = '') => {
        if (!obj || typeof obj !== 'object') {
            return;
        }

        Object.entries(obj).forEach(([key, value]) => {
            // Skip metadata fields
            if (['success', 'data'].includes(key)) {
                return;
            }

            // Handle arrays of messages
            if (Array.isArray(value)) {
                value.forEach(item => {
                    if (typeof item === 'string') {
                        errorMessages.push(prefix ? `${prefix} ${key}: ${item}` : `${key}: ${item}`);
                    } else if (typeof item === 'object') {
                        extractMessages(item, prefix ? `${prefix} ${key}` : key);
                    }
                });
            }
            // Handle nested objects
            else if (typeof value === 'object' && value !== null) {
                extractMessages(value, prefix ? `${prefix} ${key}` : key);
            }
            // Handle string/primitive values
            else {
                errorMessages.push(prefix ? `${prefix} ${key}: ${value}` : `${key}: ${value}`);
            }
        });
    };

    extractMessages(backendError);

    // Return parsed messages or fallback to message field
    if (errorMessages.length > 0) {
        return errorMessages.join('\n');
    }

    return backendError.message || 'Validation failed. Please check your input.';
};

// =============================================
// MAIN COMPONENT
// =============================================

export default function CreateTravelApplication() {
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState('purpose');
    const [toast, setToast] = useState(null);

    const [travelModes, setTravelModes] = useState(null);
    const [cities, setCities] = useState([]);
    const [glCodes, setGLCodes] = useState([]);
    const [subOptions, setSubOptions] = useState({});
    const [guestHouses, setGuestHouses] = useState(null);
    const [arcHotels, setARCHotels] = useState(null);

    const [ticketingNotRequired, setTicketingNotRequired] = useState(false);
    const [accommodationNotRequired, setAccommodationNotRequired] = useState(false);
    const [conveyanceNotRequired, setConveyanceNotRequired] = useState(false);

    const [selectedGuests, setSelectedGuests] = useState<Array<{
        id?: number;
        employee_id?: string;
        full_name: string;
        department?: string;
        is_colleague: boolean;
    }>>([]);

    const [draftApplicationId, setDraftApplicationId] = useState(null);

    useEffect(() => {
        const loadMasterData = async () => {
            try {
                const glCodes = await travelAPI.getGLCodes();
                setGLCodes(glCodes.results);

                const cities = await locationAPI.getAllCities();
                setCities(cities.data);

                const modes = await travelAPI.getTravelModes();
                setTravelModes(modes);

                const houses = await travelAPI.getGuestHouses();
                setGuestHouses(houses);

                const hotels = await travelAPI.getARCHotels();
                setARCHotels(hotels);

            } catch (error) {
                console.log(error);
                showToast('Failed to load master data', 'error');
            }
        };
        loadMasterData();
    }, []);

    const loadSubOptions = async (modeId) => {
        const key = modeId.toString();
        if (!subOptions[key]) {
            try {
                const options = await travelAPI.getTravelSubOptions(modeId);
                setSubOptions(prev => ({ ...prev, [key]: options?.results || options }));
            } catch (error) {
                showToast('Failed to load sub-options', 'error');
            }
        }
    };

    const tabs = [
        { id: 'purpose', label: 'Purpose', icon: Calendar },
        { id: 'ticketing', label: 'Ticketing', icon: Plane },
        { id: 'accommodation', label: 'Accommodation', icon: Home },
        { id: 'conveyance', label: 'Conveyance', icon: Car },
        { id: 'advance', label: 'Advance', icon: Wallet },
    ];

    // Master form data
    const [formData, setFormData] = useState({
        purpose: '',
        internal_order: '',
        general_ledger: '',
        sanction_number: '',
        advance_amount: '',
        trip_from_location: '',
        trip_to_location: '',
        departure_date: '',
        start_time: '',
        return_date: '',
        end_time: '',
    });

    // Category lists
    const [ticketing, setTicketing] = useState([]);
    const [accommodation, setAccommodation] = useState([]);
    const [conveyance, setConveyance] = useState([]);

    const [ticketingForm, setTicketingForm] = useState(getEmptyTicketing());
    const [accommodationForm, setAccommodationForm] = useState(getEmptyAccommodation());
    const [conveyanceForm, setConveyanceForm] = useState(getEmptyConveyance());

    const [otherExpenses, setOtherExpenses] = useState();

    // Calculate sums
    const sums = useMemo(() => {
        const ticketSum = ticketing.reduce((s, t) => s + Number(t.estimated_cost || 0), 0);
        const accSum = accommodation.reduce((s, a) => s + Number(a.estimated_cost || 0), 0);
        const convSum = conveyance.reduce((s, c) => s + Number(c.estimated_cost || 0), 0);
        return { ticketSum, accSum, convSum };
    }, [ticketing, accommodation, conveyance]);

    const totalAdvance = useMemo(() => {
        return sums.ticketSum + sums.accSum + sums.convSum + Number(otherExpenses || 0);
    }, [sums, otherExpenses]);

    useEffect(() => {
        setOtherExpenses(Number(formData.advance_amount || 0));
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // Navigation
    const currentIndex = tabs.findIndex(t => t.id === activeTab);

    const goNext = () => {
        if (activeTab === 'purpose') {
            if (!formData.purpose || !formData.internal_order) {
                showToast('Please fill Purpose and Internal Order before proceeding', 'error');
                return;
            }
        }
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1].id);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1].id);
        }
    };

    // Add to main component
    const [isValidating, setIsValidating] = useState(false);
    const [validationErrors, setValidationErrors] = useState(null);

    // Validation function
    const validateApplication = async () => {
        const errors = [];

        // Basic validations
        if (!formData.purpose || !formData.internal_order || !formData.general_ledger) {
            errors.push({
                field: 'purpose',
                message: 'Purpose, Internal Order and GL Code are required'
            });
        }

        // User either adds bookings OR checks "not required" OR leaves section empty
        const hasTicketing = ticketingNotRequired || ticketing.length > 0;
        const hasAccommodation = accommodationNotRequired || accommodation.length > 0;
        const hasConveyance = conveyanceNotRequired || conveyance.length > 0;

        if (!hasTicketing && !hasAccommodation && !hasConveyance) {
            errors.push({
                field: 'bookings',
                message: 'Please add at least one booking (Ticketing, Accommodation, or Conveyance)'
            });
        }

        // Date validations for ticketing (only if tickets exist)
        if (ticketing.length > 0) {
            ticketing.forEach((t, i) => {
                const depDate = new Date(t.departure_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (depDate < today) {
                    errors.push({
                        field: `ticketing_${i}`,
                        message: `Ticket ${i + 1}: Departure date cannot be in past`
                    });
                }

                if (t.arrival_date) {
                    const arrDate = new Date(t.arrival_date);
                    if (arrDate < depDate) {
                        errors.push({
                            field: `ticketing_${i}`,
                            message: `Ticket ${i + 1}: Return date cannot be earlier than departure date`
                        });
                    }
                }

                // Advance booking check
                const daysAhead = Math.floor((depDate - today) / (1000 * 60 * 60 * 24));
                const mode = travelModes?.find(m => m.id === parseInt(t.booking_type));

                if (mode?.name === 'Flight' && daysAhead < 7) {
                    errors.push({
                        field: `ticketing_${i}`,
                        message: `Ticket ${i + 1}: Flight requires 7 days advance booking (current: ${daysAhead} days)`
                    });
                }
                if (mode?.name === 'Train' && daysAhead < 3) {
                    errors.push({
                        field: `ticketing_${i}`,
                        message: `Ticket ${i + 1}: Train requires 3 days advance booking (current: ${daysAhead} days)`
                    });
                }
            });
        }

        return errors;
    };

    const handleSaveDraft = async () => {
        try {
            const payload = prepareSubmissionPayload();

            let response;
            if (draftApplicationId) {
                // Update existing draft
                response = await travelAPI.updateApplication(draftApplicationId, payload);
            } else {
                // Create new draft
                response = await travelAPI.createApplication(payload);
                setDraftApplicationId(response.data?.id);
            }

            showToast('Draft saved successfully', 'success');
            navigate("/travel/travel-application-list");
        } catch (error) {
            console.error('Save draft error:', error);
            showToast(parseBackendError(error), 'error');
        }
    };

    // const handleSubmit = async () => {
    //     setIsValidating(true);

    //     try {
    //         // Step 1: Frontend validation
    //         const frontendErrors = await validateApplication();
    //         if (frontendErrors.length > 0) {
    //             console.log(frontendErrors);
    //             setValidationErrors(frontendErrors);
    //             showToast('Please fix validation errors before submitting', 'error');
    //             return;
    //         }

    //         // Step 2: Ensure draft is saved (create/update)
    //         const payload = prepareSubmissionPayload();
    //         console.log('Payload: <br/>\n', payload);

    //         let appId = draftApplicationId;

    //         if (!appId) {
    //             // No draft exists, create new
    //             const appResponse = await travelAPI.createApplication(payload);
    //             appId = appResponse.data?.id;
    //             setDraftApplicationId(appId);
    //         } else {
    //             // Update existing draft
    //             await travelAPI.updateApplication(appId, payload);
    //         }

    //         if (!appId) throw new Error('Application ID not available');

    //         // Step 3: Backend validation
    //         const validation = await travelAPI.validateApplication(appId);

    //         if (!validation.data?.can_submit) {
    //             const validationResults = validation.data?.validation_results || [];
    //             setValidationErrors(validationResults);

    //             const errorMessages = [];
    //             validationResults.forEach(trip => {
    //                 const tripLabel = `Trip #${trip.trip_id}`;
    //                 trip.bookings?.forEach(booking => {
    //                     booking.issues?.forEach(issue => {
    //                         if (issue.severity === 'error') {
    //                             errorMessages.push(`${tripLabel} → ${booking.booking_type}: ${issue.message.replace(/[\[\]']/g, '')}`);
    //                         }
    //                     });
    //                 });
    //             });

    //             if (errorMessages.length > 0) {
    //                 showToast(`Validation Failed:\n${errorMessages.join('\n')}`, 'error');
    //             } else {
    //                 showToast('Application has validation errors. Please review.', 'error');
    //             }
    //             return; // DON'T proceed to submit
    //         }

    //         // Step 4: Submit only if validation passed
    //         await travelAPI.submitApplication(appId);

    //         showToast('Application submitted successfully!', 'success');

    //         // Clear draft ID and redirect
    //         setDraftApplicationId(null);

    //         navigate("/travel/travel-application-list");

    //     } catch (error) {
    //         console.error('Submission error:', error);
    //         showToast(parseBackendError(error), 'error');
    //     } finally {
    //         setIsValidating(false);
    //     }

    // };

    const handleSubmit = async () => {
        setIsValidating(true);

        try {
            // -------------------------------------
            // 1. Basic frontend validation only
            // -------------------------------------
            const frontendErrors = await validateApplication();

            if (frontendErrors.length > 0) {
                setValidationErrors(frontendErrors);
                showToast('Please fix validation errors before submitting', 'error');
                return;
            }

            // -------------------------------------
            // 2. Prepare payload (draft data)
            // -------------------------------------
            const payload = prepareSubmissionPayload();
            console.log("Submitting payload:", payload);

            let appId = draftApplicationId;

            // -------------------------------------
            // 3. Create or Update Draft (backend)
            // -------------------------------------
            if (!appId) {
                const res = await travelAPI.createApplication(payload);
                appId = res.data?.id;
                setDraftApplicationId(appId);
            } else {
                await travelAPI.updateApplication(appId, payload);
            }

            if (!appId) {
                throw new Error("Application ID not available");
            }

            // -------------------------------------
            // 4. SUBMIT (full backend validation + approval engine)
            // -------------------------------------
            const submitRes = await travelAPI.submitApplication(appId);

            showToast('Application submitted successfully!', 'success');

            // -------------------------------------
            // 5. Clear draft + redirect
            // -------------------------------------
            setDraftApplicationId(null);
            navigate("/travel/travel-application-list");

        } catch (err: any) {
            console.error("Submit Error:", err);
            showToast(parseBackendError(err), 'error');
        } finally {
            setIsValidating(false);
        }
    };


    const prepareSubmissionPayload = () => {
        return {
            purpose: formData.purpose,
            internal_order: formData.internal_order,
            general_ledger: formData.general_ledger,
            sanction_number: formData.sanction_number,
            advance_amount: formData.advance_amount,
            trip_details: [{
                from_location: formData?.trip_from_location,
                to_location: formData?.trip_to_location,
                departure_date: formData?.departure_date,
                start_time: formData?.start_time,
                return_date: formData?.return_date,
                end_time: formData?.end_time,
                bookings: [
                    ...ticketing.map(t => ({
                        booking_type: parseInt(t.booking_type), // // Ticketing mode ID
                        sub_option: parseInt(t.sub_option),
                        estimated_cost: parseFloat(t.estimated_cost),
                        booking_details: {
                            from_location: t.from_location,
                            from_location_name: t.from_label,
                            to_location: t.to_location,
                            to_location_name: t.to_label,
                            departure_date: t.departure_date,
                            departure_time: t.departure_time,
                            arrival_date: t.arrival_date,
                            arrival_time: t.arrival_time
                        },
                        special_instruction: t.special_instruction
                    })),
                    ...accommodation.map(a => ({
                        booking_type: a.accommodation_type_id, // Accommodation mode ID
                        sub_option: parseInt(a.accommodation_sub_option),
                        estimated_cost: parseFloat(a.estimated_cost),
                        booking_details: {
                            // guest_house_id: parseInt(a.guest_house) || '',
                            // guest_house: a.guest_house || '',
                            guest_house_preferences: a.guest_house_preferences || [],
                            place: a.place,
                            check_in_date: a.check_in_date,
                            check_out_date: a.check_out_date,
                            check_in_time: a.check_in_time,
                            check_out_time: a.check_out_time,
                        },
                        special_instruction: a.special_instruction || '',
                    })),
                    ...conveyance.map(c => ({
                        booking_type: parseInt(c.vehicle_type), // Conveyance mode ID
                        sub_option: parseInt(c.vehicle_sub_option),
                        estimated_cost: parseFloat(c.estimated_cost),
                        booking_details: {
                            from_location: c.from_location,
                            to_location: c.to_location,
                            report_at: c.report_at,
                            drop_location: c.drop_location,
                            start_date: c.start_date,
                            start_time: c.start_time || '',
                            special_instruction: c.special_instruction || '',
                            club_booking: !!c.club_booking,
                            club_reason: c.club_reason?.trim() || '',
                            not_required: !!c.not_required,
                            guests: (c.guests || []).map(g => ({
                                id: g.id || null,
                                name: g.full_name,
                                employee_id: g.employee_id || null,
                                is_internal: !!g.employee_id,   // employee = internal guest
                                is_external: !g.employee_id,   // non-employee = external
                            })),
                        },
                    }))
                ]
            }]
        };
    };

    return (
        // <Layout>
        <div>
            <div className="min-h-screen">
                {/* Toast Notification */}
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                <div className="max-w-7xl mx-auto">
                    {/* Main Card */}
                    <div className="bg-white overflow-hidden">
                        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

                        <div className="p-8">
                            {/* Content Sections */}
                            {activeTab === 'purpose' && (
                                <PurposeSection
                                    formData={formData}
                                    setFormData={setFormData}
                                    setOtherExpenses={setOtherExpenses}
                                    cities={cities}
                                    glCodes={glCodes}
                                />
                            )}

                            {activeTab === 'ticketing' && (
                                <TicketingSection
                                    ticketing={ticketing}
                                    setTicketing={setTicketing}
                                    showToast={showToast}
                                    travelModes={travelModes}
                                    subOptions={subOptions}
                                    onModeChange={loadSubOptions}
                                    cities={cities}
                                    form={ticketingForm}
                                    setForm={setTicketingForm}
                                    notRequired={ticketingNotRequired}
                                    setNotRequired={setTicketingNotRequired}
                                />
                            )}

                            {activeTab === 'accommodation' && (
                                <AccommodationSection
                                    accommodation={accommodation}
                                    setAccommodation={setAccommodation}
                                    travelModes={travelModes}
                                    subOptions={subOptions}
                                    onModeChange={loadSubOptions}
                                    showToast={showToast}
                                    guestHouses={guestHouses}
                                    arcHotels={arcHotels}
                                    form={accommodationForm}
                                    setForm={setAccommodationForm}
                                    notRequired={accommodationNotRequired}
                                    setNotRequired={setAccommodationNotRequired}
                                />
                            )}

                            {activeTab === 'conveyance' && (
                                <ConveyanceSection
                                    conveyance={conveyance}
                                    setConveyance={setConveyance}
                                    travelModes={travelModes}
                                    subOptions={subOptions}
                                    onModeChange={loadSubOptions}
                                    selectedGuests={selectedGuests}
                                    setSelectedGuests={setSelectedGuests}
                                    showToast={showToast}
                                    form={conveyanceForm}
                                    setForm={setConveyanceForm}
                                    notRequired={conveyanceNotRequired}
                                    setNotRequired={setConveyanceNotRequired}
                                />
                            )}

                            {activeTab === 'advance' && (
                                <TravelAdvanceSection
                                    sums={sums}
                                    otherExpenses={otherExpenses}
                                    setOtherExpenses={setOtherExpenses}
                                    totalAdvance={totalAdvance}
                                />
                            )}

                            {/* Navigation & Actions */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                                <div>
                                    {currentIndex > 0 && (
                                        <Button variant="outline" icon={ChevronLeft} onClick={goPrev}>
                                            Previous
                                        </Button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {activeTab === 'advance' ? (
                                        <>
                                            <Button variant="outline" icon={Save} onClick={handleSaveDraft}>
                                                Save as Draft
                                            </Button>
                                            {/* <Button icon={Send} onClick={handleSubmit}>
                                                Submit Application
                                            </Button> */}
                                            <Button
                                                icon={Send}
                                                onClick={handleSubmit}
                                                disabled={isValidating}
                                            >
                                                {isValidating ? 'Validating...' : 'Submit Application'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button icon={ChevronRight} onClick={goNext}>
                                            Next: {tabs[currentIndex + 1]?.label}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Validation Errors Modal */}
            {validationErrors && validationErrors.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                            <h3 className="text-lg font-bold text-red-700">Validation Errors</h3>
                            <p className="text-sm text-red-600 mt-1">Please fix these issues before submitting</p>
                        </div>

                        <div className="overflow-y-auto p-6 flex-1">
                            {validationErrors.map((trip, tripIdx) => (
                                <div key={tripIdx} className="mb-4 border-l-4 border-red-400 pl-4">
                                    <h4 className="font-semibold text-slate-800 mb-2">
                                        Trip #{trip.trip_id || tripIdx + 1}: {trip.from_to}
                                    </h4>

                                    {trip.issues?.map((issue, issueIdx) => (
                                        <div key={issueIdx} className="mb-2 text-sm">
                                            <span className="text-red-600">• {issue.message}</span>
                                        </div>
                                    ))}

                                    {trip.bookings?.map((booking, bookingIdx) => (
                                        booking.issues?.length > 0 && (
                                            <div key={bookingIdx} className="mt-3 ml-4">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {booking.booking_type || 'Booking'} - ₹{booking.estimated_cost}
                                                </p>
                                                {booking.issues.map((issue, idx) => (
                                                    <p key={idx} className={`text-sm ml-4 ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                                                        }`}>
                                                        • {issue.message.replace(/[\[\]']/g, '')}
                                                    </p>
                                                ))}
                                            </div>
                                        )
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setValidationErrors(null)}
                            >
                                Close & Fix Issues
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        // </Layout>
    );
}