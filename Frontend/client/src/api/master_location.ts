import { apiClient } from './client';

export const locationAPI = {
  // =======================
  // Country APIs
  // =======================
  getCountries: () => apiClient.get('/master/countries/'),
  createCountry: (data: { country_name: string; country_code?: string }) =>
    apiClient.post('/master/countries/', data),
  updateCountry: (id: number, data: { country_name: string; country_code?: string }) =>
    apiClient.put(`/master/countries/${id}/`, data),
  deleteCountry: (id: number) => apiClient.delete(`/master/countries/${id}/`),

  // =======================
  // State APIs
  // =======================
  getStatesWithoutCountry: () =>
    apiClient.get('/master/states/'),
  getStates: (countryId: number) =>
    apiClient.get('/master/states/', { params: { country: countryId } }),
  fetchAllStates: () => apiClient.get('/master/states/'),
  createState: (data: { state_name: string; state_code?: string; country: number }) =>
    apiClient.post('/master/states/', data),
  updateState: (id: number, data: { state_name: string; state_code?: string; country: number }) =>
    apiClient.put(`/master/states/${id}/`, data),
  deleteState: (id: number) => apiClient.delete(`/master/states/${id}/`),

  // =======================
  // City APIs
  // =======================
  getCities: (countryId?: number, stateId?: number) =>
    apiClient.get('/master/cities/', { params: { country: countryId, state: stateId } }),
  getAllCities: async () => {
    const response = await apiClient.get('/master/cities/');
    return response.data;
  },
  createCity: (data: { city_name: string; state: number; category?: number }) =>
    apiClient.post('/master/cities/', data),
  updateCity: (id: number, data: { city_name?: string; state?: number; category?: number }) =>
    apiClient.put(`/master/cities/${id}/`, data),
  deleteCity: (id: number) => apiClient.delete(`/master/cities/${id}/`),

  // =======================
  // City Category APIs
  // =======================
  getCityCategories: () => apiClient.get('/master/city-categories/'),
  createCityCategory: (data: { name: string; description?: string }) =>
    apiClient.post('/master/city-categories/', data),
  updateCityCategoryForCity: (id: number, data: { name: string; description?: string }) =>
    apiClient.put(`/master/city-categories/${id}/`, data),
  deleteCityCategory: (id: number) => apiClient.delete(`/master/city-categories/${id}/`),

  // =======================
  // Update category for city inline
  // =======================
  updateCityCategoryMaster: (cityId: number, categoryId: number | null) =>
    apiClient.patch(`/master/cities/${cityId}/`, { category: categoryId }),


  // =======================
  // Location API Endpoints
  // =======================
  location: {
    get: async (id: number) => {
      const { data } = await apiClient.get(`/master/locations/${id}/`);
      return data;
    },
    getAll: async (params?: any) => {
      const { data } = await apiClient.get('/master/locations/', { params });
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/master/locations/', payload);
      return data;
    },
    update: async (id: number, payload: any) => {
      const { data } = await apiClient.put(`/master/locations/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      const { data } = await apiClient.delete(`/master/locations/${id}/`);
      return data;
    },
  },
};

