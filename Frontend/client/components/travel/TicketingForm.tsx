import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TicketingBooking } from '@/src/types/travel.types';

interface TicketingFormProps {
  ticketing: TicketingBooking[];
  onChange: (index: number, field: string, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  travelModes: any;
  subOptions: Record<number, any>;
  onModeChange: (modeId: number, index: number) => void;
  tripMode: 'one-way' | 'round-trip';
}

export function TicketingForm({
  ticketing,
  onChange,
  onAdd,
  onRemove,
  travelModes,
  subOptions,
  onModeChange,
  tripMode
}: TicketingFormProps) {

  // Filter only Flight and Train
  const ticketingModes = travelModes?.results?.filter((m: any) =>
    m.name === 'Flight' || m.name === 'Train'
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Ticketing Bookings</h3>
        <Button type="button" onClick={onAdd} size="sm" variant="outline" className="hover:bg-slate-50 hover:text-secondary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Ticket
        </Button>
      </div>

      {ticketing.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-md border-2 border-dashed">
          <p className="text-slate-600 mb-3">No tickets added yet</p>
          <Button type="button" onClick={onAdd} size="sm">
            Add Your First Ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {ticketing.map((ticket, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Ticket {index + 1}</h4>
                <div className="flex gap-2">
                  {(Number(index) >= 1) && (Number(ticketing.length) === Number(index + 1)) ? (

                    <Button type="button" onClick={onAdd} size="sm" variant="outline" className="hover:bg-slate-50 hover:text-secondary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Ticket
                    </Button>
                  ) : (
                    <span></span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:bg-red-50"
                    onClick={() => onRemove(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Travel Mode */}
                <div className="space-y-2">
                  <Label>Travel Mode *</Label>
                  <Select
                    value={ticket.booking_type?.toString() || ''}
                    onValueChange={(value) => {
                      onChange(index, 'booking_type', parseInt(value));
                      onModeChange(parseInt(value), index);
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

                {/* Class/Sub Option */}
                {/* {ticket.booking_type && subOptions[ticket.booking_type] && ( */}
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={ticket.sub_option?.toString() || ''}
                    onValueChange={(value) => onChange(index, 'sub_option', parseInt(value))}
                    disabled={!ticket.booking_type} // disable until mode selected
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          ticket.booking_type
                            ? "Select class"
                            : "Select travel mode first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ticket.booking_type &&
                        subOptions[ticket.booking_type]?.results?.map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id.toString()}>
                            {opt.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* )}   */}

                {/* Estimated Cost */}
                <div className="space-y-2">
                  <Label>Estimated Cost (₹) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={ticket.estimated_cost}
                    onChange={(e) => onChange(index, 'estimated_cost', e.target.value)}
                    required
                  />
                </div>

                {/* From Location */}
                <div className='space-y-4'>
                  <div className="space-y-2">
                    <Label>From *</Label>
                    <Input
                      value={ticket.from_location}
                      onChange={(e) => onChange(index, 'from_location', e.target.value)}
                      placeholder="e.g., Ahmedabad Airport"
                      required
                    />
                  </div>

                  {/* To Location */}
                  <div className="space-y-2">
                    <Label>To *</Label>
                    <Input
                      value={ticket.to_location}
                      onChange={(e) => onChange(index, 'to_location', e.target.value)}
                      placeholder="e.g., Mumbai Airport"
                      required
                    />
                  </div>
                </div>

                <div className='space-y-4'>
                  {/* Departure Date */}
                  <div className="space-y-2">
                    <Label>Departure Date *</Label>
                    <Input
                      type="date"
                      value={ticket.departure_date}
                      onChange={(e) => onChange(index, 'departure_date', e.target.value)}
                      required
                    />
                  </div>

                  {/* Departure Time */}
                  <div className="space-y-2">
                    <Label>Departure Time *</Label>
                    <Input
                      type="time"
                      value={ticket.departure_time}
                      onChange={(e) => onChange(index, 'departure_time', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Round Trip Fields - Only if trip mode is round-trip */}
                  {tripMode === 'round-trip' && (
                    <>
                      <div className="space-y-2">
                        <Label>Return Date *</Label>
                        <Input
                          type="date"
                          value={ticket.arrival_date || ''}
                          onChange={(e) => onChange(index, 'arrival_date', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Return Time *</Label>
                        <Input
                          type="time"
                          value={ticket.arrival_time || ''}
                          onChange={(e) => onChange(index, 'arrival_time', e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Special Instructions */}
              <div className="space-y-2 col-span-2">
                <Label>Special Instructions</Label>
                <Textarea
                  value={ticket.special_instruction}
                  onChange={(e) => onChange(index, 'special_instruction', e.target.value)}
                  placeholder="e.g., Window seat preference, meal preference..."
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