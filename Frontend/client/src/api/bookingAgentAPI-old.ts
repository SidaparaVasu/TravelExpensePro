import { apiClient } from "./client";

// -----------------------------
// Types (Adjust based on your final typings)
// -----------------------------
export interface UpdateStatusPayload {
  status: string;          // "confirmed" | "cancelled"
  remarks?: string;
  booking_file?: File | null;
}

export const bookingAgentAPI = {
  // ----------------------------------
  // Dashboard
  // GET /travel/dashboard/booking-agent/
  // ----------------------------------
  dashboard: async () => {
    const { data } = await apiClient.get("/travel/dashboard/booking-agent/");
    return data?.data || data;
  },

  // ----------------------------------
  // Bookings List
  // GET /travel/booking-agent/bookings/
  // Supports ?status=&search=&page=
  // ----------------------------------
  bookings: {
    getAll: async (params?: { status?: string; search?: string; page?: number }) => {
      const query = new URLSearchParams();

      if (params?.status) query.append("status", params.status);
      if (params?.search) query.append("search", params.search);
      if (params?.page) query.append("page", params.page.toString());

      const qs = query.toString();
      const { data } = await apiClient.get(
        `/travel/booking-agent/bookings/${qs ? `?${qs}` : ""}`
      );

      return data?.data || data;
    },

    // GET booking detail
    get: async (bookingId: number) => {
      const { data } = await apiClient.get(
        `/travel/booking-agent/bookings/${bookingId}/`
      );
      return data?.data || data;
    },
  },

  // ----------------------------------
  // ACCEPT BOOKING ASSIGNMENT
  // POST /travel/booking-agent/bookings/<id>/accept/
  // ----------------------------------
  acceptBooking: async (bookingId: number) => {
    const { data } = await apiClient.post(
      `/travel/booking-agent/bookings/${bookingId}/accept/`
    );
    return data?.data || data;
  },

  // ----------------------------------
  // UPDATE BOOKING STATUS (CONFIRM / CANCEL)
  // POST /travel/booking-agent/bookings/<id>/status/
  // MULTIPART (file upload supported)
  // ----------------------------------
  updateStatus: async (bookingId: number, payload: UpdateStatusPayload) => {
    const form = new FormData();
    form.append("status", payload.status);
    if (payload.remarks) form.append("remarks", payload.remarks);
    if (payload.booking_file) form.append("booking_file", payload.booking_file);

    const { data } = await apiClient.post(
      `/travel/booking-agent/bookings/${bookingId}/status/`,
      form
    );

    return data?.data || data;
  },

  // ----------------------------------
  // NOTES
  // POST /travel/booking-agent/bookings/<id>/notes/
  // ----------------------------------
  addNote: async (bookingId: number, note: string) => {
    const { data } = await apiClient.post(
      `/travel/booking-agent/bookings/${bookingId}/notes/`,
      { note }
    );
    return data?.data || data;
  },

  // ----------------------------------
  // FILE UPLOAD (Optional but available)
  // POST /travel/booking-agent/bookings/<id>/upload-file/
  // ----------------------------------
  uploadFile: async (bookingId: number, file: File) => {
    const form = new FormData();
    form.append("booking_file", file);

    const { data } = await apiClient.post(
      `/travel/booking-agent/bookings/${bookingId}/upload-file/`,
      form
    );

    return data?.data || data;
  },
};
