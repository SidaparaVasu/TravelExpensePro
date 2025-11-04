import { apiClient } from './client';

export const locationSpocAPI = {
    // Get single Location SPOC by ID
    get: async (id: number) => {
        const { data } = await apiClient.get(`/master/location-spoc/${id}/`);
        return data;
    },

    // Get all Location SPOCs with optional filters
    getAll: async (filters?: { location?: string; spoc_type?: string; search?: string }) => {
        let params = '';
        const queryParams: string[] = [];

        if (filters?.location) {
            queryParams.push(`location=${encodeURIComponent(filters.location)}`);
        }
        if (filters?.spoc_type) {
            queryParams.push(`spoc_type=${encodeURIComponent(filters.spoc_type)}`);
        }
        if (filters?.search) {
            queryParams.push(`search=${encodeURIComponent(filters.search)}`);
        }

        if (queryParams.length > 0) {
            params = `?${queryParams.join('&')}`;
        }
        
        const { data } = await apiClient.get(`/master/location-spoc/${params}`);
        return data;
    },

    // Create new Location SPOC
    create: async (payload: {
        location: number;
        spoc_user: number;
        spoc_type: string;
        phone_number: string;
        email: string;
        backup_spoc?: number | null;
        is_active: boolean;
    }) => {
        const { data } = await apiClient.post('/master/location-spoc/', payload);
        return data;
    },

    // Update existing Location SPOC
    update: async (id: number, payload: {
        location: number;
        spoc_user: number;
        spoc_type: string;
        phone_number: string;
        email: string;
        backup_spoc?: number | null;
        is_active: boolean;
    }) => {
        const { data } = await apiClient.put(`/master/location-spoc/${id}/`, payload);
        return data;
    },

    // Soft delete (deactivate) or activate Location SPOC
    toggleActive: (id: number, isActive: boolean) => {
        if (isActive) {
            // Activate the SPOC
            return apiClient.patch(`/master/location-spoc/${id}/`, { is_active: true });
        } else {
            // Deactivate the SPOC (soft delete)
            return apiClient.delete(`/master/location-spoc/${id}/`);
        }
    },

    // Hard delete Location SPOC permanently
    delete: (id: number) => 
        apiClient.delete(`/master/location-spoc/${id}/`, { params: { hard_delete: true } }),

    // Get users filtered by location (for SPOC user dropdown)
    getUsersByLocation: async (locationId: number) => {
        const { data } = await apiClient.get(`/master/users/?base_location=${locationId}`);
        return data;
    }
};