import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TripDetailsFormProps {
  tripDetails: any;
  onChange: (field: string, value: any) => void;
  locations: any;
  advanceAmount: number;
  onAdvanceAmountChange: (value: number) => void;
}

export function TripDetailsForm({ tripDetails, onChange, locations, advanceAmount, onAdvanceAmountChange }: TripDetailsFormProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Trip Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 pt-0 rounded-lg">
        
        {/* Trip Mode */}
        <div className="space-y-2">
          <Label>Trip Mode *</Label>
          <Select
            value={tripDetails.trip_mode || 'one-way'}
            onValueChange={(value) => onChange('trip_mode', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-way">One Way</SelectItem>
              <SelectItem value="round-trip">Round Trip</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>From Location *</Label>
          <Select
            value={tripDetails.from_location?.toString() || ''}
            onValueChange={(value) => onChange('from_location', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.results?.map((loc: any) => (
                <SelectItem key={loc.location_id} value={loc.location_id.toString()}>
                  {loc.location_name} ({loc.city_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To Location *</Label>
          <Select
            value={tripDetails.to_location?.toString() || ''}
            onValueChange={(value) => onChange('to_location', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.results?.map((loc: any) => (
                <SelectItem key={loc.location_id} value={loc.location_id.toString()}>
                  {loc.location_name} ({loc.city_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Departure Date *</Label>
          <Input
            type="date"
            value={tripDetails.departure_date}
            onChange={(e) => onChange('departure_date', e.target.value)}
            required
          />
        </div>

        {tripDetails.trip_mode === 'round-trip' && (
          <div className="space-y-2">
            <Label>Return Date *</Label>
            <Input
              type="date"
              value={tripDetails.return_date}
              onChange={(e) => onChange('return_date', e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Trip Purpose</Label>
          <Input
            value={tripDetails.trip_purpose}
            onChange={(e) => onChange('trip_purpose', e.target.value)}
            placeholder="Specific purpose for this trip"
          />
        </div>

        <div className="space-y-2">
          <Label>Guest Count</Label>
          <Input
            type="number"
            min={0}
            value={tripDetails.guest_count}
            onChange={(e) => onChange('guest_count', Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>

        {/* Advance Amount - Moved from Basic Info */}
        <div className="space-y-2">
          <Label htmlFor="advance_amount">Advance Amount (₹)</Label>
          <Input
            id="advance_amount"
            type="number"
            min={0}
            value={advanceAmount}
            onChange={(e) => onAdvanceAmountChange(Math.max(0, Number(e.target.value)))}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}