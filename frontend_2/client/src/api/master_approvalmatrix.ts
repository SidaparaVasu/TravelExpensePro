import { apiClient } from './client';

export const approvalMatrixAPI = {
  // ---- Approval Matrix APIs ----
  approvalMatrix: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/approval-matrix/${id}/`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/approval-matrix/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/approval-matrix/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/approval-matrix/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/approval-matrix/${id}/`);
      return data;
    },
  },
};
