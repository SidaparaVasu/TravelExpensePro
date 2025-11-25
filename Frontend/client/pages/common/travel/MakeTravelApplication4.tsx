// File: MakeTravelApplication3.refactor.tsx
// Path reference (existing file you provided): /mnt/data/MakeTravelApplication3.tsx
//
// Refactored single-file implementation (TypeScript + React).
// - Modular components for each tab (Purpose, Ticketing, Accommodation, Conveyance, Advance).
// - Local UI validations (centralized).
// - Calls to backend entitlement & validate endpoints (stubs + fetch wrappers).
// - Validate → show warnings modal → submit flow implemented.
// - Developer-friendly comments and small helper utilities.
//
// NOTE: Replace travelApi.* stubs with your real API client (or keep these wrappers).
// Keep this file as a drop-in replacement for quick frontend integration.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ===========
   Types / Interfaces
   =========== */
type Option = { value: string | number; label: string };

type City = {
  id: number;
  city_name: string;
  state_name?: string;
  country_name?: string;
  category_id?: number | null; // used for entitlement lookups
};

type TravelMode = { id: number; name: string };
type SubOption = { id: number; mode: number; name: string; max_amount?: number | null };

type TicketItem = {
  id?: number | string;
  booking_type: string; // travel mode id as string
  sub_option: string;
  from_location?: number | null;
  from_label?: string;
  to_location?: number | null;
  to_label?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  estimated_cost?: number | string;
  special_instruction?: string;
  not_required?: boolean;
};

type AccommodationItem = {
  id?: number | string;
  accommodation_type?: string;
  guest_house?: number | null;
  place?: string;
  check_in_date?: string;
  check_in_time?: string;
  check_out_date?: string;
  check_out_time?: string;
  estimated_cost?: number | string;
  special_instruction?: string;
  not_required?: boolean;
};

type ConveyanceItem = {
  id?: number | string;
  from_location?: number | null;
  to_location?: number | null;
  report_at?: string;
  drop_location?: string;
  vehicle_type?: string;
  vehicle_sub_option?: string;
  start_date?: string;
  start_time?: string;
  estimated_cost?: number | string;
  special_instruction?: string;
  not_required?: boolean;
  club_booking?: boolean;
  club_reason?: string;
  guests?: any[];
  distance_km?: number | null;
  vehicle_airbags?: number | null;
};

type FormRoot = {
  purpose: string;
  internal_order: string;
  general_ledger: string;
  sanction_number?: string;
  advance_amount?: number | string;
  trip_from_location?: number | string | null;
  trip_to_location?: number | string | null;
  trip_start_date?: string | null;
  trip_end_date?: string | null;
  ticketing: TicketItem[];
  accommodation: AccommodationItem[];
  conveyance: ConveyanceItem[];
  otherExpenses?: number;
  need_advance?: boolean;
  exception_reasons?: { code: string; message: string }[];
};

/* ===========
   Helper Utilities
   =========== */

/** Simple deep copy helper */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Convert Date string to start-of-day Date */
const dateFrom = (d?: string | null) => {
  if (!d) return null;
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

/** Days difference (floor) between two dates (dateB - dateA) */
const daysDiff = (a?: string | null, b?: string | null) => {
  const da = dateFrom(a);
  const db = dateFrom(b);
  if (!da || !db) return null;
  return Math.floor((+db - +da) / (1000 * 60 * 60 * 24));
};

/* ===========
   API Wrappers (simple fetch wrappers)
   Replace these with your travelAPI / axios client
   =========== */

const travelApi = {
  async getMasterData() {
    // fetch GL codes, cities, modes, guesthouses, arc hotels
    // Replace with real endpoints; this is a small wrapper that expects:
    // { glCodes, cities, travelModes, subOptionsByMode, guestHouses, arcHotels }
    // For now return empty structures to prevent runtime errors.
    return {
      glCodes: [],
      cities: [],
      travelModes: [],
      subOptionsByMode: {},
      guestHouses: [],
      arcHotels: [],
    };
  },

  async getEntitlements(params: {
    employee_id: string;
    grade_id?: string | number;
    from_city_id?: number | null;
    to_city_id?: number | null;
  }) {
    // Call GET /api/travel/entitlements/?employee_id=...&from_city_id=...&to_city_id=...
    // For now return a safe mock.
    return {
      allowed_modes: [],
      da_rates: null,
      policy_flags: {
        flight_advance_days: 7,
        train_advance_hours: 72,
        own_car_max_km: 150,
        own_car_min_airbags: 6,
      },
    };
  },

  async validateApplication(payload: any) {
    // POST /api/travel/validate/ -> returns { errors, warnings, computed }
    // For now return no errors, some warnings if seat > 10000
    const warnings: Record<string, string[]> = {};
    const errors: Record<string, string[]> = {};

    // Example check: flight fare > 10000 -> warning
    payload.trip_details?.forEach((td: any, i: number) => {
      td.bookings?.forEach((b: any, j: number) => {
        if (b.mode === "Flight" && b.estimated_cost > 10000) {
          warnings[`trip_details[${i}].bookings[${j}].estimated_cost`] =
            warnings[`trip_details[${i}].bookings[${j}].estimated_cost`] || [];
          warnings[`trip_details[${i}].bookings[${j}].estimated_cost`].push(
            "Flight fare > ₹10,000 — CHRO/CEO approval will be required"
          );
        }
      });
    });

    // computed example: estimated_total_cost
    const estimated_total_cost = Math.round(
      (payload.ticketingSum || 0) + (payload.accommodationSum || 0) + (payload.conveyanceSum || 0)
    );

    return {
      errors,
      warnings,
      computed: {
        estimated_total_cost,
        da_breakdown: [], // backend will calculate real DA
        approver_chain: [], // backend will build chain
        settlement_due_date: null,
        conflicts: [],
      },
    };
  },

  async submitApplication(payload: any) {
    // POST /api/travel/applications/ -> returns created TR info
    // Mock response:
    return {
      travel_request_id: `TR-${Date.now()}`,
      status: "pending_manager",
      current_approver: null,
      approval_chain: [],
      estimated_cost: payload.estimated_total_cost || 0,
      settlement_due_date: null,
    };
  },

  async checkConflicts(employeeId: string, startDate?: string | null, endDate?: string | null) {
    // GET /api/travel/conflicts/?employeeId=&start_date=&end_date=
    // Mock: no conflict
    return { conflicts: [] };
  },
};

/* ===========
   Initial state helpers
   =========== */

const getEmptyTicket = (): TicketItem => ({
  booking_type: "",
  sub_option: "",
  from_location: null,
  from_label: "",
  to_location: null,
  to_label: "",
  departure_date: "",
  departure_time: "",
  arrival_date: "",
  arrival_time: "",
  estimated_cost: "",
  special_instruction: "",
  not_required: false,
});

const getEmptyAccommodation = (): AccommodationItem => ({
  accommodation_type: "",
  guest_house: null,
  place: "",
  check_in_date: "",
  check_in_time: "",
  check_out_date: "",
  check_out_time: "",
  estimated_cost: "",
  special_instruction: "",
  not_required: false,
});

const getEmptyConveyance = (): ConveyanceItem => ({
  from_location: null,
  to_location: null,
  report_at: "",
  drop_location: "",
  vehicle_type: "",
  vehicle_sub_option: "",
  start_date: "",
  start_time: "",
  estimated_cost: "",
  special_instruction: "",
  not_required: false,
  club_booking: true,
  club_reason: "",
  guests: [],
  distance_km: null,
  vehicle_airbags: null,
});

/* ===========
   Local (UI-only) Validation module
   - returns structured errors per-section and per-field
   =========== */

type LocalValidationResult = {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
};

const localValidate = (payload: FormRoot): LocalValidationResult => {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};

  // Purpose-level checks
  if (!payload.purpose || payload.purpose.trim().length === 0) {
    errors["purpose"] = ["Purpose is required."];
  } else if (payload.purpose.length > 500) {
    errors["purpose"] = ["Purpose cannot exceed 500 characters."];
  }

  if (!payload.internal_order || payload.internal_order.trim().length === 0) {
    errors["internal_order"] = ["Internal order is required."];
  }

  if (!payload.general_ledger || payload.general_ledger.toString().trim().length === 0) {
    errors["general_ledger"] = ["GL Code is required."];
  }

  // Trip-level date range is optional, but if provided enforce ordering and <= 90 days
  if (payload.trip_start_date && payload.trip_end_date) {
    const days = daysDiff(payload.trip_start_date, payload.trip_end_date);
    if (days === null) {
      errors["trip_dates"] = ["Invalid trip start/end dates."];
    } else {
      if (days < 0) errors["trip_dates"] = ["Trip end date must be same or after start date."];
      if (days > 90) errors["trip_dates"] = ["Maximum travel duration is 90 days."];
    }
  }

  // Must have at least one booking OR mark all not-required
  const hasTicketing = payload.ticketing?.length > 0;
  const hasAccommodation = payload.accommodation?.length > 0;
  const hasConveyance = payload.conveyance?.length > 0;
  if (!hasTicketing && !hasAccommodation && !hasConveyance) {
    errors["bookings"] = ["Please add at least one booking (Ticketing, Accommodation, or Conveyance)."];
  }

  // Validate ticket items
  payload.ticketing?.forEach((t, idx) => {
    const prefix = `ticketing[${idx}]`;
    if (!t.booking_type) {
      errors[`${prefix}.booking_type`] = ["Travel mode is required."];
    }
    if (!t.sub_option) {
      errors[`${prefix}.sub_option`] = ["Travel sub-option is required."];
    }
    if (!t.from_location) {
      errors[`${prefix}.from_location`] = ["From location is required."];
    }
    if (!t.to_location) {
      errors[`${prefix}.to_location`] = ["To location is required."];
    }
    if (!t.departure_date) {
      errors[`${prefix}.departure_date`] = ["Departure date is required."];
    } else {
      // departure must not be past date
      const dep = dateFrom(t.departure_date);
      const today = dateFrom(new Date().toISOString().slice(0, 10));
      if (dep && today && dep < today) {
        errors[`${prefix}.departure_date`] = ["Departure date cannot be in the past."];
      }
    }
    // arrival >= departure
    if (t.arrival_date && t.departure_date) {
      const days = daysDiff(t.departure_date, t.arrival_date);
      if (days !== null && days < 0) {
        errors[`${prefix}.arrival_date`] = ["Return/arrival date cannot be earlier than departure date."];
      }
    }
    // estimated cost numeric
    if (t.estimated_cost !== "" && t.estimated_cost !== undefined) {
      const c = Number(t.estimated_cost);
      if (isNaN(c) || c < 0) {
        errors[`${prefix}.estimated_cost`] = ["Estimated cost must be a non-negative number."];
      }
    }
    // trip-level date range gating: ensure ticket dates within trip dates if trip set
    if (payload.trip_start_date && payload.trip_end_date) {
      const withinStart = daysDiff(payload.trip_start_date!, t.departure_date) ?? 0;
      const withinEnd = daysDiff(t.arrival_date ?? t.departure_date!, payload.trip_end_date!) ?? 0;
      if (withinStart === null || withinEnd === null) {
        // nothing
      } else {
        if (withinStart < 0 || withinEnd > 0) {
          errors[`${prefix}.dates`] = ["Ticket dates must fall within the trip start/end dates."];
        }
      }
    }
  });

  // Validate accommodation items
  payload.accommodation?.forEach((a, idx) => {
    const prefix = `accommodation[${idx}]`;
    if (!a.accommodation_type) {
      errors[`${prefix}.accommodation_type`] = ["Accommodation type is required."];
    }
    if (!a.place) {
      errors[`${prefix}.place`] = ["Place/Location is required."];
    }
    if (!a.check_in_date) {
      errors[`${prefix}.check_in_date`] = ["Check-in date is required."];
    }
    if (!a.check_out_date) {
      errors[`${prefix}.check_out_date`] = ["Check-out date is required."];
    }
    if (a.check_in_date && a.check_out_date) {
      const dd = daysDiff(a.check_in_date, a.check_out_date);
      if (dd !== null && dd < 0) {
        errors[`${prefix}.check_out_date`] = ["Check-out date cannot be before check-in date."];
      }
    }
    if (a.estimated_cost !== "" && a.estimated_cost !== undefined) {
      const c = Number(a.estimated_cost);
      if (isNaN(c) || c < 0) {
        errors[`${prefix}.estimated_cost`] = ["Estimated cost must be a non-negative number."];
      }
    }
    // Ensure accommodation dates within trip dates if provided
    if (payload.trip_start_date && payload.trip_end_date && a.check_in_date && a.check_out_date) {
      const startOk = daysDiff(payload.trip_start_date!, a.check_in_date) ?? 0;
      const endOk = daysDiff(a.check_out_date, payload.trip_end_date!) ?? 0;
      if (startOk < 0 || endOk > 0) {
        errors[`${prefix}.dates`] = ["Accommodation dates must be within the trip start/end dates."];
      }
    }
  });

  // Validate conveyance items
  payload.conveyance?.forEach((c, idx) => {
    const prefix = `conveyance[${idx}]`;
    if (!c.from_location) {
      errors[`${prefix}.from_location`] = ["From location is required."];
    }
    if (!c.to_location) {
      errors[`${prefix}.to_location`] = ["To location is required."];
    }
    if (!c.start_date) {
      errors[`${prefix}.start_date`] = ["Start date is required."];
    }
    if (c.estimated_cost !== "" && c.estimated_cost !== undefined) {
      const cc = Number(c.estimated_cost);
      if (isNaN(cc) || cc < 0) {
        errors[`${prefix}.estimated_cost`] = ["Estimated cost must be a non-negative number."];
      }
    }
    // club booking reason enforced when not clubbing
    if (c.club_booking === false && (!c.club_reason || c.club_reason.trim().length === 0)) {
      errors[`${prefix}.club_reason`] = ["Reason for not clubbing is required."];
    }
    // own car specific checks (UI-side prompts; backend must enforce)
    if (c.vehicle_type === "own_car") {
      if (c.distance_km !== null && c.distance_km !== undefined) {
        if (Number(c.distance_km) < 0) {
          errors[`${prefix}.distance_km`] = ["Distance must be non-negative."];
        }
      }
      if (c.vehicle_airbags !== null && c.vehicle_airbags !== undefined) {
        if (Number(c.vehicle_airbags) < 0) {
          errors[`${prefix}.vehicle_airbags`] = ["Airbags count must be non-negative."];
        }
      }
    }
  });

  // Advance validations
  if (payload.need_advance && (payload.advance_amount === undefined || payload.advance_amount === null || payload.advance_amount === "")) {
    errors["advance_amount"] = ["Advance amount is required when advance requested."];
  }
  if (payload.advance_amount !== undefined && payload.advance_amount !== null) {
    const adv = Number(payload.advance_amount);
    if (isNaN(adv) || adv < 0) errors["advance_amount"] = ["Advance amount must be a non-negative number."];
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/* ===========
   Reusable UI Components (kept internal for single-file ease)
   - PurposeSection
   - TicketingSection
   - AccommodationSection
   - ConveyanceSection
   - AdvanceSection
   =========== */

const ErrorList: React.FC<{ errors?: string[] }> = ({ errors }) => {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="bg-red-50 border border-red-200 p-3 rounded mb-3">
      {errors.map((e, idx) => (
        <div key={idx} className="text-sm text-red-700">
          • {e}
        </div>
      ))}
    </div>
  );
};

/* PurposeSection */
const PurposeSection: React.FC<{
  form: FormRoot;
  setForm: (f: FormRoot) => void;
  master: { glCodes: Option[] };
  errors: Record<string, string[]>;
}> = ({ form, setForm, master, errors }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Purpose <span className="text-red-500">*</span></label>
        <textarea
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          rows={3}
          className="w-full border rounded p-2"
          placeholder="Purpose of travel..."
        />
        {errors["purpose"] && <ErrorList errors={errors["purpose"]} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Internal Order <span className="text-red-500">*</span></label>
          <input
            value={form.internal_order}
            onChange={(e) => setForm({ ...form, internal_order: e.target.value })}
            className="w-full border rounded p-2"
          />
          {errors["internal_order"] && <ErrorList errors={errors["internal_order"]} />}
        </div>

        <div>
          <label className="block text-sm font-medium">GL Code <span className="text-red-500">*</span></label>
          <input
            value={form.general_ledger}
            onChange={(e) => setForm({ ...form, general_ledger: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="GL Code"
          />
          {errors["general_ledger"] && <ErrorList errors={errors["general_ledger"]} />}
        </div>

        <div>
          <label className="block text-sm font-medium">Sanction Number</label>
          <input
            value={form.sanction_number || ""}
            onChange={(e) => setForm({ ...form, sanction_number: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
      </div>
    </div>
  );
};

/* TicketingSection */
const TicketingSection: React.FC<{
  ticketing: TicketItem[];
  setTicketing: (t: TicketItem[]) => void;
  subOptionsByMode: Record<string, SubOption[]>;
  cities: City[];
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
  errors: Record<string, string[]>;
}> = ({ ticketing, setTicketing, subOptionsByMode, cities, addToast, errors }) => {
  const [form, setForm] = useState<TicketItem>(getEmptyTicket());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // reset local when ticketing list cleared
    if (ticketing.length === 0) {
      setForm(getEmptyTicket());
      setEditIndex(null);
    }
  }, [ticketing.length]);

  const handleAddOrUpdate = () => {
    // lightweight section-level validation before pushing
    const errs: Record<string, string> = {};
    if (!form.booking_type) errs["booking_type"] = "Select travel mode.";
    if (!form.sub_option) errs["sub_option"] = "Select sub-option.";
    if (!form.from_location) errs["from_location"] = "From location required.";
    if (!form.to_location) errs["to_location"] = "To location required.";
    if (!form.departure_date) errs["departure_date"] = "Departure date required.";

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast("Please fix ticket-level errors", "error");
      return;
    }

    if (editIndex !== null) {
      const updated = [...ticketing];
      updated[editIndex] = { ...form, id: updated[editIndex].id };
      setTicketing(updated);
      addToast("Ticket updated", "success");
    } else {
      setTicketing([...ticketing, { ...form, id: Date.now() }]);
      addToast("Ticket added", "success");
    }
    setForm(getEmptyTicket());
    setEditIndex(null);
    setFieldErrors({});
  };

  const onEdit = (i: number) => {
    setEditIndex(i);
    setForm(ticketing[i]);
  };

  const onDelete = (i: number) => {
    if (!confirm("Delete this ticket?")) return;
    setTicketing(ticketing.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">Flight & Train Bookings</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Travel Mode</label>
          <select
            value={form.booking_type}
            onChange={(e) => setForm({ ...form, booking_type: e.target.value, sub_option: "" })}
            className="w-full border rounded p-2"
          >
            <option value="">Select mode</option>
            {Object.keys(subOptionsByMode).map((k) => {
              // we don't have names in this minimal file; in real app map id->name
              return (
                <option key={k} value={k}>
                  Mode {k}
                </option>
              );
            })}
          </select>
          {fieldErrors["booking_type"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["booking_type"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Travel Sub-Option</label>
          <select
            value={form.sub_option}
            onChange={(e) => setForm({ ...form, sub_option: e.target.value })}
            className="w-full border rounded p-2"
            disabled={!form.booking_type}
          >
            <option value="">{form.booking_type ? "Select sub-option" : "Select travel mode first"}</option>
            {(subOptionsByMode[form.booking_type] || []).map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
          {fieldErrors["sub_option"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["sub_option"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Estimated Cost (₹)</label>
          <input
            type="number"
            min={0}
            value={form.estimated_cost ?? ""}
            onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="e.g., 12000"
          />
          {fieldErrors["estimated_cost"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["estimated_cost"]}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium">From (City)</label>
          <input
            placeholder="Type & select..."
            value={form.from_label || ""}
            onChange={(e) => setForm({ ...form, from_label: e.target.value })}
            className="w-full border rounded p-2"
          />
          {fieldErrors["from_location"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["from_location"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">To (City)</label>
          <input
            placeholder="Type & select..."
            value={form.to_label || ""}
            onChange={(e) => setForm({ ...form, to_label: e.target.value })}
            className="w-full border rounded p-2"
          />
          {fieldErrors["to_location"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["to_location"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Departure Date</label>
          <input
            type="date"
            value={form.departure_date || ""}
            onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
            className="w-full border rounded p-2"
          />
          {fieldErrors["departure_date"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["departure_date"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Return Date (Optional)</label>
          <input
            type="date"
            value={form.arrival_date || ""}
            onChange={(e) => setForm({ ...form, arrival_date: e.target.value })}
            className="w-full border rounded p-2"
          />
          {fieldErrors["arrival_date"] && <div className="text-red-600 text-sm mt-1">{fieldErrors["arrival_date"]}</div>}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => { setForm(getEmptyTicket()); setEditIndex(null); setFieldErrors({}); }} className="px-3 py-2 border rounded">Clear</button>
        <button onClick={handleAddOrUpdate} className="px-3 py-2 bg-blue-600 text-white rounded">{editIndex !== null ? "Update" : "Add"} Ticket</button>
      </div>

      <div className="mt-6">
        <h4 className="font-medium">Added Tickets</h4>
        {ticketing.length === 0 && <div className="text-sm text-slate-500 mt-2">No tickets added.</div>}
        {ticketing.map((t, i) => (
          <div key={t.id} className="p-3 border rounded mt-2 flex justify-between items-center">
            <div>
              <div className="font-medium">Mode: {t.booking_type} • Sub: {t.sub_option}</div>
              <div className="text-sm text-slate-600">From: {t.from_label} To: {t.to_label} • {t.departure_date}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(i)} className="px-2 py-1 border rounded">Edit</button>
              <button onClick={() => onDelete(i)} className="px-2 py-1 border rounded text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Surface section-level errors from parent validation */}
      <div className="mt-3">
        {Object.entries(errors)
          .filter(([k]) => k.startsWith("ticketing"))
          .slice(0, 5)
          .map(([k, v]) => (
            <div key={k} className="text-red-600 text-sm">• {k}: {v.join(", ")}</div>
          ))}
      </div>
    </div>
  );
};

/* AccommodationSection */
const AccommodationSection: React.FC<{
  accommodation: AccommodationItem[];
  setAccommodation: (a: AccommodationItem[]) => void;
  guestHouses: any[];
  addToast: (m: string, t?: "success" | "error" | "info") => void;
  errors: Record<string, string[]>;
}> = ({ accommodation, setAccommodation, guestHouses, addToast, errors }) => {
  const [form, setForm] = useState<AccommodationItem>(getEmptyAccommodation());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    const errs: Record<string, string> = {};
    if (!form.accommodation_type) errs["accommodation_type"] = "Select accommodation type.";
    if (!form.place) errs["place"] = "Place is required.";
    if (!form.check_in_date) errs["check_in_date"] = "Check-in date required.";
    if (!form.check_out_date) errs["check_out_date"] = "Check-out date required.";

    setLocalErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast("Fix accommodation errors", "error");
      return;
    }
    if (editIndex !== null) {
      const updated = [...accommodation];
      updated[editIndex] = { ...form, id: updated[editIndex].id };
      setAccommodation(updated);
      addToast("Accommodation updated", "success");
    } else {
      setAccommodation([...accommodation, { ...form, id: Date.now() }]);
      addToast("Accommodation added", "success");
    }
    setForm(getEmptyAccommodation());
    setEditIndex(null);
    setLocalErrors({});
  };

  const onEdit = (i: number) => {
    setEditIndex(i);
    setForm(accommodation[i]);
  };

  const onDelete = (i: number) => {
    if (!confirm("Delete this accommodation?")) return;
    setAccommodation(accommodation.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">Accommodation</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select value={form.accommodation_type} onChange={(e) => setForm({ ...form, accommodation_type: e.target.value })} className="w-full p-2 border rounded">
            <option value="">Select</option>
            <option value="company">Company Guest House</option>
            <option value="company_tied">Company-Tied Hotel</option>
            <option value="self">Self-Arranged Hotel</option>
            <option value="friend">Staying with Friends/Relatives</option>
          </select>
          {localErrors["accommodation_type"] && <div className="text-red-600 text-sm mt-1">{localErrors["accommodation_type"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Place</label>
          <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="w-full border rounded p-2" />
          {localErrors["place"] && <div className="text-red-600 text-sm mt-1">{localErrors["place"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Estimated Cost (₹)</label>
          <input type="number" value={form.estimated_cost ?? ""} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} className="w-full border rounded p-2" />
          {localErrors["estimated_cost"] && <div className="text-red-600 text-sm mt-1">{localErrors["estimated_cost"]}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium">Check-in Date</label>
          <input type="date" value={form.check_in_date || ""} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Check-out Date</label>
          <input type="date" value={form.check_out_date || ""} onChange={(e) => setForm({ ...form, check_out_date: e.target.value })} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Special Instructions</label>
          <input value={form.special_instruction || ""} onChange={(e) => setForm({ ...form, special_instruction: e.target.value })} className="w-full border rounded p-2" />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => { setForm(getEmptyAccommodation()); setEditIndex(null); setLocalErrors({}); }} className="px-3 py-2 border rounded">Clear</button>
        <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white rounded">{editIndex !== null ? "Update" : "Add"} Accommodation</button>
      </div>

      <div className="mt-6">
        <h4 className="font-medium">Added Accommodations</h4>
        {accommodation.length === 0 && <div className="text-sm text-slate-500 mt-2">No accommodations added.</div>}
        {accommodation.map((a, i) => (
          <div key={a.id} className="p-3 border rounded mt-2 flex justify-between items-center">
            <div>
              <div className="font-medium">{a.accommodation_type} • {a.place}</div>
              <div className="text-sm text-slate-600">{a.check_in_date} → {a.check_out_date}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(i)} className="px-2 py-1 border rounded">Edit</button>
              <button onClick={() => onDelete(i)} className="px-2 py-1 border rounded text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        {Object.entries(errors)
          .filter(([k]) => k.startsWith("accommodation"))
          .slice(0, 5)
          .map(([k, v]) => (
            <div key={k} className="text-red-600 text-sm">• {k}: {v.join(", ")}</div>
          ))}
      </div>
    </div>
  );
};

/* ConveyanceSection */
const ConveyanceSection: React.FC<{
  conveyance: ConveyanceItem[];
  setConveyance: (c: ConveyanceItem[]) => void;
  addToast: (m: string, t?: "success" | "error" | "info") => void;
  errors: Record<string, string[]>;
}> = ({ conveyance, setConveyance, addToast, errors }) => {
  const [form, setForm] = useState<ConveyanceItem>(getEmptyConveyance());
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    const errs: Record<string, string> = {};
    if (!form.from_location) errs["from_location"] = "From location required.";
    if (!form.to_location) errs["to_location"] = "To location required.";
    if (!form.start_date) errs["start_date"] = "Start date required.";
    if (!form.vehicle_type) errs["vehicle_type"] = "Vehicle type required.";
    if (form.club_booking === false && (!form.club_reason || form.club_reason.trim().length === 0)) errs["club_reason"] = "Reason for not clubbing required.";

    setLocalErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast("Fix conveyance errors", "error");
      return;
    }

    if (editIndex !== null) {
      const updated = [...conveyance];
      updated[editIndex] = { ...form, id: updated[editIndex].id };
      setConveyance(updated);
      addToast("Conveyance updated", "success");
    } else {
      setConveyance([...conveyance, { ...form, id: Date.now() }]);
      addToast("Conveyance added", "success");
    }
    setForm(getEmptyConveyance());
    setEditIndex(null);
    setLocalErrors({});
  };

  const onEdit = (i: number) => {
    setEditIndex(i);
    setForm(conveyance[i]);
  };

  const onDelete = (i: number) => {
    if (!confirm("Delete this conveyance?")) return;
    setConveyance(conveyance.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">Conveyance</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Vehicle Type</label>
          <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full border rounded p-2">
            <option value="">Select</option>
            <option value="company_car">Company Car</option>
            <option value="own_car">Own Car</option>
            <option value="taxi">Taxi</option>
          </select>
          {localErrors["vehicle_type"] && <div className="text-red-600 text-sm mt-1">{localErrors["vehicle_type"]}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Distance (Km) - if own car</label>
          <input type="number" value={form.distance_km ?? ""} onChange={(e) => setForm({ ...form, distance_km: e.target.value ? Number(e.target.value) : null })} className="w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium">Vehicle Airbags (if own car)</label>
          <input type="number" value={form.vehicle_airbags ?? ""} onChange={(e) => setForm({ ...form, vehicle_airbags: e.target.value ? Number(e.target.value) : null })} className="w-full border rounded p-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Estimated Cost (₹)</label>
          <input type="number" value={form.estimated_cost ?? ""} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Club Booking</label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.club_booking || false} onChange={(e) => setForm({ ...form, club_booking: e.target.checked, club_reason: e.target.checked ? "" : form.club_reason })} />
            <span className="text-sm">I agree to club booking</span>
          </div>
        </div>
      </div>

      {!form.club_booking && (
        <div className="mt-3">
          <label className="block text-sm font-medium">Reason for NOT clubbing</label>
          <input value={form.club_reason || ""} onChange={(e) => setForm({ ...form, club_reason: e.target.value })} className="w-full border rounded p-2" />
          {localErrors["club_reason"] && <div className="text-red-600 text-sm mt-1">{localErrors["club_reason"]}</div>}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button onClick={() => { setForm(getEmptyConveyance()); setEditIndex(null); setLocalErrors({}); }} className="px-3 py-2 border rounded">Clear</button>
        <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white rounded">{editIndex !== null ? "Update" : "Add"} Conveyance</button>
      </div>

      <div className="mt-6">
        <h4 className="font-medium">Added Conveyances</h4>
        {conveyance.length === 0 && <div className="text-sm text-slate-500 mt-2">No conveyance added.</div>}
        {conveyance.map((c, i) => (
          <div key={c.id} className="p-3 border rounded mt-2 flex justify-between items-center">
            <div>
              <div className="font-medium">{c.vehicle_type} • {c.from_location}→{c.to_location}</div>
              <div className="text-sm text-slate-600">{c.start_date}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(i)} className="px-2 py-1 border rounded">Edit</button>
              <button onClick={() => onDelete(i)} className="px-2 py-1 border rounded text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        {Object.entries(errors)
          .filter(([k]) => k.startsWith("conveyance"))
          .slice(0, 5)
          .map(([k, v]) => (
            <div key={k} className="text-red-600 text-sm">• {k}: {v.join(", ")}</div>
          ))}
      </div>
    </div>
  );
};

/* Advance Section */
const AdvanceSection: React.FC<{
  form: FormRoot;
  setForm: (f: FormRoot) => void;
  sums: { ticketSum: number; accSum: number; convSum: number };
  addToast: (m: string, t?: "success" | "error" | "info") => void;
  errors: Record<string, string[]>;
}> = ({ form, setForm, sums, addToast, errors }) => {
  const totalEstimate = (sums.ticketSum || 0) + (sums.accSum || 0) + (sums.convSum || 0) + (Number(form.otherExpenses || 0) || 0);

  return (
    <div>
      <h3 className="font-semibold mb-3">Advance & Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Total Estimated Cost</label>
          <div className="p-3 border rounded">₹{totalEstimate.toLocaleString("en-IN")}</div>
        </div>

        <div>
          <label className="block text-sm font-medium">Advance Required?</label>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.need_advance} onChange={(e) => setForm({ ...form, need_advance: e.target.checked, advance_amount: e.target.checked ? form.advance_amount : undefined })} />
              <span className="text-sm">Request advance</span>
            </label>
          </div>

          {form.need_advance && (
            <div className="mt-2">
              <label className="block text-sm font-medium">Advance Amount (₹)</label>
              <input type="number" min={0} value={form.advance_amount ?? ""} onChange={(e) => setForm({ ...form, advance_amount: e.target.value })} className="w-full border rounded p-2" />
              {errors["advance_amount"] && <div className="text-red-600 text-sm mt-1">{errors["advance_amount"].join(", ")}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">Other Expenses (for summary)</label>
        <input type="number" min={0} value={form.otherExpenses ?? ""} onChange={(e) => setForm({ ...form, otherExpenses: e.target.value })} className="w-full border rounded p-2" />
      </div>
    </div>
  );
};

/* ===========
   Warnings Modal Component
   =========== */
const WarningsModal: React.FC<{
  open: boolean;
  warnings: Record<string, string[]>;
  onClose: () => void;
  onAcknowledge: (ackReasons: { code: string; message: string }[]) => void;
}> = ({ open, warnings, onClose, onAcknowledge }) => {
  const [localReasons, setLocalReasons] = useState<{ code: string; message: string }[]>([]);

  useEffect(() => {
    if (!open) setLocalReasons([]);
  }, [open]);

  const keys = Object.keys(warnings || {});

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded shadow p-6">
        <h3 className="text-lg font-semibold">Policy Warnings</h3>
        <p className="text-sm text-slate-600">These items require acknowledgment before submitting. Provide reasons if you want to override.</p>

        <div className="mt-4 space-y-3">
          {keys.length === 0 && <div className="text-sm text-slate-500">No warnings.</div>}
          {keys.map((k) => (
            <div key={k} className="border rounded p-3">
              <div className="font-medium text-sm">{k}</div>
              <div className="text-sm text-amber-600 mt-1">{warnings[k].join(" • ")}</div>
              <div className="mt-2">
                <label className="block text-sm font-medium">Reason (required to override)</label>
                <input type="text" className="w-full border rounded p-2" onChange={(e) => {
                  const prev = localReasons.filter(r => r.code !== k);
                  setLocalReasons([...prev, { code: k, message: e.target.value }]);
                }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={() => onAcknowledge(localReasons)} className="px-3 py-2 bg-blue-600 text-white rounded">Acknowledge & Submit</button>
        </div>
      </div>
    </div>
  );
};

/* ===========
   Main Component (Refactored)
   =========== */

export default function MakeTravelApplicationRefactor() {
  const navigate = useNavigate();

  // master data
  const [master, setMaster] = useState<{
    glCodes: Option[];
    cities: City[];
    travelModes: TravelMode[];
    subOptionsByMode: Record<string, SubOption[]>;
    guestHouses: any[];
    arcHotels: any[];
  }>({
    glCodes: [],
    cities: [],
    travelModes: [],
    subOptionsByMode: {},
    guestHouses: [],
    arcHotels: [],
  });

  // root form state
  const [form, setForm] = useState<FormRoot>({
    purpose: "",
    internal_order: "",
    general_ledger: "",
    sanction_number: "",
    advance_amount: "",
    trip_from_location: null,
    trip_to_location: null,
    trip_start_date: null,
    trip_end_date: null,
    ticketing: [],
    accommodation: [],
    conveyance: [],
    otherExpenses: 0,
    need_advance: false,
    exception_reasons: [],
  });

  // validation results
  const [uiErrors, setUiErrors] = useState<Record<string, string[]>>({});
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({});
  const [backendWarnings, setBackendWarnings] = useState<Record<string, string[]>>({});

  // modal state for warnings
  const [warningsOpen, setWarningsOpen] = useState(false);

  // entitlements cache
  const [entitlements, setEntitlements] = useState<any>(null);

  // toast
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // show toast helper
  const addToast = (message: string, type: "success" | "error" | "info" = "info") => setToast({ message, type });

  // Master data load
  useEffect(() => {
    (async () => {
      try {
        const data = await travelApi.getMasterData();
        setMaster(data);
      } catch (err) {
        console.error("Failed load master:", err);
        addToast("Failed to load master data", "error");
      }
    })();
  }, []);

  // derived sums
  const sums = useMemo(() => {
    const ticketSum = form.ticketing.reduce((s, t) => s + Number(t.estimated_cost || 0), 0);
    const accSum = form.accommodation.reduce((s, a) => s + Number(a.estimated_cost || 0), 0);
    const convSum = form.conveyance.reduce((s, c) => s + Number(c.estimated_cost || 0), 0);
    return { ticketSum, accSum, convSum };
  }, [form]);

  // quick local validate and set uiErrors
  const runLocalValidation = (): boolean => {
    const res = localValidate(form);
    setUiErrors(res.errors);
    return res.valid;
  };

  // call entitlement endpoint (whenever from/to or grade changes)
  const fetchEntitlements = async () => {
    try {
      const resp = await travelApi.getEntitlements({
        employee_id: "CURRENT_EMP", // replace with real current user id
        from_city_id: form.trip_from_location as any,
        to_city_id: form.trip_to_location as any,
      });
      setEntitlements(resp);
    } catch (err) {
      console.error("entitlement fetch failed", err);
    }
  };

  useEffect(() => {
    // fetch entitlements when trip cities change
    if (form.trip_from_location && form.trip_to_location) {
      fetchEntitlements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.trip_from_location, form.trip_to_location]);

  // validate with backend (pre-submit). This returns errors, warnings, computed
  const callBackendValidate = async () => {
    // prepare payload in expected backend shape (adopt as needed)
    const payload = {
      employee_id: "CURRENT_EMP",
      ticketing: form.ticketing,
      accommodation: form.accommodation,
      conveyance: form.conveyance,
      purpose: form.purpose,
      internal_order: form.internal_order,
      general_ledger: form.general_ledger,
      need_advance: form.need_advance,
      advance_amount: form.advance_amount,
      trip_start_date: form.trip_start_date,
      trip_end_date: form.trip_end_date,
      // include totals so mock validate can compute sample values
      ticketingSum: sums.ticketSum,
      accommodationSum: sums.accSum,
      conveyanceSum: sums.convSum,
    };

    try {
      const resp = await travelApi.validateApplication(payload);
      setBackendErrors(resp.errors || {});
      setBackendWarnings(resp.warnings || {});
      return resp;
    } catch (err) {
      addToast("Validation call failed", "error");
      console.error(err);
      return { errors: { _internal: ["Validation service failed"] }, warnings: {}, computed: {} };
    }
  };

  // Submit flow:
  // 1. run local UI validation
  // 2. call backend validate
  // 3. if backend errors -> show inline
  // 4. if warnings -> open modal for reasons
  // 5. if OK -> call submit endpoint
  const handleSubmit = async () => {
    setBackendErrors({});
    setBackendWarnings({});
    // Step 1: local validation
    const localOk = runLocalValidation();
    if (!localOk) {
      addToast("Please fix form errors before submit", "error");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Step 2: backend validate
    const resp = await callBackendValidate();
    if (resp.errors && Object.keys(resp.errors).length > 0) {
      addToast("Validation errors from server. Please fix.", "error");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (resp.warnings && Object.keys(resp.warnings).length > 0) {
      // ask user to acknowledge and provide reasons
      setWarningsOpen(true);
      return;
    }

    // No errors/warnings -> submit
    await doSubmit([]);
  };

  const doSubmit = async (ackReasons: { code: string; message: string }[]) => {
    // assemble final payload (matches backend expectations)
    const payload = {
      employee_id: "CURRENT_EMP",
      ticketing: form.ticketing,
      accommodation: form.accommodation,
      conveyance: form.conveyance,
      purpose: form.purpose,
      internal_order: form.internal_order,
      general_ledger: form.general_ledger,
      need_advance: form.need_advance,
      advance_amount: form.advance_amount,
      trip_start_date: form.trip_start_date,
      trip_end_date: form.trip_end_date,
      acknowledged_warnings: ackReasons.map((r) => r.code),
      exception_reasons: ackReasons,
    };

    try {
      const resp = await travelApi.submitApplication(payload);
      addToast("Application submitted", "success");
      // navigate to list or detail
      navigate(`/travel/applications/${resp.travel_request_id}`);
    } catch (err) {
      console.error(err);
      addToast("Submit failed", "error");
    }
  };

  // Called when user acknowledges warnings from modal
  const onAcknowledgeWarnings = async (reasons: { code: string; message: string }[]) => {
    setWarningsOpen(false);
    // attach reason objects to payload and call submit
    await doSubmit(reasons);
  };

  const handleSaveDraft = async () => {
    // For quick drafts we can POST to create draft endpoint (not implemented here)
    addToast("Draft saved (not implemented in mock)", "info");
  };

  /* ===========
     Render
     =========== */
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Travel Application (Refactor)</h1>

      {toast && (
        <div className={`p-3 rounded mb-4 ${toast.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Purpose */}
        <div className="bg-white p-4 border rounded">
          <PurposeSection form={form} setForm={setForm} master={{ glCodes: master.glCodes }} errors={{ ...uiErrors, ...backendErrors }} />
        </div>

        {/* Ticketing */}
        <div className="bg-white p-4 border rounded">
          <TicketingSection ticketing={form.ticketing} setTicketing={(t) => setForm({ ...form, ticketing: t })} subOptionsByMode={master.subOptionsByMode} cities={master.cities} addToast={addToast} errors={{ ...uiErrors, ...backendErrors }} />
        </div>

        {/* Accommodation */}
        <div className="bg-white p-4 border rounded">
          <AccommodationSection accommodation={form.accommodation} setAccommodation={(a) => setForm({ ...form, accommodation: a })} guestHouses={master.guestHouses} addToast={addToast} errors={{ ...uiErrors, ...backendErrors }} />
        </div>

        {/* Conveyance */}
        <div className="bg-white p-4 border rounded">
          <ConveyanceSection conveyance={form.conveyance} setConveyance={(c) => setForm({ ...form, conveyance: c })} addToast={addToast} errors={{ ...uiErrors, ...backendErrors }} />
        </div>

        {/* Advance & Summary */}
        <div className="bg-white p-4 border rounded">
          <AdvanceSection form={form} setForm={setForm} sums={sums} addToast={addToast} errors={{ ...uiErrors, ...backendErrors }} />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={handleSaveDraft} className="px-4 py-2 border rounded">Save Draft</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">Validate & Submit</button>
          <button onClick={() => { runLocalValidation(); addToast("Local validation run - check errors above", "info"); }} className="px-4 py-2 border rounded">Run Local Validation</button>
        </div>

        {/* Backend Warnings Modal */}
        <WarningsModal open={warningsOpen} warnings={backendWarnings} onClose={() => setWarningsOpen(false)} onAcknowledge={onAcknowledgeWarnings} />
      </div>
    </div>
  );
}
