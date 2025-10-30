import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConveyanceBooking } from '@/src/types/travel.types';
import { useState } from 'react';

interface ConveyanceFormTableProps {
  conveyance: ConveyanceBooking[];
  onChange: (index: number, field: string, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  travelModes: any;
  subOptions: Record<number, any>;
  onModeChange: (modeId: number) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function ConveyanceFormTable({
  conveyance,
  onChange,
  onAdd,
  onRemove,
  travelModes,
  subOptions,
  onModeChange,
  onSave,
  isLoading
}: ConveyanceFormTableProps) {
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [formData, setFormData] = useState<ConveyanceBooking | null>(null);

  const conveyanceModes = travelModes?.results?.filter((m: any) =>
    ['Taxi', 'Car', 'Bus', 'Cab'].some(type => m.name.toLowerCase().includes(type.toLowerCase()))
  ) || [];

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...conveyance[index] });
  };

  const handleAddNew = () => {
    setEditingIndex(-1);
    setFormData({
      vehicle_type: '',
      from_location: '',
      to_location: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      drop_location: '',
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
      Object.keys(formData).forEach(key => {
        onChange(editingIndex, key, formData[key as keyof ConveyanceBooking]);
      });
    } else {
      onAdd();
      const newIndex = conveyance.length;
      Object.keys(formData).forEach(key => {
        onChange(newIndex, key, formData[key as keyof ConveyanceBooking]);
      });
    }

    setFormData(null);
    setEditingIndex(-1);
  };

  const handleCancel = () => {
    setFormData(null);
    setEditingIndex(-1);
  };

  const currentFormData = formData || {
    vehicle_type: '',
    from_location: '',
    to_location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    drop_location: '',
    booking_type: '',
    estimated_cost: '',
    special_instruction: ''
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-medium mb-4">
          {editingIndex >= 0 ? 'Edit Conveyance' : 'Add Conveyance'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label>Vehicle Type *</Label>
            <Select
              value={currentFormData.booking_type?.toString() || ''}
              onValueChange={(value) => {
                handleFormChange('booking_type', parseInt(value));
                onModeChange(parseInt(value));
                const mode = travelModes?.results?.find((m: any) => m.id === parseInt(value));
                if (mode) {
                  handleFormChange('vehicle_type', mode.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {conveyanceModes.map((mode: any) => (
                  <SelectItem key={mode.id} value={mode.id.toString()}>
                    {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From */}
          <div className="space-y-2">
            <Label>From *</Label>
            <Input
              value={currentFormData.from_location}
              onChange={(e) => handleFormChange('from_location', e.target.value)}
              placeholder="e.g., Mumbai Airport"
            />
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label>To *</Label>
            <Input
              value={currentFormData.to_location}
              onChange={(e) => handleFormChange('to_location', e.target.value)}
              placeholder="e.g., Guest House"
            />
          </div>

          {/* Start DateTime */}
          <div className="space-y-2">
            <Label>Start Date & Time *</Label>
            <Input
              type="datetime-local"
              value={currentFormData.start_date && currentFormData.start_time ? `${currentFormData.start_date}T${currentFormData.start_time}` : ''}
              onChange={(e) => {
                const [date, time] = e.target.value.split('T');
                handleFormChange('start_date', date);
                handleFormChange('start_time', time);
              }}
            />
          </div>

          {/* End DateTime */}
          <div className="space-y-2">
            <Label>End Date & Time *</Label>
            <Input
              type="datetime-local"
              value={currentFormData.end_date && currentFormData.end_time ? `${currentFormData.end_date}T${currentFormData.end_time}` : ''}
              onChange={(e) => {
                const [date, time] = e.target.value.split('T');
                handleFormChange('end_date', date);
                handleFormChange('end_time', time);
              }}
            />
          </div>

          {/* Drop Location */}
          <div className="space-y-2">
            <Label>Drop Location *</Label>
            <Input
              value={currentFormData.drop_location}
              onChange={(e) => handleFormChange('drop_location', e.target.value)}
              placeholder="e.g., Guest House Main Gate"
            />
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label>Estimated Cost (₹) *</Label>
            <Input
              type="number"
              min={0}
              value={currentFormData.estimated_cost}
              onChange={(e) => handleFormChange('estimated_cost', e.target.value)}
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2 mt-4">
          <Label>Special Instructions</Label>
          <Textarea
            value={currentFormData.special_instruction}
            onChange={(e) => handleFormChange('special_instruction', e.target.value)}
            placeholder="e.g., Driver contact needed..."
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
      {conveyance.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">Vehicle</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">From → To</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">End</th>
                <th className="px-4 py-2 text-right text-sm font-semibold">Cost (₹)</th>
                <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conveyance.map((conv, index) => (
                <tr key={index} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm">{conv.vehicle_type}</td>
                  <td className="px-4 py-2 text-sm">{conv.from_location} → {conv.to_location}</td>
                  <td className="px-4 py-2 text-sm">{conv.start_date} {conv.start_time}</td>
                  <td className="px-4 py-2 text-sm">{conv.end_date} {conv.end_time}</td>
                  <td className="px-4 py-2 text-sm text-right font-semibold">
                    {Number(conv.estimated_cost).toLocaleString('en-IN')}
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