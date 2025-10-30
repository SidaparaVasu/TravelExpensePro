import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface PurposeFormProps {
  formData: any;
  tripDetails: any;
  onFormDataChange: (field: string, value: any) => void;
  onTripDetailsChange: (field: string, value: any) => void;
  glCodes: any;
  locations: any;
  advanceAmount: number;
  onAdvanceAmountChange: (value: number) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function PurposeForm({ 
  formData, 
  tripDetails, 
  onFormDataChange, 
  onTripDetailsChange,
  glCodes,
  locations,
  advanceAmount,
  onAdvanceAmountChange,
  onSave,
  isLoading
}: PurposeFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purpose */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="purpose">Purpose of Travel *</Label>
          <Textarea
            id="purpose"
            value={formData.purpose}
            onChange={(e) => onFormDataChange('purpose', e.target.value)}
            placeholder="Describe the purpose of your travel..."
            rows={4}
            required
          />
        </div>

        {/* Internal Order */}
        <div className="space-y-2">
          <Label htmlFor="internal_order">Internal Order (IO) *</Label>
          <Input
            id="internal_order"
            value={formData.internal_order}
            onChange={(e) => onFormDataChange('internal_order', e.target.value)}
            placeholder="Enter IO number"
            required
          />
        </div>

        {/* Sanction Number */}
        <div className="space-y-2">
          <Label htmlFor="sanction_number">Sanction Number *</Label>
          <Input
            id="sanction_number"
            value={formData.sanction_number}
            onChange={(e) => onFormDataChange('sanction_number', e.target.value)}
            placeholder="Enter sanction number"
            required
          />
        </div>

        {/* GL Code */}
        <div className="space-y-2">
          <Label htmlFor="general_ledger">GL Code *</Label>
          <Select
            value={formData.general_ledger}
            onValueChange={(value) => onFormDataChange('general_ledger', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select GL Code" />
            </SelectTrigger>
            <SelectContent>
              {glCodes?.results?.map((gl: any) => (
                <SelectItem key={gl.id} value={gl.id.toString()}>
                  {gl.gl_code} - {gl.vertical_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Location */}
        <div className="space-y-2">
          <Label>From Location *</Label>
          <Select
            value={tripDetails.from_location?.toString() || ''}
            onValueChange={(value) => onTripDetailsChange('from_location', parseInt(value))}
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

        {/* To Location */}
        <div className="space-y-2">
          <Label>To Location *</Label>
          <Select
            value={tripDetails.to_location?.toString() || ''}
            onValueChange={(value) => onTripDetailsChange('to_location', parseInt(value))}
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

        {/* From Date */}
        <div className="space-y-2">
          <Label>From Date *</Label>
          <Input
            type="date"
            value={tripDetails.departure_date}
            onChange={(e) => onTripDetailsChange('departure_date', e.target.value)}
            required
          />
        </div>

        {/* To Date */}
        <div className="space-y-2">
          <Label>To Date *</Label>
          <Input
            type="date"
            value={tripDetails.return_date}
            onChange={(e) => onTripDetailsChange('return_date', e.target.value)}
            required
          />
        </div>

        {/* Trip Purpose */}
        <div className="space-y-2">
          <Label>Trip Purpose</Label>
          <Input
            value={tripDetails.trip_purpose}
            onChange={(e) => onTripDetailsChange('trip_purpose', e.target.value)}
            placeholder="Specific purpose for this trip"
          />
        </div>

        {/* Guest Count */}
        <div className="space-y-2">
          <Label>Guest Count</Label>
          <Input
            type="number"
            min={0}
            value={tripDetails.guest_count}
            onChange={(e) => onTripDetailsChange('guest_count', Math.max(0, parseInt(e.target.value) || 0))}
          />
        </div>

        {/* Advance Amount */}
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

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save as Draft'}
        </Button>
      </div>
    </div>
  );
}