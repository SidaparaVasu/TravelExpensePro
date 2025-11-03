import { apiClient } from './client';

export const accommodationAPI = {
    // ---- Guest House APIs ----
    guestHouse: {
        get: async (id: number) => {
            const { data } = await apiClient.get(`/master/guest-houses/${id}/`);
            return data;
        },
        // getAll: async () => {
        //     const { data } = await apiClient.get('/master/guest-houses/');
        //     return data;
        // },
        getAll: (search = '') => {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            return apiClient.get(`/master/guest-houses/${params}`);
        },
        create: async (payload: any) => {
            const { data } = await apiClient.post('/master/guest-houses/', payload);
            return data;
        },
        update: async (id: number, payload: any) => {
            const { data } = await apiClient.put(`/master/guest-houses/${id}/`, payload);
            return data;
        },
        // delete: async (id: number) => {
        //     const { data } = await apiClient.delete(`/master/guest-houses/${id}/`);
        //     return data;
        // },
        toggleActive: (id, isActive) => {
            if (isActive) {
                return apiClient.post(`/master/guest-houses/${id}/activate/`);
            } else {
                return apiClient.delete(`/master/guest-houses/${id}/`);
            }
        },
        delete: (id) => apiClient.delete(`/master/guest-houses/${id}/`, { params: { hard_delete: true } }),

        // getAll: (search = '', filters = {}) => {
        //     const params = new URLSearchParams();
        //     if (search) params.append('search', search);
        //     Object.keys(filters).forEach(key => {
        //         if (filters[key]) params.append(key, filters[key]);
        //     });
        //     return apiClient.get(`/guest-houses/?${params.toString()}`);
        // },
    },
};
