// src/pages/ItineraryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { travelAPI } from "@/src/api/travel"; // your existing axios instance
import { bookingAPI } from "@/src/api/bookingApi";
// import { Layout } from "@/components/Layout";

/* ----------------------- ICONS ----------------------- */

function IconFlight() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 12l4-2v6l-4-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconTrain() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 20v-2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 20v-2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconCar() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M3 13l1.5-4.5A2 2 0 017 6h10a2 2 0 011.5.5L21 13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 16v2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 16v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconHotel() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M3 21v-7a4 4 0 014-4h10a4 4 0 014 4v7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10V7a3 3 0 013-3h4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IconDefault() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ModeIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (t.includes("flight")) return <IconFlight />;
  if (t.includes("train")) return <IconTrain />;
  if (t.includes("car") || t.includes("cab")) return <IconCar />;
  if (t.includes("hotel") || t.includes("accommodation") || t.includes("guest")) return <IconHotel />;
  return <IconDefault />;
}

/* ----------------------- HELPERS ----------------------- */

function formatDateISO(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return !isNaN(d) ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : dateStr;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hh, mm] = timeStr.split(":");
    const d = new Date();
    d.setHours(hh, mm);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return timeStr;
}

function resolveLocationName(val, nameField) {
  if (nameField) return nameField;
  if (typeof val === "string") return val;
  if (!val) return null;
  return `Location ${val}`;
}

/* ----------------------- MAIN PAGE ----------------------- */

export default function ItineraryPage({ applicationId: propId }) {
  const params = useParams();
  const applicationId = propId || params?.applicationId || params?.id;

  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openEvent, setOpenEvent] = useState(null);
  const [bookingDetail, setBookingDetail] = useState(null);

  useEffect(() => {
    fetchItineraries();
  }, [applicationId]);

  const fetchItineraries = async () => {
    try {
      console.log(applicationId);
      if (!applicationId) return;

      const res = await travelAPI.getItineraries(applicationId);
      console.log(res);
      const data = res?.data ?? res;

      setItinerary(data);
      setTimeline(normalizeTimeline(data.timeline || []));

      setLoading(false);
    } catch (error) {
      console.log("Failed to fetch itinerary", error);
      setLoading(false);
    }
  };


  /* ------- NORMALIZE TIMELINE ------- */
  function normalizeTimeline(raw) {
    if (!Array.isArray(raw)) return [];

    const unknown = "Unknown Date";

    // If already grouped
    if (raw.length && raw[0].events) {
      return raw.map((g) => ({
        date: g.date || unknown,
        events: g.events || [],
      }));
    }

    // Else flat → group by date
    const map = {};
    raw.forEach((ev) => {
      const d = ev.date || ev.departure_date || ev.start_date || unknown;
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    });

    return Object.entries(map).map(([date, events]) => ({ date, events }));
  }

  /* ------- OPEN DRAWER ------- */
  const openEventDrawer = async (ev) => {
    setDrawerOpen(true);
    setOpenEvent(ev);

    const bookingId = ev?.details?.id || ev?.booking_id;
    setBookingDetail(null);

    if (bookingId) {
      try {
        const { data } = await bookingAPI.getBooking(bookingId);
        setBookingDetail(data?.data ?? data);
      } catch { }
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setOpenEvent(null);
    setBookingDetail(null);
  };

  /* ------- RENDER EVENT ROUTE ------- */
  function renderRoute(ev) {
    const d = ev?.details || {};
    const from = resolveLocationName(d.from_location, d.from_location_name);
    const to = resolveLocationName(d.to_location, d.to_location_name);

    if (from && to) return `${from} → ${to}`;
    if (d.place) return d.place;
    return "—";
  }

  /* ----------------------- RENDER ----------------------- */

  return (
    // <Layout>
      <div className="p-6">

        {/* HEADER */}
        <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Itinerary</h1>

          {itinerary?.trip_summary && (
            <p className="text-sm text-gray-600 mt-2">
              {formatDateISO(itinerary.trip_summary.start_date)} →{" "}
              {formatDateISO(itinerary.trip_summary.end_date)}
            </p>
          )}

          {itinerary?.employee_name && (
            <p className="text-sm text-gray-500 mt-1">
              Employee: {itinerary.employee_name}
            </p>
          )}

          {itinerary?.application_id && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              App ID: {itinerary.application_id}
            </span>
          )}
        </div>

        {/* TIMELINE */}
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 h-full w-px bg-gray-200" />

          {loading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : !timeline || timeline.length === 0 ? (

            <div className="text-gray-500 text-center p-6">No itinerary found.</div>
          ) : (
            timeline.map((g, gIndex) => (
              <div key={gIndex} className="mb-10">
                <div className="flex justify-center">
                  <div className="bg-white px-3 py-1 rounded-full shadow text-sm text-gray-700">
                    ● {g.date === "Unknown Date" ? "Unknown Date" : formatDateISO(g.date)}
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  {g.events.map((ev, idx) => {
                    const left = (idx + gIndex) % 2 === 0;
                    return (
                      <div key={idx} className="md:grid md:grid-cols-2 gap-4">
                        <div className={`hidden md:block ${left ? "pr-8" : "pl-8"}`} />

                        <div
                          className={`md:w-[46%] ${left ? "md:mr-auto" : "md:ml-auto"
                            }`}
                        >
                          <EventCard
                            event={ev}
                            route={renderRoute(ev)}
                            onClick={() => openEventDrawer(ev)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FULL SCREEN DRAWER */}
        <FullScreenDrawer open={drawerOpen} onClose={closeDrawer}>
          <div className="p-6 max-w-3xl mx-auto">

            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">{openEvent?.type || "Event Details"}</h2>
              <button onClick={closeDrawer} className="px-3 py-1 border rounded">
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Detail label="Type" value={openEvent?.type} />
              <Detail label="Route / Place" value={renderRoute(openEvent)} />
              <Detail label="Start Time" value={formatTime(openEvent?.start_time)} />
              <Detail label="End Time" value={formatTime(openEvent?.end_time)} />
              <Detail label="Notes" value={openEvent?.details?.special_instruction} />
              <Detail label="Booking Ref" value={bookingDetail?.booking_reference} />
              <Detail label="Status" value={bookingDetail?.status} />
              <Detail label="Cost" value={bookingDetail?.estimated_cost} />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium">Raw Data</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded mt-2">
                {JSON.stringify(openEvent, null, 2)}
              </pre>
            </div>
          </div>
        </FullScreenDrawer>
      </div>
    // {/* </Layout> */}
  );
}

/* ----------------------- SUB COMPONENTS ----------------------- */

function EventCard({ event, route, onClick }) {
  const d = event.details || {};
  const type = event?.type || d?.booking_type_name;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white p-4 rounded-lg shadow hover:shadow-md transition flex gap-3"
    >
      <div className="p-2 bg-gray-50 rounded">
        <ModeIcon type={type} />
      </div>

      <div className="flex-1">
        <h4 className="font-medium text-gray-800 text-sm">
          {event?.title || type || "Event"}
        </h4>

        <p className="text-xs text-gray-500 mt-1">{route}</p>

        <p className="text-xs text-gray-500 mt-2">
          {formatTime(event?.start_time || d?.start_time)}{" "}
          {event?.end_time && `→ ${formatTime(event.end_time)}`}
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="text-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-gray-700">{value || "—"}</div>
    </div>
  );
}

function FullScreenDrawer({ open, onClose, children }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"
          }`}
      >
        {children}
      </div>
    </>
  );
}
