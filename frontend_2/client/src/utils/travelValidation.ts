import { TripWithCategories } from '@/src/types/travel.types';

export interface ValidationError {
  field: string;
  message: string;
  category?: 'accommodation' | 'ticketing' | 'conveyance';
  tripIndex?: number;
  bookingIndex?: number;
}

export function validateTravelApplication(
  formData: any,
  trips: TripWithCategories[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Basic Info Validation
  if (!formData.purpose?.trim()) {
    errors.push({ field: 'purpose', message: 'Purpose of travel is required' });
  }
  if (!formData.internal_order?.trim()) {
    errors.push({ field: 'internal_order', message: 'Internal Order is required' });
  }
  if (!formData.general_ledger) {
    errors.push({ field: 'general_ledger', message: 'GL Code is required' });
  }
  if (!formData.sanction_number?.trim()) {
    errors.push({ field: 'sanction_number', message: 'Sanction Number is required' });
  }

  // Trip Validations
  if (trips.length === 0) {
    errors.push({ field: 'trips', message: 'At least one trip is required' });
    return errors;
  }

  trips.forEach((trip, tripIndex) => {
    const td = trip.tripDetails;

    // Trip Details Validation
    if (!td.from_location) {
      errors.push({ field: 'from_location', message: 'From location is required', tripIndex });
    }
    if (!td.to_location) {
      errors.push({ field: 'to_location', message: 'To location is required', tripIndex });
    }
    if (td.from_location === td.to_location) {
      errors.push({ field: 'to_location', message: 'From and To locations cannot be same', tripIndex });
    }
    if (!td.departure_date) {
      errors.push({ field: 'departure_date', message: 'Departure date is required', tripIndex });
    }
    if (td.trip_mode === 'round-trip' && !td.return_date) {
      errors.push({ field: 'return_date', message: 'Return date is required for round trip', tripIndex });
    }
    if (td.trip_mode === 'round-trip' && td.return_date && td.departure_date) {
      if (new Date(td.return_date) < new Date(td.departure_date)) {
        errors.push({ field: 'return_date', message: 'Return date cannot be before departure date', tripIndex });
      }
    }

    // Ticketing Validation
    trip.ticketing.forEach((ticket, bookingIndex) => {
      if (!ticket.booking_type) {
        errors.push({ field: 'booking_type', message: 'Travel mode is required', tripIndex, bookingIndex });
      }
      if (!ticket.from_location?.trim()) {
        errors.push({ field: 'from_location', message: 'From location is required', tripIndex, bookingIndex });
      }
      if (!ticket.to_location?.trim()) {
        errors.push({ field: 'to_location', message: 'To location is required', tripIndex, bookingIndex });
      }
      if (!ticket.departure_date) {
        errors.push({ field: 'departure_date', message: 'Departure date is required', tripIndex, bookingIndex });
      }
      if (!ticket.departure_time) {
        errors.push({ field: 'departure_time', message: 'Departure time is required', tripIndex, bookingIndex });
      }
      if (!ticket.estimated_cost || Number(ticket.estimated_cost) <= 0) {
        errors.push({ field: 'estimated_cost', message: 'Valid estimated cost is required', tripIndex, bookingIndex });
      }
      if (td.trip_mode === 'round-trip') {
        if (!ticket.arrival_date) {
          errors.push({ field: 'arrival_date', message: 'Return date is required for round trip', tripIndex, bookingIndex });
        }
        if (!ticket.arrival_time) {
          errors.push({ field: 'arrival_time', message: 'Return time is required for round trip', tripIndex, bookingIndex });
        }
      }
    });

    // Accommodation Validation
    trip.accommodation.forEach((acc, bookingIndex) => {
      if (!acc.booking_type) {
        errors.push({ field: 'booking_type', message: 'Accommodation type is required', category: 'accommodation', tripIndex, bookingIndex });
      }
      if (acc.accommodation_type === 'self' && !acc.hotel_name?.trim()) {
        errors.push({ field: 'hotel_name', message: 'Hotel name is required', tripIndex, bookingIndex });
      }
      if (!acc.place?.trim()) {
        errors.push({ field: 'place', message: 'Place/Location is required', tripIndex, bookingIndex });
      }
      if (!acc.arrival_date) {
        errors.push({ field: 'arrival_date', message: 'Arrival date is required', tripIndex, bookingIndex });
      }
      if (!acc.arrival_time) {
        errors.push({ field: 'arrival_time', message: 'Arrival time is required', tripIndex, bookingIndex });
      }
      if (!acc.departure_date) {
        errors.push({ field: 'departure_date', message: 'Departure date is required', tripIndex, bookingIndex });
      }
      if (!acc.departure_time) {
        errors.push({ field: 'departure_time', message: 'Departure time is required', tripIndex, bookingIndex });
      }
      if (!acc.estimated_cost || Number(acc.estimated_cost) <= 0) {
        errors.push({ field: 'estimated_cost', message: 'Valid estimated cost is required', tripIndex, bookingIndex });
      }
      if (acc.arrival_date && acc.departure_date) {
        if (new Date(acc.departure_date) < new Date(acc.arrival_date)) {
          errors.push({ field: 'departure_date', message: 'Departure date cannot be before arrival date', tripIndex, bookingIndex });
        }
      }
    });

    // Conveyance Validation
    trip.conveyance.forEach((conv, bookingIndex) => {
      if (!conv.booking_type) {
        errors.push({ field: 'booking_type', message: 'Vehicle type is required', tripIndex, bookingIndex });
      }
      if (!conv.from_location?.trim()) {
        errors.push({ field: 'from_location', message: 'From location is required', tripIndex, bookingIndex });
      }
      if (!conv.to_location?.trim()) {
        errors.push({ field: 'to_location', message: 'To location is required', tripIndex, bookingIndex });
      }
      if (!conv.start_date) {
        errors.push({ field: 'start_date', message: 'Start date is required', tripIndex, bookingIndex });
      }
      if (!conv.start_time) {
        errors.push({ field: 'start_time', message: 'Start time is required', tripIndex, bookingIndex });
      }
      if (!conv.end_date) {
        errors.push({ field: 'end_date', message: 'End date is required', tripIndex, bookingIndex });
      }
      if (!conv.end_time) {
        errors.push({ field: 'end_time', message: 'End time is required', tripIndex, bookingIndex });
      }
      if (!conv.drop_location?.trim()) {
        errors.push({ field: 'drop_location', message: 'Drop location is required', tripIndex, bookingIndex });
      }
      if (!conv.estimated_cost || Number(conv.estimated_cost) <= 0) {
        errors.push({ field: 'estimated_cost', message: 'Valid estimated cost is required', tripIndex, bookingIndex });
      }
      if (conv.start_date && conv.end_date && conv.start_time && conv.end_time) {
        const startDateTime = new Date(`${conv.start_date}T${conv.start_time}`);
        const endDateTime = new Date(`${conv.end_date}T${conv.end_time}`);
        if (endDateTime <= startDateTime) {
          errors.push({ field: 'end_date', message: 'End date/time must be after start date/time', tripIndex, bookingIndex });
        }
      }
    });
  });

  return errors;
}