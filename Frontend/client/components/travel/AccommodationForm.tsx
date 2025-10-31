import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccommodationBooking } from '@/src/types/travel.types';

interface AccommodationFormProps {
  accommodation: AccommodationBooking[];
  onChange: (index: number, field: string, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  travelModes: any;
  guestHouses: any[];
  arcHotels: any[];
}

export function AccommodationForm({ 
  accommodation, 
  onChange, 
  onAdd, 
  onRemove,
  travelModes,
  guestHouses,
  arcHotels
}: AccommodationFormProps) {
  
  // Filter only Hotel mode
  const hotelMode = travelModes?.results?.find((m: any) => m.name === 'Hotel');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Accommodation Bookings</h3>
        <Button type="button" onClick={onAdd} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Accommodation
        </Button>
      </div>

      {accommodation.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-md border-2 border-dashed">
          <p className="text-slate-600 mb-3">No accommodation added yet</p>
          <Button type="button" onClick={onAdd} size="sm">
            Add Accommodation
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {accommodation.map((acc, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Accommodation {index + 1}</h4>
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
                {/* Accommodation Type */}
                <div className="space-y-2">
                  <Label>Accommodation Type *</Label>
                  <Select
                    value={acc.accommodation_type}
                    onValueChange={(value: 'company' | 'self') => {
                      onChange(index, 'accommodation_type', value);
                      // Reset related fields when type changes
                      if (value === 'company') {
                        onChange(index, 'hotel_name', '');
                      } else {
                        onChange(index, 'guest_house_id', undefined);
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

                {/* Conditional: Guest House (when type = company) */}
                {acc.accommodation_type === 'company' && (
                  <div className="space-y-2">
                    <Label>Guest House *</Label>
                    <Select
                      value={acc.guest_house_id?.toString() || ''}
                      onValueChange={(value) => onChange(index, 'guest_house_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Company Guest House" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" disabled>Company Guest House (default)</SelectItem>
                        {guestHouses?.results?.map((gh: any) => (
                          <SelectItem key={gh.id} value={gh.id.toString()}>
                            {gh.name} - {gh.location || gh.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Conditional: Hotel Name (when type = self) */}
                {acc.accommodation_type === 'self' && (
                  <>
                    <div className="space-y-2">
                      <Label>ARC Hotel (Optional)</Label>
                      <Select
                        value={acc.guest_house_id?.toString() || ''}
                        onValueChange={(value) => {
                          const hotel = arcHotels?.results?.find((h: any) => h.id === parseInt(value));
                          onChange(index, 'guest_house_id', parseInt(value));
                          if (hotel) {
                            onChange(index, 'hotel_name', hotel.name);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ARC Hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {arcHotels?.results?.map((hotel: any) => (
                            <SelectItem key={hotel.id} value={hotel.id.toString()}>
                              {hotel.name} - {hotel.location || hotel.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Hotel Name *</Label>
                      <Input
                        value={acc.hotel_name || ''}
                        onChange={(e) => onChange(index, 'hotel_name', e.target.value)}
                        placeholder="Enter hotel name"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Place */}
                <div className="space-y-2">
                  <Label>Place/Location *</Label>
                  <Input
                    value={acc.place}
                    onChange={(e) => onChange(index, 'place', e.target.value)}
                    placeholder="e.g., Andheri, Mumbai"
                    required
                  />
                </div>

                {/* Arrival Date */}
                <div className="space-y-2">
                  <Label>Arrival Date *</Label>
                  <Input
                    type="date"
                    value={acc.arrival_date}
                    onChange={(e) => onChange(index, 'arrival_date', e.target.value)}
                    required
                  />
                </div>

                {/* Arrival Time */}
                <div className="space-y-2">
                  <Label>Arrival Time *</Label>
                  <Input
                    type="time"
                    value={acc.arrival_time}
                    onChange={(e) => onChange(index, 'arrival_time', e.target.value)}
                    required
                  />
                </div>

                {/* Departure Date */}
                <div className="space-y-2">
                  <Label>Departure Date *</Label>
                  <Input
                    type="date"
                    value={acc.departure_date}
                    onChange={(e) => onChange(index, 'departure_date', e.target.value)}
                    required
                  />
                </div>

                {/* Departure Time */}
                <div className="space-y-2">
                  <Label>Departure Time *</Label>
                  <Input
                    type="time"
                    value={acc.departure_time}
                    onChange={(e) => onChange(index, 'departure_time', e.target.value)}
                    required
                  />
                </div>

                {/* Estimated Cost */}
                <div className="space-y-2">
                  <Label>Estimated Cost (₹) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={acc.estimated_cost}
                    onChange={(e) => onChange(index, 'estimated_cost', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label>Special Instructions</Label>
                <Textarea
                  value={acc.special_instruction}
                  onChange={(e) => onChange(index, 'special_instruction', e.target.value)}
                  placeholder="e.g., Veg meal preference, room preference, priority guest house selection..."
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