import { useEffect, useState } from "react";
import { bookingAPI } from "@/src/api/bookingApi";

export default function BookingDetailsDrawer({ open, onClose, bookingId }) {
  const [booking, setBooking] = useState(null);

  const fetchDetails = async () => {
    if (!bookingId) return;
    try {
      const data = await bookingAPI.getBooking(bookingId);
      setBooking(data);
    } catch (err) {
      console.error("Error loading booking details:", err);
    }
  };

  useEffect(() => {
    if (open) fetchDetails();
  }, [open]);

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto h-[calc(100%-60px)]">
          {!booking ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-4">

              <Detail label="Booking Type" value={booking.booking_type_name} />
              <Detail label="Status" value={booking.status} />

              <Detail
                label="From"
                value={booking.booking_details?.from || booking.booking_details?.from_location}
              />
              <Detail
                label="To"
                value={booking.booking_details?.to || booking.booking_details?.to_location}
              />

              <Detail
                label="Departure Date"
                value={booking.booking_details?.departure_date}
              />
              <Detail
                label="Departure Time"
                value={booking.booking_details?.departure_time}
              />
              <Detail
                label="Arrival Time"
                value={booking.booking_details?.arrival_time}
              />

              <Detail
                label="Booking Reference"
                value={booking.booking_reference || "—"}
              />
              <Detail
                label="Vendor Reference"
                value={booking.vendor_reference || "—"}
              />

              <Detail
                label="Estimated Cost"
                value={`₹${booking.estimated_cost}`}
              />
              {booking.actual_cost && (
                <Detail
                  label="Actual Cost"
                  value={`₹${booking.actual_cost}`}
                />
              )}

              <div>
                <p className="font-medium">Special Instructions</p>
                <p className="text-gray-600 text-sm mt-1">
                  {booking.special_instruction || "None"}
                </p>
              </div>

              {booking.booking_file && (
                <a
                  href={booking.booking_file}
                  target="_blank"
                  className="text-blue-600 underline text-sm"
                >
                  Download Ticket
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


function Detail({ label, value }) {
  return (
    <div>
      <p className="font-medium text-sm text-gray-800">{label}</p>
      <p className="text-gray-600 text-sm">{value || "—"}</p>
    </div>
  );
}
