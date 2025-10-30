import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConveyanceBooking } from '@/src/types/travel.types';

interface ConveyanceFormProps {
  conveyance: ConveyanceBooking[];
  onChange: (index: number, field: string, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  travelModes: any;
  subOptions: Record<number, any>;
  onModeChange: (modeId: number, index: number) => void;
}

export function ConveyanceForm({
  conveyance,
  onChange,
  onAdd,
  onRemove,
  travelModes,
  subOptions,
  onModeChange
}: ConveyanceFormProps) {

  // Filter conveyance modes (Taxi, Car, Bus, etc.)
  const conveyanceModes = travelModes?.results?.filter((m: any) =>
    ['Taxi', 'Car', 'Bus', 'Cab'].some(type => m.name.toLowerCase().includes(type.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Conveyance Bookings</h3>
        <Button type="button" onClick={onAdd} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Conveyance
        </Button>
      </div>

      {conveyance.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-md border-2 border-dashed">
          <p className="text-slate-600 mb-3">No conveyance added yet</p>
          <Button type="button" onClick={onAdd} size="sm">
            Add Conveyance
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {conveyance.map((conv, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Conveyance {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Vehicle Type */}
                <div className="space-y-2">
                  <Label>Vehicle Type *</Label>
                  <Select
                    value={conv.booking_type?.toString() || ''}
                    onValueChange={(value) => {
                      onChange(index, 'booking_type', parseInt(value));
                      onModeChange(parseInt(value), index);
                      // Set vehicle_type name
                      const mode = travelModes?.results?.find((m: any) => m.id === parseInt(value));
                      if (mode) {
                        onChange(index, 'vehicle_type', mode.name);
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

                {/* Sub Option (if available) */}
                {conv.booking_type && subOptions[conv.booking_type] && (
                  <div className="space-y-2">
                    <Label>Vehicle Category</Label>
                    <Select
                      value={conv.sub_option?.toString() || ''}
                      onValueChange={(value) => onChange(index, 'sub_option', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {subOptions[conv.booking_type].results?.map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id.toString()}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* From Location */}
                <div className="space-y-2">
                  <Label>From Location *</Label>
                  <Input
                    value={conv.from_location}
                    onChange={(e) => onChange(index, 'from_location', e.target.value)}
                    placeholder="e.g., Mumbai Airport"
                    required
                  />
                </div>

                {/* To Location */}
                <div className="space-y-2">
                  <Label>To Location *</Label>
                  <Input
                    value={conv.to_location}
                    onChange={(e) => onChange(index, 'to_location', e.target.value)}
                    placeholder="e.g., Guest House, Andheri"
                    required
                  />
                </div>

                {/* Start DateTime */}
                {/* Start DateTime */}
                <div className="space-y-2">
                  <Label>Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={conv.start_date && conv.start_time ? `${conv.start_date}T${conv.start_time}` : ''}
                    onChange={(e) => {
                      const [date, time] = e.target.value.split('T');
                      onChange(index, 'start_date', date);
                      onChange(index, 'start_time', time);
                    }}
                    required
                  />
                </div>

                {/* End DateTime */}
                <div className="space-y-2">
                  <Label>End Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={conv.end_date && conv.end_time ? `${conv.end_date}T${conv.end_time}` : ''}
                    onChange={(e) => {
                      const [date, time] = e.target.value.split('T');
                      onChange(index, 'end_date', date);
                      onChange(index, 'end_time', time);
                    }}
                    required
                  />
                </div>

                {/* Drop Location */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Drop Location *</Label>
                  <Input
                    value={conv.drop_location}
                    onChange={(e) => onChange(index, 'drop_location', e.target.value)}
                    placeholder="e.g., Guest House Main Gate"
                    required
                  />
                </div>

                {/* Estimated Cost */}
                <div className="space-y-2">
                  <Label>Estimated Cost (₹) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={conv.estimated_cost}
                    placeholder='0'
                    onChange={(e) => onChange(index, 'estimated_cost', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label>Special Instructions</Label>
                <Textarea
                  value={conv.special_instruction}
                  onChange={(e) => onChange(index, 'special_instruction', e.target.value)}
                  placeholder="e.g., Driver contact needed, luggage space required..."
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}