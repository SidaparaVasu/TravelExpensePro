import { FileText, MapPin, Plane, Hotel, Car, DollarSign, Edit2, Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { TripWithCategories } from '@/src/types/travel.types';

interface ReviewPageProps {
  formData: any;
  trips: TripWithCategories[];
  glCodes: any;
  locations: any;
  travelModes: any;
  guestHouses: any;
  arcHotels: any;
  onEdit: (tab: string, tripIndex?: number, category?: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function ReviewPage({
  formData,
  trips,
  glCodes,
  locations,
  travelModes,
  guestHouses,
  arcHotels,
  onEdit,
  onSubmit,
  isLoading
}: ReviewPageProps) {

  const getLocationName = (id: number) => {
    const loc = locations?.results?.find((l: any) => l.location_id === id);
    return loc ? `${loc.location_name} (${loc.city_name})` : 'N/A';
  };

  const getModeName = (id: number) => {
    const mode = travelModes?.results?.find((m: any) => m.id === id);
    return mode?.name || 'N/A';
  };

  const getGLCode = (id: string) => {
    const gl = glCodes?.results?.find((g: any) => g.id.toString() === id);
    return gl ? `${gl.gl_code} - ${gl.vertical_name}` : 'N/A';
  };

  const getGuestHouseName = (id?: number) => {
    if (!id) return 'Company Guest House (default)';
    const gh = guestHouses?.results?.find((g: any) => g.id === id);
    return gh ? `${gh.name} - ${gh.location || gh.city}` : 'N/A';
  };

  const getTotalEstimatedCost = () => {
    return trips.reduce((total, trip) => {
      const ticketingTotal = trip.ticketing.reduce((sum, t) => sum + Number(t.estimated_cost || 0), 0);
      const accommodationTotal = trip.accommodation.reduce((sum, a) => sum + Number(a.estimated_cost || 0), 0);
      const conveyanceTotal = trip.conveyance.reduce((sum, c) => sum + Number(c.estimated_cost || 0), 0);
      return total + ticketingTotal + accommodationTotal + conveyanceTotal;
    }, 0);
  };

  const getTotalAdvanceRequested = () => {
    return trips.reduce((total, trip) => total + trip.travelAdvance.total, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-slate-800">Review Your Application</h2>
      </div>

      {/* Basic Information */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-slate-800">Basic Information</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit('basic')}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Purpose of Travel</p>
              <p className="font-medium text-slate-800 mt-1">{formData.purpose || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Internal Order</p>
              <p className="font-medium text-slate-800 mt-1">{formData.internal_order || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">GL Code</p>
              <p className="font-medium text-slate-800 mt-1">{getGLCode(formData.general_ledger)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Sanction Number</p>
              <p className="font-medium text-slate-800 mt-1">{formData.sanction_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Advance Amount</p>
              <p className="font-medium text-slate-800 mt-1">₹{formData.advance_amount?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trips */}
      {/* Trips */}
      {trips.length === 1 ? (
        // Single trip - no accordion needed
        trips.map((trip, tripIndex) => (
          <div key={tripIndex} className="bg-white border rounded-lg overflow-hidden">
            {/* KEEP ALL EXISTING SINGLE TRIP CONTENT */}
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">
                  Trip {tripIndex + 1}: {getLocationName(trip.tripDetails.from_location)} → {getLocationName(trip.tripDetails.to_location)}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit('trips', tripIndex)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>

            {/* Trip Details */}
            <div className="p-6 border-b bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Departure Date</p>
                  <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.departure_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Return Date</p>
                  <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.return_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Guest Count</p>
                  <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.guest_count || 0}</p>
                </div>
                {trip.tripDetails.trip_purpose && (
                  <div className="md:col-span-3">
                    <p className="text-sm text-slate-600">Trip Purpose</p>
                    <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.trip_purpose}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ticketing */}
            {trip.ticketing.length > 0 && (
              <div className="p-6 border-b">
                <div className="flex items-center gap-2 mb-4">
                  <Plane className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-800">Ticketing ({trip.ticketing.length})</h4>
                </div>
                <div className="space-y-3">
                  {trip.ticketing.map((ticket, idx) => (
                    <div key={idx} className="bg-slate-50 rounded p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Mode: </span>
                          <span className="font-medium">{getModeName(ticket.booking_type)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Route: </span>
                          <span className="font-medium">{ticket.from_location} → {ticket.to_location}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Departure: </span>
                          <span className="font-medium">{ticket.departure_date} {ticket.departure_time}</span>
                        </div>
                        {ticket.arrival_date && (
                          <div>
                            <span className="text-slate-600">Return: </span>
                            <span className="font-medium">{ticket.arrival_date} {ticket.arrival_time}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-600">Cost: </span>
                          <span className="font-semibold text-green-700">₹{Number(ticket.estimated_cost).toLocaleString('en-IN')}</span>
                        </div>
                        {ticket.special_instruction && (
                          <div className="md:col-span-2">
                            <span className="text-slate-600">Instructions: </span>
                            <span className="font-medium">{ticket.special_instruction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodation */}
            {trip.accommodation.length > 0 && (
              <div className="p-6 border-b">
                <div className="flex items-center gap-2 mb-4">
                  <Hotel className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-800">Accommodation ({trip.accommodation.length})</h4>
                </div>
                <div className="space-y-3">
                  {trip.accommodation.map((acc, idx) => (
                    <div key={idx} className="bg-slate-50 rounded p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Type: </span>
                          <span className="font-medium capitalize">{acc.accommodation_type}</span>
                        </div>
                        {acc.accommodation_type === 'company' ? (
                          <div>
                            <span className="text-slate-600">Guest House: </span>
                            <span className="font-medium">{getGuestHouseName(acc.guest_house_id)}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-600">Hotel: </span>
                            <span className="font-medium">{acc.hotel_name || 'N/A'}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-600">Place: </span>
                          <span className="font-medium">{acc.place}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Check-in: </span>
                          <span className="font-medium">{acc.arrival_date} {acc.arrival_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Check-out: </span>
                          <span className="font-medium">{acc.departure_date} {acc.departure_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Cost: </span>
                          <span className="font-semibold text-green-700">₹{Number(acc.estimated_cost).toLocaleString('en-IN')}</span>
                        </div>
                        {acc.special_instruction && (
                          <div className="md:col-span-2">
                            <span className="text-slate-600">Instructions: </span>
                            <span className="font-medium">{acc.special_instruction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conveyance */}
            {trip.conveyance.length > 0 && (
              <div className="p-6 border-b">
                <div className="flex items-center gap-2 mb-4">
                  <Car className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-slate-800">Conveyance ({trip.conveyance.length})</h4>
                </div>
                <div className="space-y-3">
                  {trip.conveyance.map((conv, idx) => (
                    <div key={idx} className="bg-slate-50 rounded p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Vehicle: </span>
                          <span className="font-medium">{conv.vehicle_type}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Route: </span>
                          <span className="font-medium">{conv.from_location} → {conv.to_location}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Start: </span>
                          <span className="font-medium">{conv.start_date} {conv.start_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">End: </span>
                          <span className="font-medium">{conv.end_date} {conv.end_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Drop: </span>
                          <span className="font-medium">{conv.drop_location}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Cost: </span>
                          <span className="font-semibold text-green-700">₹{Number(conv.estimated_cost).toLocaleString('en-IN')}</span>
                        </div>
                        {conv.special_instruction && (
                          <div className="md:col-span-2">
                            <span className="text-slate-600">Instructions: </span>
                            <span className="font-medium">{conv.special_instruction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Advance */}
            {trip.travelAdvance.total > 0 && (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-slate-800">Travel Advance Request</h4>
                </div>
                <div className="bg-slate-50 rounded p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {trip.travelAdvance.air_fare > 0 && (
                      <div>
                        <span className="text-slate-600">Air Fare: </span>
                        <span className="font-medium">₹{trip.travelAdvance.air_fare.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {trip.travelAdvance.train_fare > 0 && (
                      <div>
                        <span className="text-slate-600">Train Fare: </span>
                        <span className="font-medium">₹{trip.travelAdvance.train_fare.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {trip.travelAdvance.lodging_fare > 0 && (
                      <div>
                        <span className="text-slate-600">Lodging: </span>
                        <span className="font-medium">₹{trip.travelAdvance.lodging_fare.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {trip.travelAdvance.conveyance_fare > 0 && (
                      <div>
                        <span className="text-slate-600">Conveyance: </span>
                        <span className="font-medium">₹{trip.travelAdvance.conveyance_fare.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {trip.travelAdvance.other_expenses > 0 && (
                      <div>
                        <span className="text-slate-600">Other: </span>
                        <span className="font-medium">₹{trip.travelAdvance.other_expenses.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="md:col-span-3 pt-2 border-t border-slate-300">
                      <span className="text-slate-600 font-semibold">Total: </span>
                      <span className="font-bold text-green-700 text-lg">₹{trip.travelAdvance.total.toLocaleString('en-IN')}</span>
                    </div>
                    {trip.travelAdvance.special_instruction && (
                      <div className="md:col-span-3 pt-2">
                        <span className="text-slate-600">Instructions: </span>
                        <span className="font-medium">{trip.travelAdvance.special_instruction}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        // Multiple trips - use accordion
        <Accordion type="single" collapsible className="space-y-4">
          {trips.map((trip, tripIndex) => (
            <AccordionItem key={tripIndex} value={`trip-${tripIndex}`} className="bg-white border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline bg-slate-50">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800">
                      Trip {tripIndex + 1}: {getLocationName(trip.tripDetails.from_location)} → {getLocationName(trip.tripDetails.to_location)}
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit('trips', tripIndex);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                {/* Trip Details */}
                <div className="p-6 border-b bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Departure Date</p>
                      <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.departure_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Return Date</p>
                      <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.return_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Guest Count</p>
                      <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.guest_count || 0}</p>
                    </div>
                    {trip.tripDetails.trip_purpose && (
                      <div className="md:col-span-3">
                        <p className="text-sm text-slate-600">Trip Purpose</p>
                        <p className="font-medium text-slate-800 mt-1">{trip.tripDetails.trip_purpose}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticketing */}
                {trip.ticketing.length > 0 && (
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2 mb-4">
                      <Plane className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-slate-800">Ticketing ({trip.ticketing.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {trip.ticketing.map((ticket, idx) => (
                        <div key={idx} className="bg-slate-50 rounded p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Mode: </span>
                              <span className="font-medium">{getModeName(ticket.booking_type)}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Route: </span>
                              <span className="font-medium">{ticket.from_location} → {ticket.to_location}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Departure: </span>
                              <span className="font-medium">{ticket.departure_date} {ticket.departure_time}</span>
                            </div>
                            {ticket.arrival_date && (
                              <div>
                                <span className="text-slate-600">Return: </span>
                                <span className="font-medium">{ticket.arrival_date} {ticket.arrival_time}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-600">Cost: </span>
                              <span className="font-semibold text-green-700">₹{Number(ticket.estimated_cost).toLocaleString('en-IN')}</span>
                            </div>
                            {ticket.special_instruction && (
                              <div className="md:col-span-2">
                                <span className="text-slate-600">Instructions: </span>
                                <span className="font-medium">{ticket.special_instruction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accommodation */}
                {trip.accommodation.length > 0 && (
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2 mb-4">
                      <Hotel className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-slate-800">Accommodation ({trip.accommodation.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {trip.accommodation.map((acc, idx) => (
                        <div key={idx} className="bg-slate-50 rounded p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Type: </span>
                              <span className="font-medium capitalize">{acc.accommodation_type}</span>
                            </div>
                            {acc.accommodation_type === 'company' ? (
                              <div>
                                <span className="text-slate-600">Guest House: </span>
                                <span className="font-medium">{getGuestHouseName(acc.guest_house_id)}</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-slate-600">Hotel: </span>
                                <span className="font-medium">{acc.hotel_name || 'N/A'}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-600">Place: </span>
                              <span className="font-medium">{acc.place}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Check-in: </span>
                              <span className="font-medium">{acc.arrival_date} {acc.arrival_time}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Check-out: </span>
                              <span className="font-medium">{acc.departure_date} {acc.departure_time}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Cost: </span>
                              <span className="font-semibold text-green-700">₹{Number(acc.estimated_cost).toLocaleString('en-IN')}</span>
                            </div>
                            {acc.special_instruction && (
                              <div className="md:col-span-2">
                                <span className="text-slate-600">Instructions: </span>
                                <span className="font-medium">{acc.special_instruction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conveyance */}
                {trip.conveyance.length > 0 && (
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-slate-800">Conveyance ({trip.conveyance.length})</h4>
                    </div>
                    <div className="space-y-3">
                      {trip.conveyance.map((conv, idx) => (
                        <div key={idx} className="bg-slate-50 rounded p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-600">Vehicle: </span>
                              <span className="font-medium">{conv.vehicle_type}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Route: </span>
                              <span className="font-medium">{conv.from_location} → {conv.to_location}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Start: </span>
                              <span className="font-medium">{conv.start_date} {conv.start_time}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">End: </span>
                              <span className="font-medium">{conv.end_date} {conv.end_time}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Drop: </span>
                              <span className="font-medium">{conv.drop_location}</span>
                            </div>
                            <div>
                              <span className="text-slate-600">Cost: </span>
                              <span className="font-semibold text-green-700">₹{Number(conv.estimated_cost).toLocaleString('en-IN')}</span>
                            </div>
                            {conv.special_instruction && (
                              <div className="md:col-span-2">
                                <span className="text-slate-600">Instructions: </span>
                                <span className="font-medium">{conv.special_instruction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel Advance */}
                {trip.travelAdvance.total > 0 && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-slate-800">Travel Advance Request</h4>
                    </div>
                    <div className="bg-slate-50 rounded p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {trip.travelAdvance.air_fare > 0 && (
                          <div>
                            <span className="text-slate-600">Air Fare: </span>
                            <span className="font-medium">₹{trip.travelAdvance.air_fare.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {trip.travelAdvance.train_fare > 0 && (
                          <div>
                            <span className="text-slate-600">Train Fare: </span>
                            <span className="font-medium">₹{trip.travelAdvance.train_fare.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {trip.travelAdvance.lodging_fare > 0 && (
                          <div>
                            <span className="text-slate-600">Lodging: </span>
                            <span className="font-medium">₹{trip.travelAdvance.lodging_fare.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {trip.travelAdvance.conveyance_fare > 0 && (
                          <div>
                            <span className="text-slate-600">Conveyance: </span>
                            <span className="font-medium">₹{trip.travelAdvance.conveyance_fare.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {trip.travelAdvance.other_expenses > 0 && (
                          <div>
                            <span className="text-slate-600">Other: </span>
                            <span className="font-medium">₹{trip.travelAdvance.other_expenses.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="md:col-span-3 pt-2 border-t border-slate-300">
                          <span className="text-slate-600 font-semibold">Total: </span>
                          <span className="font-bold text-green-700 text-lg">₹{trip.travelAdvance.total.toLocaleString('en-IN')}</span>
                        </div>
                        {trip.travelAdvance.special_instruction && (
                          <div className="md:col-span-3 pt-2">
                            <span className="text-slate-600">Instructions: </span>
                            <span className="font-medium">{trip.travelAdvance.special_instruction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Estimated Cost</p>
            <p className="text-2xl font-bold text-slate-800">₹{getTotalEstimatedCost().toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Advance Requested</p>
            <p className="text-2xl font-bold text-green-700">₹{getTotalAdvanceRequested().toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Trips</p>
            <p className="text-2xl font-bold text-primary">{trips.length}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit('trips', trips.length - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-primary hover:bg-primary"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>
    </div>
  );
}