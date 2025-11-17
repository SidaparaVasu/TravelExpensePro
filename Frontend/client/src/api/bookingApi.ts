import { apiClient } from "./client";

export const bookingAPI = {
  getBookings: async (params: any) => {
    const { data } = await apiClient.get("/travel/bookings/", { params });
    return data.data; // API returns paginated or raw? returning raw data for now
  },

  getBooking: async (id: number) => {
    const { data } = await apiClient.get(`/travel/bookings/${id}/`);
    return data.data;
  },
};
