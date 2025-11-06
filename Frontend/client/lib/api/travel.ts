import { apiClient } from '@/src/api/client';

export interface TripDetail {
  from_location: number;
  to_location: number;
  departure_date: string;
  return_date: string;
  trip_purpose: string;
  guest_count: number;
  bookings: Booking[];
}

export interface Booking {
  booking_type: number;
  sub_option?: number;
  estimated_cost: string;
  booking_details: Record<string, any>;
}

export interface TravelApplicationRequest {
  purpose: string;
  internal_order: string;
  general_ledger: number;
  sanction_number: string;
  advance_amount: string;
  trip_details: TripDetail[];
}

export interface TravelApplication {
  id: number;
  employee_name: string;
  employee_grade: string;
  purpose: string;
  internal_order: string;
  estimated_total_cost: string;
  status: string;
  travel_request_id: string;
  total_duration_days: number;
  created_at: string;
  submitted_at: string;
  trip_details: Array<{
    id: number;
    from_location_name: string;
    to_location_name: string;
    departure_date: string;
    return_date: string;
    duration_days: number;
    city_category: string;
  }>;
}

export const travelAPI = {
  // Get my applications
  getMyApplications: async (): Promise<TravelApplication[]> => {
    const { data } = await apiClient.get('/travel/my-applications/');
    return data.recent_applications;
  },

  // Get statistics
  getStats: async () => {
    const { data } = await apiClient.get('/travel/applications/stats/');
    return data;
  },

  // Create application
  createApplication: async (request: TravelApplicationRequest): Promise<TravelApplication> => {
    const { data } = await apiClient.post('/travel/applications/', request);
    return data;
  },

  // Get application by ID
  getApplication: async (id: number): Promise<TravelApplication> => {
    const { data } = await apiClient.get(`/travel/applications/${id}/`);
    return data;
  },

  // Update application
  updateApplication: async (id: number, request: Partial<TravelApplicationRequest>): Promise<TravelApplication> => {
    const { data } = await apiClient.put(`/travel/applications/${id}/`, request);
    return data;
  },

  // Submit for approval
  submitApplication: async (id: number) => {
    const { data } = await apiClient.post(`/travel/applications/${id}/submit/`);
    return data;
  },

  // Validate before submission
  validateApplication: async (id: number) => {
    const { data } = await apiClient.post(`/travel/applications/${id}/validate/`);
    return data;
  },

  // Get cost estimate
  getCostEstimate: async (id: number) => {
    const { data } = await apiClient.get(`/travel/applications/${id}/cost-estimate/`);
    return data;
  },
};