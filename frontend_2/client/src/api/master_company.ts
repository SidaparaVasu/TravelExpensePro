import { apiClient } from './client';

export const organizationMasterAPI = {
  // ---- Company APIs ----
  company: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/companies/${id}`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/companies/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/companies/', payload);
      return data;
    },
    // create: async (payload: any) => {
    //   console.log(payload);
    //   const formData = new FormData();

    //   Object.entries(payload).forEach(([key, value]) => {
    //     if (value !== undefined && value !== null) {
    //       // ✅ Convert non-file values to strings
    //       if (value instanceof File) {
    //         formData.append(key, value);
    //       } else {
    //         formData.append(key, String(value));
    //       }
    //     }
    //   });

    //   const { data } = await apiClient.post('/master/companies/', formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    //   });

    //   return data;
    // },

    // update: async (id: number, payload: any) => {
    //   const formData = new FormData();

    //   Object.entries(payload).forEach(([key, value]) => {
    //     if (value !== undefined && value !== null) {
    //       if (value instanceof File) {
    //         formData.append(key, value);
    //       } else {
    //         formData.append(key, String(value));
    //       }
    //     }
    //   });

    //   const { data } = await apiClient.put(`/master/companies/${id}/`, formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    //   });

    //   return data;
    // },



    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/companies/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/companies/${id}/`);
      return data;
    },
  },

  // ---- Department APIs ----
  department: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/departments/${id}`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/departments/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/departments/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/departments/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/departments/${id}/`);
      return data;
    },
  },

  // ---- Designation APIs ----
  designation: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/designations/${id}`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/designations/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/designations/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/designations/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/designations/${id}/`);
      return data;
    },
  },

  // ---- Employee Type APIs ----
  employeeType: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/employee-type/${id}`);
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/master/employee-type/');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/employee-type/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/employee-type/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/employee-type/${id}/`);
      return data;
    },
  },
};
