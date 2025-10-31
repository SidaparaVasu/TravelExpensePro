import { TravelApplicationRequest } from '@/src/types/travel.types';

interface BuildPayloadParams {
  tripDetails: any;
  ticketing: any[];
  accommodation: any[];
  conveyance: any[];
  travelAdvance: any;
}

/**
 * Builds a properly formatted payload for the Create Travel Application API.
 * Ensures all numeric and date fields are properly formatted.
 */
export function buildTravelApplicationPayload({
  tripDetails,
  ticketing,
  accommodation,
  conveyance,
  travelAdvance,
}: BuildPayloadParams): TravelApplicationRequest {
  // safely cast IDs and numbers
  const sanitizeNumber = (val: any) => (val !== null && val !== undefined && val !== '' ? Number(val) : null);

  const cleanTicketing = ticketing.map((item) => ({
    ...item,
    from_location: sanitizeNumber(item.from_location),
    to_location: sanitizeNumber(item.to_location),
    estimated_cost: sanitizeNumber(item.estimated_cost),
  }));

  const cleanAccommodation = accommodation.map((item) => ({
    ...item,
    guest_house_id: sanitizeNumber(item.guest_house_id),
    estimated_cost: sanitizeNumber(item.estimated_cost),
  }));

  const cleanConveyance = conveyance.map((item) => ({
    ...item,
    estimated_cost: sanitizeNumber(item.estimated_cost),
  }));

  const cleanAdvance = travelAdvance
    ? {
        air_fare: sanitizeNumber(travelAdvance.air_fare),
        train_fare: sanitizeNumber(travelAdvance.train_fare),
        lodging_fare: sanitizeNumber(travelAdvance.lodging_fare),
        conveyance_fare: sanitizeNumber(travelAdvance.conveyance_fare),
        total_estimated_cost: sanitizeNumber(travelAdvance.total_estimated_cost),
      }
    : null;

  return {
    trip_details: {
      trip_mode: tripDetails.trip_mode,
      from_location: sanitizeNumber(tripDetails.from_location),
      to_location: sanitizeNumber(tripDetails.to_location),
      departure_date: tripDetails.departure_date,
      return_date: tripDetails.return_date || null,
      trip_purpose: tripDetails.trip_purpose,
      guest_count: sanitizeNumber(tripDetails.guest_count) || 0,
      gl_code: sanitizeNumber(tripDetails.gl_code),
      io: tripDetails.io || '',
      ticketing: cleanTicketing,
      accommodation: cleanAccommodation,
      conveyance: cleanConveyance,
      travel_advance: cleanAdvance,
    },
  };
}
