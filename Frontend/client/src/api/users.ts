import { apiClient } from './client';

// export const userAPI = {
//     getAll: async () => {
//       const { data } = await apiClient.get('/users/');
//       return data;
//     },
// }
export const userAPI = {
    getAll: async (query = '') => {
        const { data } = await apiClient.get(`/users/${query}`);
        return data;
    },
};