import { useEffect, useState } from "react";
import { bookingAPI } from "@/src/api/bookingApi";
import BookingCard from "./components/BookingCard";
import BookingDetailsDrawer from "./components/BookingDetailsDrawer";
import { Layout } from "@/components/Layout";

const statusFilters = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "requested", label: "Requested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const typeFilters = [
  { value: "", label: "All" },
  { value: 1, label: "Flight" },
  { value: 2, label: "Train" },
  { value: 3, label: "Cab" },
  { value: 4, label: "Hotel" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [search, setSearch] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      const params = {
        status: status || undefined,
        booking_type: bookingType || undefined,
        search: search || undefined,
        employee_id: localStorage.getItem("employee_id"), // if applicable
      };

      const data = await bookingAPI.getBookings(params);
      console.log(data);
      setBookings(data.results || data.data.results);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status, bookingType, search]);

  const handleCardClick = (booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  return (
    <Layout>
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Bookings</h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          {/* Status Filter */}
          <select
            className="border rounded-md p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Booking Type */}
          <select
            className="border rounded-md p-2"
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
          >
            {typeFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by reference, city..."
            className="border rounded-md p-2 flex-grow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Booking Cards List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.length > 0 ? (
            bookings.map((b) => (
              <BookingCard key={b.id} booking={b} onClick={() => handleCardClick(b)} />
            ))
          ) : (
            <p className="text-gray-500">No bookings found.</p>
          )}
        </div>

        {/* Booking Details Drawer */}
        <BookingDetailsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          bookingId={selectedBooking?.id}
        />
      </div>
    </Layout>
  );
}
