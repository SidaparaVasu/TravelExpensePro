import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, Search } from 'lucide-react';

// ============================================
// 1. SEARCH BAR COMPONENT (Reusable)
// ============================================
export function SearchBar({ placeholder = "Search...", value, onChange, filters = [] }) {
    return (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                </div>

                {filters.map((filter, index) => (
                    <select
                        key={index}
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                        disabled={filter.disabled}
                    >
                        <option value="">{filter.placeholder || 'All'}</option>
                        {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ))}
            </div>
        </div>
    );
}

// ============================================
// 2. DATA TABLE COMPONENT (Reusable)
// ============================================
export function DataTable({ columns, data, onEdit, onDelete, renderCell }) {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b border-gray-200">
                    {columns.map((col) => (
                        <th
                            key={col.key}
                            className={`py-3 px-4 text-sm font-semibold text-slate-700 ${col.align === 'right' ? 'text-right' : 'text-left'
                                }`}
                        >
                            {col.label}
                        </th>
                    ))}
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length + 1} className="py-8 text-center text-sm text-slate-400">
                            No data found
                        </td>
                    </tr>
                ) : (
                    data.map((row) => (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={col.key} className="py-3 px-4 text-sm text-slate-700">
                                    {renderCell ? renderCell(col, row) : row[col.key]}
                                </td>
                            ))}
                            <td className="py-3 px-4 text-right">
                                <ActionButtons onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}

function ActionButtons({ onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={onEdit}
                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button
                onClick={onDelete}
                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

// ============================================
// 3. FORM MODAL COMPONENT (Reusable) - Enhanced with shadcn/ui
// ============================================


export function FormModal({ title, isOpen, onClose, fields, initialData = {}, onSubmit, dependencies = {} }) {
    const [formData, setFormData] = useState(initialData || {});

    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    const handleSubmit = () => {
        // Validate required fields
        const missingFields = fields.filter(f => f.required && !formData[f.name]);
        if (missingFields.length > 0) {
            alert(`Please fill required fields: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }
        onSubmit(formData);
    };

    const handleFieldChange = (fieldName, value, field) => {
        const newFormData = { ...formData, [fieldName]: value };
        setFormData(newFormData);

        // Handle field dependencies and callbacks
        if (field.onChangeCallback) {
            field.onChangeCallback(value, newFormData);
        }
    };

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

                <div className="p-4 space-y-4">
                    {fields.map((field) => {
                        // Handle field dependencies
                        if (field.dependsOn && !formData[field.dependsOn]) {
                            return null;
                        }

                        return (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                                        placeholder={field.placeholder}
                                        rows={field.rows || 3}
                                        maxLength={field.maxLength}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}

                                {field.type === 'select' && (
                                    <select
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{field.placeholder || 'Select...'}</option>
                                        {field.options?.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}

                                {field.type === 'checkbox' && (
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData[field.name] || false}
                                            onChange={(e) => handleFieldChange(field.name, e.target.checked, field)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-slate-600">
                                            {field.placeholder || 'Enable this option'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}



// ============================================
// 4. TAB TABLE COMPONENT (Main Reusable)
// ============================================
export function TabTable({ title, subtitle, tabs, data, onSave, onDelete }) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterValues, setFilterValues] = useState({});

    const activeTabConfig = tabs.find((t) => t.id === activeTab);
    const activeData = data[activeTab] || [];

    // Filter data by search term
    const searchFilteredData = searchTerm
        ? activeData.filter((item) =>
            activeTabConfig.searchKeys.some((key) =>
                String(item[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        : activeData;

    // Apply custom filters
    const filteredData = activeTabConfig.filters
        ? activeTabConfig.filters.reduce((acc, filter) => {
            const filterValue = filterValues[filter.key];
            if (!filterValue) return acc;
            return filter.filterFunction(acc, filterValue);
        }, searchFilteredData)
        : searchFilteredData;

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleModalSubmit = (formData) => {
        onSave(activeTab, formData, editingItem);
        setShowModal(false);
    };

    const handleFilterChange = (key, value) => {
        setFilterValues({ ...filterValues, [key]: value });
    };

    const filterComponents = activeTabConfig.filters?.map((filter) => ({
        value: filterValues[filter.key] || '',
        onChange: (val) => handleFilterChange(filter.key, val),
        placeholder: filter.placeholder,
        options: filter.options,
        disabled: filter.dependsOn ? !filterValues[filter.dependsOn] : false,
    })) || [];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
                        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add New
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSearchTerm('');
                                        setFilterValues({});
                                    }}
                                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-slate-600 hover:text-slate-800'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <SearchBar
                        placeholder={`Search ${activeTabConfig.label}...`}
                        value={searchTerm}
                        onChange={setSearchTerm}
                        filters={filterComponents}
                    />

                    <div className="p-4">
                        <DataTable
                            columns={activeTabConfig.columns}
                            data={filteredData}
                            onEdit={handleEdit}
                            onDelete={(id) => onDelete(activeTab, id)}
                            renderCell={activeTabConfig.renderCell}
                        />
                    </div>
                </div>

                <FormModal
                    title={`${editingItem ? 'Edit' : 'Add'} ${activeTabConfig.label}`}
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    fields={activeTabConfig.formFields}
                    initialData={editingItem || {}}
                    onSubmit={handleModalSubmit}
                    dependencies={activeTabConfig.dependencies || {}}
                />
            </div>
        </div>
    );
}