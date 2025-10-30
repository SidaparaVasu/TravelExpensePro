import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketingBooking } from '@/src/types/travel.types';
import { useState } from 'react';

interface TicketingFormTableProps {
    ticketing: TicketingBooking[];
    onChange: (index: number, field: string, value: any) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    travelModes: any;
    subOptions: Record<number, any>;
    onModeChange: (modeId: number) => void;
    tripMode: 'one-way' | 'round-trip';
    onSave: () => void;
    isLoading: boolean;
}

export function TicketingFormTable({
    ticketing,
    onChange,
    onAdd,
    onRemove,
    travelModes,
    subOptions,
    onModeChange,
    tripMode,
    onSave,
    isLoading
}: TicketingFormTableProps) {
    const [editingIndex, setEditingIndex] = useState<number>(-1);
    const [formData, setFormData] = useState<TicketingBooking | null>(null);

    const ticketingModes = travelModes?.results?.filter((m: any) =>
        m.name === 'Flight' || m.name === 'Train'
    ) || [];

    const emptyTicket: TicketingBooking = {
        from_location: '',
        to_location: '',
        departure_date: '',
        departure_time: '',
        booking_type: '',
        estimated_cost: '',
        special_instruction: ''
    };

    const displayData = formData || emptyTicket;
    const isEditing = editingIndex >= 0;
    
    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setFormData({ ...ticketing[index] });
    };

    const handleAddNew = () => {
        setEditingIndex(-1);
        setFormData({
            from_location: '',
            to_location: '',
            departure_date: '',
            departure_time: '',
            booking_type: '',
            estimated_cost: '',
            special_instruction: ''
        });
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSaveBooking = () => {
        if (!formData) return;

        if (editingIndex >= 0) {
            // Update existing
            Object.keys(formData).forEach(key => {
                onChange(editingIndex, key, formData[key as keyof TicketingBooking]);
            });
        } else {
            // Add new
            onAdd();
            const newIndex = ticketing.length;
            Object.keys(formData).forEach(key => {
                onChange(newIndex, key, formData[key as keyof TicketingBooking]);
            });
        }

        // Reset form
        setFormData(null);
        setEditingIndex(-1);
    };

    const handleCancel = () => {
        setFormData(null);
        setEditingIndex(-1);
    };

    //   const currentFormData = formData || {
    //     from_location: '',
    //     to_location: '',
    //     departure_date: '',
    //     departure_time: '',
    //     booking_type: '',
    //     estimated_cost: '',
    //     special_instruction: ''
    //   };

    return (
        <div className="space-y-6">
            {/* Add New Button (only show when no form active) */}
            {!formData && (
                <Button type="button" onClick={handleAddNew}>
                    Add New Ticket
                </Button>
            )}
            {/* Form Section */}
            {formData && (
                <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium mb-4">
                        {editingIndex >= 0 ? 'Edit Ticket' : 'Add Ticket'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Travel Mode */}
                        <div className="space-y-2">
                            <Label>Travel Mode *</Label>
                            <Select
                                value={formData.booking_type?.toString() || ''}
                                onValueChange={(value) => {
                                    handleFormChange('booking_type', value);
                                    onModeChange(parseInt(value));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ticketingModes.map((mode: any) => (
                                        <SelectItem key={mode.id} value={mode.id.toString()}>
                                            {mode.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class */}
                        {formData.booking_type && subOptions[Number(formData.booking_type)] && (
                            <div className="space-y-2">
                                <Label>Class *</Label>
                                <Select
                                    value={formData.sub_option?.toString() || ''}
                                    onValueChange={(value) => handleFormChange('sub_option', parseInt(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subOptions[Number(formData.booking_type)].results?.map((opt: any) => (
                                            <SelectItem key={opt.id} value={opt.id.toString()}>
                                                {opt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* From */}
                        <div className="space-y-2">
                            <Label>From *</Label>
                            <Input
                                value={displayData.from_location}
                                onChange={(e) => handleFormChange('from_location', e.target.value)}
                                placeholder="e.g., Ahmedabad Airport"
                            />
                        </div>

                        {/* To */}
                        <div className="space-y-2">
                            <Label>To *</Label>
                            <Input
                                value={displayData.to_location}
                                onChange={(e) => handleFormChange('to_location', e.target.value)}
                                placeholder="e.g., Mumbai Airport"
                            />
                        </div>

                        {/* Departure Date */}
                        <div className="space-y-2">
                            <Label>Departure Date *</Label>
                            <Input
                                type="date"
                                value={displayData.departure_date}
                                onChange={(e) => handleFormChange('departure_date', e.target.value)}
                            />
                        </div>

                        {/* Departure Time */}
                        <div className="space-y-2">
                            <Label>Departure Time *</Label>
                            <Input
                                type="time"
                                value={displayData.departure_time}
                                onChange={(e) => handleFormChange('departure_time', e.target.value)}
                            />
                        </div>

                        {/* Return fields if round-trip */}
                        {tripMode === 'round-trip' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Return Date *</Label>
                                    <Input
                                        type="date"
                                        value={displayData.arrival_date || ''}
                                        onChange={(e) => handleFormChange('arrival_date', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Return Time *</Label>
                                    <Input
                                        type="time"
                                        value={displayData.arrival_time || ''}
                                        onChange={(e) => handleFormChange('arrival_time', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Estimated Cost */}
                        <div className="space-y-2">
                            <Label>Estimated Cost (₹) *</Label>
                            <Input
                                type="number"
                                min={0}
                                value={displayData.estimated_cost}
                                onChange={(e) => handleFormChange('estimated_cost', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="space-y-2 mt-4">
                        <Label>Special Instructions</Label>
                        <Textarea
                            value={displayData.special_instruction}
                            onChange={(e) => handleFormChange('special_instruction', e.target.value)}
                            placeholder="e.g., Window seat preference, meal preference..."
                            rows={2}
                        />
                    </div>

                    {/* Form Buttons */}
                    <div className="flex gap-2 mt-4">
                        <Button type="button" onClick={handleSaveBooking} size="sm">
                            {editingIndex >= 0 ? 'Update' : 'Add'}
                        </Button>
                        {displayData && (
                            <Button type="button" onClick={handleCancel} variant="outline" size="sm">
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            )}
            {/* Table Section */}
            {ticketing.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Mode</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">From → To</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Departure</th>
                                {tripMode === 'round-trip' && (
                                    <th className="px-4 py-2 text-left text-sm font-semibold">Return</th>
                                )}
                                <th className="px-4 py-2 text-right text-sm font-semibold">Cost (₹)</th>
                                <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticketing.map((ticket, index) => (
                                <tr key={index} className="border-t hover:bg-slate-50">
                                    <td className="px-4 py-2 text-sm">
                                        {travelModes?.results?.find((m: any) => m.id === Number(ticket.booking_type))?.name || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {ticket.from_location} → {ticket.to_location}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {ticket.departure_date} {ticket.departure_time}
                                    </td>
                                    {tripMode === 'round-trip' && (
                                        <td className="px-4 py-2 text-sm">
                                            {ticket.arrival_date} {ticket.arrival_time}
                                        </td>
                                    )}
                                    <td className="px-4 py-2 text-sm text-right font-semibold">
                                        {Number(ticket.estimated_cost).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(index)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemove(index)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Save Draft Button */}
            <div className="flex justify-end pt-4">
                <Button type="button" onClick={onSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save as Draft'}
                </Button>
            </div>
        </div>
    );
}