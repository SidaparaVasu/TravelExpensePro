import { apiClient } from './client';

export const conveyanceRateAPI = {
  conveyanceRate: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/conveyance-rates/${id}/`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/conveyance-rates/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/conveyance-rates/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/conveyance-rates/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/conveyance-rates/${id}/`);
      return data;
    },
  },
};