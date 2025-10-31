import { apiClient } from './client';
import {
  TravelApplication,
  TravelApplicationRequest,
  TravelStats,
  Location,
  TravelMode,
  TravelSubOption,
  GLCode
} from '@/src/types/travel.types';

/**
 * Helper to normalize axios response shapes.
 * Many endpoints return either:
 *  - { data: <payload> }
 *  - <payload> directly
 *
 * This helper returns payload in either case.
 */
function unwrap(resp: any) {
  if (!resp) return resp;
  if (resp.data !== undefined) return resp.data;
  return resp;
}

export const travelAPI = {
  // Statistics
  getStats: async (): Promise<TravelStats> => {
    const { data } = await apiClient.get('/travel/applications/stats/');
    return unwrap(data);
  },

  // Applications
  getMyApplications: async (): Promise<TravelApplication[]> => {
    const { data } = await apiClient.get('/travel/my-applications/');
    return unwrap(data);
  },

  getApplication: async (id: number): Promise<TravelApplication> => {
    const { data } = await apiClient.get(`/travel/applications/${id}/`);
    return unwrap(data);
  },

  createApplication: async (request: TravelApplicationRequest): Promise<TravelApplication> => {
    const { data } = await apiClient.post('/travel/applications/', request);
    return unwrap(data);
  },

  updateApplication: async (id: number, request: Partial<TravelApplicationRequest>): Promise<TravelApplication> => {
    const { data } = await apiClient.put(`/travel/applications/${id}/`, request);
    return unwrap(data);
  },

  deleteApplication: async (id: number): Promise<void> => {
    await apiClient.delete(`/travel/applications/${id}/`);
  },

  submitApplication: async (id: number) => {
    try {
      const { data } = await apiClient.post(`/travel/applications/${id}/submit/`);
      return unwrap(data);
    } catch (error: any) {
      const responseData = error.response?.data;
      console.error("Server Error Data:", responseData);

      let messages: string[] = [];

      // If DRF-like object with lists for fields
      if (responseData && typeof responseData === "object") {
        for (const key in responseData) {
          const value = responseData[key];
          if (Array.isArray(value)) {
            messages.push(`${key}: ${value.join(", ")}`);
          } else if (typeof value === "object") {
            // nested object (e.g. { field: { validation_error: "..." } })
            for (const subKey in value) {
              const subVal = value[subKey];
              if (Array.isArray(subVal)) {
                messages.push(`${key}.${subKey}: ${subVal.join(", ")}`);
              } else {
                messages.push(`${key}.${subKey}: ${String(subVal)}`);
              }
            }
          } else if (typeof value === "string") {
            messages.push(`${key}: ${value}`);
          } else {
            messages.push(`${key}: ${String(value)}`);
          }
        }
      } else if (typeof responseData === "string") {
        messages.push(responseData);
      }

      if (messages.length === 0) {
        messages.push("Validation error occurred");
      }

      throw new Error(messages.join("\n"));
    }
  },

  validateApplication: async (id: number) => {
    const { data } = await apiClient.post(`/travel/applications/${id}/validate/`);
    return unwrap(data);
  },

  getCostEstimate: async (id: number) => {
    const { data } = await apiClient.get(`/travel/applications/${id}/cost-estimate/`);
    return unwrap(data);
  },

  checkEntitlement: async (subOptionId: number, cityCategoryId: number) => {
    const { data } = await apiClient.post('/travel/bookings/check-entitlement/', {
      sub_option_id: subOptionId,
      city_category_id: cityCategoryId,
    });
    return unwrap(data);
  },

  // Master data
  getLocations: async (): Promise<Location[]> => {
    const { data } = await apiClient.get('/master/locations/');
    return unwrap(data);
  },

  // Travel Mode & Travel Sub-option Master
  getTravelModes: async () => {
    const { data } = await apiClient.get('/master/travel-modes/');
    return unwrap(data);
  },

  getTravelSubOptions: async (modeId?: number) => {
    // If you want to support modeId as a query param later, update URL
    const { data } = await apiClient.get('/master/travel-sub-options/');
    return unwrap(data);
  },

  createTravelModes: async (payload: any) => {
    const { data } = await apiClient.post('/master/travel-modes/', payload);
    return unwrap(data);
  },

  updateTravelModes: async (id: number, payload: any) => {
    const { data } = await apiClient.put(`/master/travel-modes/${id}/`, payload);
    return unwrap(data);
  },

  deleteTravelModes: async (id: number) => {
    const { data } = await apiClient.delete(`/master/travel-modes/${id}/`);
    return unwrap(data);
  },

  toggleTravelModeActive: async (id: number, isActive: boolean) => {
    const { data } = await apiClient.patch(`/master/travel-modes/${id}/`, { is_active: isActive });
    return unwrap(data);
  },

  createTravelSubOption: async (payload: any) => {
    const { data } = await apiClient.post('/master/travel-sub-options/', payload);
    return unwrap(data);
  },

  updateTravelSubOption: async (id: number, payload: any) => {
    const { data } = await apiClient.put(`/master/travel-sub-options/${id}/`, payload);
    return unwrap(data);
  },

  deleteTravelSubOption: async (id: number) => {
    const { data } = await apiClient.delete(`/master/travel-sub-options/${id}/`);
    return unwrap(data);
  },

  toggleSubOptionActive: async (id: number, isActive: boolean) => {
    const { data } = await apiClient.patch(`/master/travel-sub-options/${id}/`, { is_active: isActive });
    return unwrap(data);
  },

  // Guest house endpoints
  getGuestHouses: async () => {
    const response = await apiClient.get('/master/guest-houses/');
    return unwrap(response.data);
  },

  getARCHotels: async () => {
    const response = await apiClient.get('/master/arc-hotels/');
    return unwrap(response.data);
  },

  // GL code endpoints
  getGLCodes: async (): Promise<GLCode[]> => {
    const { data } = await apiClient.get('/master/gl-codes/');
    return unwrap(data);
  },

  createGLCodes: async (payload: any): Promise<GLCode[]> => {
    const { data } = await apiClient.post('/master/gl-codes/', payload);
    return unwrap(data);
  },

  updateGLCodes: async (id: number, payload: any): Promise<GLCode[]> => {
    const { data } = await apiClient.put(`/master/gl-codes/${id}/`, payload);
    return unwrap(data);
  },

  deleteGLCode: async (id: number): Promise<GLCode[]> => {
    const { data } = await apiClient.delete(`/master/gl-codes/${id}/`);
    return unwrap(data);
  },

  // Grade Entitlement
  getGradeEntitlement: async (): Promise<GLCode[]> => {
    const { data } = await apiClient.get('/master/grade-entitlements/');
    return unwrap(data);
  },

  createGradeEntitlement: async (payload: any): Promise<GLCode[]> => {
    const { data } = await apiClient.post('/master/grade-entitlements/', payload);
    return unwrap(data);
  },

  updateGradeEntitlement: async (id: number, payload: any): Promise<GLCode[]> => {
    const { data } = await apiClient.put(`/master/grade-entitlements/${id}/`, payload);
    return unwrap(data);
  },

  deleteGradeEntitlement: async (id: number): Promise<GLCode[]> => {
    const { data } = await apiClient.delete(`/master/grade-entitlements/${id}/`);
    return unwrap(data);
  },
};
