import { apiClient } from './client';

export const masterAPI = {
  // Get travel modes with sub-options
  getTravelModes: async () => {
    const { data } = await apiClient.get('/master/travel-modes/');
    return data;
  },

  // Get locations
  getLocations: async () => {
    const { data } = await apiClient.get('/master/locations/');
    return data;
  },

  // Get GL codes
  getGLCodes: async () => {
    const { data } = await apiClient.get('/master/gl-codes/');  // Need to add this endpoint
    return data;
  },

  // Get grades
  getGrades: async () => {
    const { data } = await apiClient.get('/master/grades/');
    return data;
  },
};