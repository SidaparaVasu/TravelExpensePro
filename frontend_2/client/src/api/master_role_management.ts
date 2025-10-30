import { apiClient } from './client';

export const roleManagementAPI = {
  // ---- Role APIs ----
  role: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/roles/${id}/`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/roles/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/roles/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/roles/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/roles/${id}/`);
      return data;
    },
  },

  // ---- Permission APIs ----
  permission: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/permissions/${id}/`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/permissions/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/permissions/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/permissions/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/permissions/${id}/`);
      return data;
    },
  },

    // ---- User Role Assignment ----
  userRole: {
    assign: async (payload: any) => {
      const { data } = await apiClient.post('/master/user-roles/assign/', payload);
      return data;
    },
  },

};
