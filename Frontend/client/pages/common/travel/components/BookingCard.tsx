export default function BookingCard({ booking, onClick }) {
  const d = booking.booking_details || {};

  // ---- Location Name Resolver ----
  const resolveLocation = (value, nameField) => {
    // If backend provided a display name:
    if (nameField) return nameField;

    // If value is a string → it's already a name
    if (typeof value === "string") return value;

    // If it's empty or null
    if (!value) return "—";

    // Otherwise fallback: show ID so user sees something
    return `Location ${value}`;
  };

  // ---- Route Handler ----
  const route = (() => {
    const from =
      resolveLocation(d.from_location, d.from_location_name) ||
      booking.from_location;
    const to =
      resolveLocation(d.to_location, d.to_location_name) ||
      booking.to_location;

    // Flight / Train / Car
    if (from && to) return `${from} → ${to}`;

    // Accommodation
    if (d.place) return d.place;

    return "—";
  })();

  // ---- Date Handler ----
  const departureDate =
    d.departure_date ||
    d.start_date ||
    d.check_in_date ||
    booking.departure_date ||
    "—";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer border rounded-lg p-4 bg-white shadow hover:shadow-md transition"
    >
      {/* Header */}
      <div className="flex justify-between">
        <h3 className="font-semibold">{booking.booking_type_name}</h3>

        <span
          className={`text-xs px-2 py-1 rounded capitalize ${
            booking.status === "confirmed"
              ? "bg-green-100 text-green-700"
              : booking.status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : booking.status === "cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {booking.status}
        </span>
      </div>

      {/* Route */}
      <p className="mt-2 text-sm text-gray-700 font-medium">{route}</p>

      {/* Date */}
      <p className="text-sm text-gray-500 mt-1">
        Departure: {departureDate}
      </p>

      {/* Reference */}
      <p className="text-sm text-gray-600 mt-2">
        Ref: {booking.booking_reference || "—"}
      </p>
    </div>
  );
}
