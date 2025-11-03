import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { accommodationAPI } from "@/src/api/master_accommodation";

const GuestHouseDetailModal = ({ guestHouseId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guestHouseId) fetchGuestHouse();
  }, [guestHouseId]);

  const fetchGuestHouse = async () => {
    try {
      setLoading(true);
      const res = await accommodationAPI.guestHouse.get(guestHouseId);
      console.log(res.data);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching guest house:", err);
      alert("Failed to load guest house details.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="animate-spin border-b-2 border-blue-500 rounded-full h-10 w-10 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Utility for active/inactive display
  const renderStatus = (status) =>
    status ? (
      <span className="text-green-700 font-medium">Active</span>
    ) : (
      <span className="text-red-700 font-medium">Inactive</span>
    );

  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-50">
      <div className="bg-white w-[100%] max-w-6xl shadow-2xl border border-gray-200 p-6 max-h-[100vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Guest House Details
          </h2>
          <p className="text-sm text-gray-600">
            Detailed information about selected guest house
          </p>
        </div>

        {/* Basic Info */}
        <SectionTable
          title="Basic Info"
          headers={["Name", "Property Type", "Ownership Type", "Manager", "Status"]}
          row={[
            data.name || "-",
            data.property_type?.replace("_", " ") || "-",
            data.ownership_type?.replace("_", " ") || "-",
            data.manager_name || "-",
            renderStatus(data.is_active),
          ]}
        />

        {/* Financial */}
        <SectionTable
          title="Financial Details"
          headers={["GL Code", "GSTIN", "Vendor Code", "Rate Card", "Billing Type"]}
          row={[
            data.gl_code_display ,
            data.gstin || "-",
            data.vendor_code || "-",
            data.rate_card ? `₹${data.rate_card}` : "-",
            data.billing_type?.replace("_", " ") || "-",
          ]}
        />

        {/* Location */}
        <SectionTable
          title="Location"
          headers={["Address", "City", "State", "Country", "PIN Code", "District"]}
          row={[
            data.address || "-",
            data.city_name || "-",
            data.state_name || "-",
            data.country_name || "-",
            data.pin_code || "-",
            data.district || "-",
          ]}
        />

        {/* Contact */}
        <SectionTable
          title="Contact"
          headers={["Contact Person", "Phone Number", "Email", "Emergency Contact"]}
          row={[
            data.contact_person || "-",
            data.phone_number || "-",
            data.email || "-",
            data.emergency_contact || "-",
          ]}
        />

        {/* Capacity */}
        <SectionTable
          title="Capacity"
          headers={["Total Rooms", "Max Occupancy", "Room Types", "Amenities"]}
          row={[
            data.total_rooms || "-",
            data.max_occupancy || "-",
            data.room_types?.map((rt) => `${rt.type} (${rt.count})`).join(", ") || "-",
            data.amenities
              ? Object.keys(data.amenities)
                  .filter((key) => data.amenities[key])
                  .join(", ")
              : "-",
          ]}
        />

        {/* Operations */}
        <SectionTable
          title="Operations"
          headers={["Check-in Time", "Check-out Time", "Booking Window"]}
          row={[
            data.check_in_time || "-",
            data.check_out_time || "-",
            data.booking_window_days ? `${data.booking_window_days} days` : "-",
          ]}
        />

        {/* Audit */}
        <SectionTable
          title="Audit Info"
          headers={["Created At", "Last Updated"]}
          row={[
            data.created_at ? new Date(data.created_at).toLocaleString() : "-",
            data.updated_at ? new Date(data.updated_at).toLocaleString() : "-",
          ]}
        />
      </div>
    </div>
  );
};

// Section Table Component
const SectionTable = ({ title, headers, row }) => (
  <div className="mb-6">
    <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {row.map((val, idx) => (
              <td
                key={idx}
                className="border border-gray-300 px-4 py-2 text-gray-800"
              >
                {val}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default GuestHouseDetailModal;
