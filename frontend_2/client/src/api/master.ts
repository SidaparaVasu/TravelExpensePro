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

  // Grade Master APIs
  getGrades: async () => {
    const { data } = await apiClient.get('/master/grades/');
    return data;
  },
  createGrade: async (payload) => {
    const { data } = await apiClient.post('/master/grades/', payload);
    return data;
  },
  updateGrade: async (id, payload) => {
    const { data } = await apiClient.put(`/master/grades/${id}/`, payload);
    return data;
  },
  deleteGrade: async (id) => {
    const { data } = await apiClient.delete(`/master/grades/${id}/`);
    return data;
  },
};