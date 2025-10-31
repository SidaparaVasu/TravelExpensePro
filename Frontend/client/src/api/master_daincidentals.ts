import { apiClient } from './client';

export const daIncidentalAPI = {
  daIncidental: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/da-incidental/${id}/`);
      return data;
    },
    getAll: async (params?: any) => {
      const { data } = await apiClient.get('/master/da-incidental/', { params });
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/da-incidental/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/da-incidental/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/da-incidental/${id}/`);
      return data;
    },
  },
};