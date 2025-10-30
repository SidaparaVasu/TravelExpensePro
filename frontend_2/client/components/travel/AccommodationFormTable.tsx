import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccommodationBooking } from '@/src/types/travel.types';
import { useState } from 'react';

interface AccommodationFormTableProps {
    accommodation: AccommodationBooking[];
    onAdd: (booking: AccommodationBooking) => void;
    onUpdate: (index: number, booking: AccommodationBooking) => void;
    onRemove: (index: number) => void;
    travelModes: any;
    guestHouses: any[];
    arcHotels: any[];
    onSave: () => void;
    isLoading: boolean;
}

export function AccommodationFormTable({
    accommodation,
    onUpdate,
    onAdd,
    onRemove,
    travelModes,
    guestHouses,
    arcHotels,
    onSave,
    isLoading
}: AccommodationFormTableProps) {
    const [editingIndex, setEditingIndex] = useState<number>(-1);

    const emptyAcc: AccommodationBooking = {
        accommodation_type: 'company',
        guest_house_id: undefined,
        hotel_name: '',
        place: '',
        arrival_date: '',
        arrival_time: '',
        departure_date: '',
        departure_time: '',
        booking_type: '',
        estimated_cost: '',
        special_instruction: ''
    };
    const [formData, setFormData] = useState<AccommodationBooking>(emptyAcc);

    const hotelMode = travelModes?.results?.find((m: any) => m.name === 'Hotel');

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setFormData({ ...accommodation[index] });
    };

    const handleAddNew = () => {
        setEditingIndex(-1);
        setFormData({
            accommodation_type: 'company',
            place: '',
            arrival_date: '',
            arrival_time: '',
            departure_date: '',
            departure_time: '',
            booking_type: hotelMode?.id?.toString() || '',
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
            onUpdate(editingIndex, formData);
        } else {
            onAdd(formData);
        }

        setFormData(null);
        setEditingIndex(-1);
    };

    const handleCancel = () => {
        setFormData(null);
        setEditingIndex(-1);
    };

    //   const currentFormData = formData || {
    //     accommodation_type: 'company',
    //     place: '',
    //     arrival_date: '',
    //     arrival_time: '',
    //     departure_date: '',
    //     departure_time: '',
    //     booking_type: hotelMode?.id?.toString() || '',
    //     estimated_cost: '',
    //     special_instruction: ''
    //   };

    return (
        <div className="space-y-6">
            {/* Form Section */}
            <div className="border rounded-lg p-4 bg-white">
                <h4 className="font-medium mb-4">
                    {editingIndex >= 0 ? 'Edit Accommodation' : 'Add Accommodation'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Type */}
                    <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select value={formData?.accommodation_type || 'company'}
                            onValueChange={(value: 'company' | 'self') => {
                                handleFormChange('accommodation_type', value);
                                if (value === 'company') {
                                    handleFormChange('hotel_name', '');
                                } else {
                                    handleFormChange('guest_house_id', undefined);
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="self">Self</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Guest House (if company) */}
                    {formData.accommodation_type === 'company' && (
                        <div className="space-y-2">
                            <Label>Guest House</Label>
                            <Select
                                value={formData.guest_house_id?.toString() || ''}
                                onValueChange={(value) => handleFormChange('guest_house_id', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Company Guest House" />
                                </SelectTrigger>
                                <SelectContent>
                                    {guestHouses?.results?.map((gh: any) => (
                                        <SelectItem key={gh.id} value={gh.id.toString()}>
                                            {gh.name} - {gh.location || gh.city}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Hotel Name (if self) */}
                    {formData.accommodation_type === 'self' && (
                        <div className="space-y-2">
                            <Label>Hotel Name *</Label>
                            <Input
                                value={formData.hotel_name || ''}
                                onChange={(e) => handleFormChange('hotel_name', e.target.value)}
                                placeholder="Enter hotel name"
                            />
                        </div>
                    )}

                    {/* Place */}
                    <div className="space-y-2">
                        <Label>Place *</Label>
                        <Input
                            value={formData.place}
                            onChange={(e) => handleFormChange('place', e.target.value)}
                            placeholder="e.g., Andheri, Mumbai"
                        />
                    </div>

                    {/* Arrival Date */}
                    <div className="space-y-2">
                        <Label>Arrival Date *</Label>
                        <Input
                            type="date"
                            value={formData.arrival_date}
                            onChange={(e) => handleFormChange('arrival_date', e.target.value)}
                        />
                    </div>

                    {/* Arrival Time */}
                    <div className="space-y-2">
                        <Label>Arrival Time *</Label>
                        <Input
                            type="time"
                            value={formData.arrival_time}
                            onChange={(e) => handleFormChange('arrival_time', e.target.value)}
                        />
                    </div>

                    {/* Departure Date */}
                    <div className="space-y-2">
                        <Label>Departure Date *</Label>
                        <Input
                            type="date"
                            value={formData.departure_date}
                            onChange={(e) => handleFormChange('departure_date', e.target.value)}
                        />
                    </div>

                    {/* Departure Time */}
                    <div className="space-y-2">
                        <Label>Departure Time *</Label>
                        <Input
                            type="time"
                            value={formData.departure_time}
                            onChange={(e) => handleFormChange('departure_time', e.target.value)}
                        />
                    </div>

                    {/* Estimated Cost */}
                    <div className="space-y-2">
                        <Label>Estimated Cost (₹) *</Label>
                        <Input
                            type="number"
                            min={0}
                            value={formData.estimated_cost}
                            onChange={(e) => handleFormChange('estimated_cost', e.target.value)}
                        />
                    </div>
                </div>

                {/* Special Instructions */}
                <div className="space-y-2 mt-4">
                    <Label>Special Instructions</Label>
                    <Textarea
                        value={formData.special_instruction}
                        onChange={(e) => handleFormChange('special_instruction', e.target.value)}
                        placeholder="e.g., Veg meal preference, room preference..."
                        rows={2}
                    />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 mt-4">
                    <Button type="button" onClick={handleSaveBooking} size="sm">
                        {editingIndex >= 0 ? 'Update' : 'Add'}
                    </Button>
                    {formData && (
                        <Button type="button" onClick={handleCancel} variant="outline" size="sm">
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Section */}
            {accommodation.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Place</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Arrival</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">Departure</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold">Cost (₹)</th>
                                <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accommodation.map((acc, index) => (
                                <tr key={index} className="border-t hover:bg-slate-50">
                                    <td className="px-4 py-2 text-sm capitalize">{acc.accommodation_type}</td>
                                    <td className="px-4 py-2 text-sm">{acc.place}</td>
                                    <td className="px-4 py-2 text-sm">{acc.arrival_date} {acc.arrival_time}</td>
                                    <td className="px-4 py-2 text-sm">{acc.departure_date} {acc.departure_time}</td>
                                    <td className="px-4 py-2 text-sm text-right font-semibold">
                                        {Number(acc.estimated_cost).toLocaleString('en-IN')}
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