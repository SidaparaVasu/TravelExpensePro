import { TripWithCategories, TicketingBooking, AccommodationBooking, ConveyanceBooking } from "@/src/types/travel.types";

export const getEmptyTrip = (): TripWithCategories => ({
  tripDetails: {
    trip_mode: 'one-way',
    from_location: 0,
    to_location: 0,
    departure_date: '',
    return_date: '',
    trip_purpose: '',
    guest_count: 0
  },
  ticketing: [],
  accommodation: [],
  conveyance: [],
  travelAdvance: {
    air_fare: 0,
    train_fare: 0,
    lodging_fare: 0,
    conveyance_fare: 0,
    other_expenses: 0,
    special_instruction: '',
    total: 0
  }
});

export const getEmptyTicketing = (): TicketingBooking => ({
  from_location: '',
  to_location: '',
  departure_date: '',
  departure_time: '',
  booking_type: '',
  estimated_cost: '',
  special_instruction: ''
});

export const getEmptyAccommodation = (): AccommodationBooking => ({
  accommodation_type: 'company',
  place: '',
  arrival_date: '',
  arrival_time: '',
  departure_date: '',
  departure_time: '',
  booking_type: '',
  estimated_cost: '',
  special_instruction: ''
});

export const getEmptyConveyance = (): ConveyanceBooking => ({
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