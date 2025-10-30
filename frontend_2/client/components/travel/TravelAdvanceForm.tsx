import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TravelAdvanceData } from '@/src/types/travel.types';

interface TravelAdvanceFormProps {
  travelAdvance: TravelAdvanceData;
  onChange: (field: string, value: any) => void;
  ticketing: any[];
  accommodation: any[];
  conveyance: any[];
  onSave?: () => void;
  isLoading?: boolean;
}

export function TravelAdvanceForm({ travelAdvance, onChange, onSave, isLoading, ticketing, accommodation, conveyance }: TravelAdvanceFormProps) {

  // Calculate from booking costs
  const calculateFromBookings = () => {
    // Air + Train fare from ticketing
    const airTrainTotal = ticketing.reduce((sum, t) => {
      const cost = Number(t.estimated_cost || 0);
      // You can differentiate by booking_type if needed
      return sum + cost;
    }, 0);

    // Split air/train (simplified - assign all to air_fare for now)
    const calculatedAirFare = airTrainTotal;
    const calculatedTrainFare = 0;

    // Lodging from accommodation
    const calculatedLodging = accommodation.reduce((sum, a) =>
      sum + Number(a.estimated_cost || 0), 0
    );

    // Conveyance from conveyance
    const calculatedConveyance = conveyance.reduce((sum, c) =>
      sum + Number(c.estimated_cost || 0), 0
    );

    return {
      air_fare: calculatedAirFare,
      train_fare: calculatedTrainFare,
      lodging_fare: calculatedLodging,
      conveyance_fare: calculatedConveyance
    };
  };

  // Auto-calculate total whenever any fare changes
  useEffect(() => {
    const calculated = calculateFromBookings();

    // Update calculated fields
    onChange('air_fare', calculated.air_fare);
    onChange('train_fare', calculated.train_fare);
    onChange('lodging_fare', calculated.lodging_fare);
    onChange('conveyance_fare', calculated.conveyance_fare);

    // Calculate total (including other_expenses which is manual)
    const total =
      calculated.air_fare +
      calculated.train_fare +
      calculated.lodging_fare +
      calculated.conveyance_fare +
      Number(travelAdvance.other_expenses || 0);

    onChange('total', total);
  }, [
    ticketing,
    accommodation,
    conveyance,
    travelAdvance.other_expenses
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-800 mb-2">Travel Advance Request</h3>
        <p className="text-sm text-slate-600">
          Enter the advance amount you need for each category. The total will be calculated automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Air Fare */}
        <div className="space-y-2">
          <Label htmlFor="air_fare">Air Fare (₹)</Label>
          <Input
            id="air_fare"
            type="number"
            value={travelAdvance.air_fare || 0}
            readOnly
            className="bg-slate-100"
          />
          <p className="text-xs text-slate-500">Auto-calculated from ticketing</p>
        </div>

        {/* Train Fare */}
        <div className="space-y-2">
          <Label htmlFor="train_fare">Train Fare (₹)</Label>
          <Input
            id="train_fare"
            type="number"
            value={travelAdvance.train_fare || 0}
            readOnly
            className="bg-slate-100"
          />
          <p className="text-xs text-slate-500">Auto-calculated from ticketing</p>
        </div>

        {/* Lodging/Boarding Fare */}
        <div className="space-y-2">
          <Label htmlFor="lodging_fare">Lodging/Boarding Fare (₹)</Label>
          <Input
            id="lodging_fare"
            type="number"
            value={travelAdvance.lodging_fare || 0}
            readOnly
            className="bg-slate-100"
          />
          <p className="text-xs text-slate-500">Auto-calculated from accommodation</p>
        </div>

        {/* Conveyance Fare */}
        <div className="space-y-2">
          <Label htmlFor="conveyance_fare">Conveyance Fare (₹)</Label>
          <Input
            id="conveyance_fare"
            type="number"
            value={travelAdvance.conveyance_fare || 0}
            readOnly
            className="bg-slate-100"
          />
          <p className="text-xs text-slate-500">Auto-calculated from conveyance</p>
        </div>

        {/* Other Expenses */}
        <div className="space-y-2">
          <Label htmlFor="other_expenses">Other Expenses (₹)</Label>
          <Input
            id="other_expenses"
            type="number"
            min={0}
            step="1"
            value={travelAdvance.other_expenses || ''}
            onChange={(e) => onChange('other_expenses', Number(e.target.value))}
            placeholder="0"
          />
          <p className="text-xs text-slate-500">Miscellaneous expenses (manual entry)</p>
        </div>

        {/* Total (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="total" className="font-semibold">Total Advance (₹)</Label>
          <Input
            id="total"
            type="number"
            value={travelAdvance.total}
            readOnly
            className="bg-slate-100 font-semibold text-lg"
          />
          <p className="text-xs text-slate-500">Auto-calculated total</p>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="space-y-2">
        <Label htmlFor="advance_instruction">Special Instructions</Label>
        <Textarea
          id="advance_instruction"
          value={travelAdvance.special_instruction}
          onChange={(e) => onChange('special_instruction', e.target.value)}
          placeholder="Any special instructions or notes regarding the advance request..."
          rows={3}
        />
      </div>

      {/* Summary Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-slate-800 mb-1">Total Advance Requested</h4>
            <p className="text-sm text-slate-600">
              This amount will be processed after approval
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">
              ₹{travelAdvance.total.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
      {/* Save Draft Button */}
      {onSave && (
        <div className="flex justify-end pt-4">
          <Button type="button" onClick={onSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save as Draft'}
          </Button>
        </div>
      )}
    </div>

  );
}