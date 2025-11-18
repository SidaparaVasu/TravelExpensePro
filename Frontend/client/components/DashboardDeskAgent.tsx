import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Check, XCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { ROUTES } from "@/routes/routes";

/**
 * DeskAgentDashboard.tsx
 *
 * Single-file Desk Agent dashboard with mock API embedded.
 * Header: "TSF Travel — Desk Agent"
 *
 * Notes:
 * - This is read-only for applications (view only). Approve sends to booking agent (mock).
 * - Reject requires a reason.
 * - Mock API persists to localStorage under "mock_da_pending" and "mock_da_recent".
 * - Replace mock functions with real apiClient calls when backend is ready.
 */

/* ============================
   MOCK API (embedded)
   ============================ */

const LS_PENDING = "mock_da_pending";
const LS_RECENT = "mock_da_recent";
const LS_APPLICATIONS = "mock_da_applications";

function mockDelay(ms = 450) {
  return new Promise((r) => setTimeout(r, ms));
}

function seedMockDataOnce() {
  if (!localStorage.getItem(LS_PENDING)) {
    const pending = [
      {
        id: 201,
        application_id: "TR-2025-00201",
        employee_name: "Rohan Gupta",
        purpose: "Client Meeting — Delhi",
        from_location: "Jamshedpur",
        to_location: "New Delhi",
        travel_mode: "Flight",
        departure_date: "2025-11-25T09:00:00Z",
        approved_date: "2025-11-20T10:15:00Z",
        status: "approved_by_manager"
      },
      {
        id: 202,
        application_id: "TR-2025-00202",
        employee_name: "Sneha Patel",
        purpose: "CSR Audit — Ranchi",
        from_location: "Ranchi",
        to_location: "Jamshedpur",
        travel_mode: "Car",
        departure_date: "2025-11-24T07:00:00Z",
        approved_date: "2025-11-20T11:20:00Z",
        status: "approved_by_manager"
      },
      {
        id: 203,
        application_id: "TR-2025-00203",
        employee_name: "Arjun Mehta",
        purpose: "Training Workshop",
        from_location: "Kolkata",
        to_location: "Jamshedpur",
        travel_mode: "Train",
        departure_date: "2025-11-30T06:00:00Z",
        approved_date: "2025-11-19T13:00:00Z",
        status: "approved_by_manager"
      }
    ];
    localStorage.setItem(LS_PENDING, JSON.stringify(pending));
  }

  if (!localStorage.getItem(LS_RECENT)) {
    const recent = [
      {
        id: 101,
        application_id: "TR-2025-00101",
        employee_name: "Amit Sharma",
        booking_type: "Flight Booking",
        vendor: "Eastern Travels",
        confirmed_at: "2025-11-10T09:00:00Z"
      },
      {
        id: 102,
        application_id: "TR-2025-00105",
        employee_name: "Kavita Rao",
        booking_type: "Hotel Booking",
        vendor: "Clarks Inn",
        confirmed_at: "2025-11-11T16:30:00Z"
      }
    ];
    localStorage.setItem(LS_RECENT, JSON.stringify(recent));
  }

  if (!localStorage.getItem(LS_APPLICATIONS)) {
    const apps = {
      "TR-2025-00201": {
        application_id: "TR-2025-00201",
        employee_name: "Rohan Gupta",
        purpose: "Client Meeting — Delhi",
        itinerary: [
          { leg: 1, from: "Jamshedpur", to: "New Delhi", date: "2025-11-25T09:00:00Z", mode: "Flight" }
        ],
        approvals: [{ level: "manager", approver: "Suresh", status: "approved", at: "2025-11-20T10:15:00Z" }],
        booking_status: [
          // booking agent uploads later
        ],
        attachments: [] // booking agent documents (tickets/invoice) will be in this array
      },
      "TR-2025-00202": {
        application_id: "TR-2025-00202",
        employee_name: "Sneha Patel",
        purpose: "CSR Audit — Ranchi",
        itinerary: [{ leg: 1, from: "Ranchi", to: "Jamshedpur", date: "2025-11-24T07:00:00Z", mode: "Car" }],
        approvals: [{ level: "manager", approver: "A. Kumar", status: "approved", at: "2025-11-20T11:20:00Z" }],
        booking_status: [],
        attachments: []
      },
      "TR-2025-00203": {
        application_id: "TR-2025-00203",
        employee_name: "Arjun Mehta",
        purpose: "Training Workshop",
        itinerary: [{ leg: 1, from: "Kolkata", to: "Jamshedpur", date: "2025-11-30T06:00:00Z", mode: "Train" }],
        approvals: [{ level: "manager", approver: "N. Singh", status: "approved", at: "2025-11-19T13:00:00Z" }],
        booking_status: [],
        attachments: []
      }
    };
    localStorage.setItem(LS_APPLICATIONS, JSON.stringify(apps));
  }
}
seedMockDataOnce();

const mockDeskAgentAPI = {
  async getPendingRequests() {
    await mockDelay(400);
    const raw = JSON.parse(localStorage.getItem(LS_PENDING) || "[]");
    return { data: { results: raw } };
  },

  async getRecentBookings() {
    await mockDelay(300);
    const raw = JSON.parse(localStorage.getItem(LS_RECENT) || "[]");
    return { data: { results: raw } };
  },

  async getApplication(applicationId: string) {
    await mockDelay(350);
    const apps = JSON.parse(localStorage.getItem(LS_APPLICATIONS) || "{}");
    const app = apps[applicationId];
    if (!app) throw new Error("Application not found");
    return { data: app };
  },

  // send to booking agent (approve for booking)
  async sendToBooking(id: number) {
    await mockDelay(450);
    const pending = JSON.parse(localStorage.getItem(LS_PENDING) || "[]");
    const item = pending.find((p: any) => p.id === id);
    if (!item) throw new Error("Pending item not found");

    // remove from pending
    const updated = pending.filter((p: any) => p.id !== id);
    localStorage.setItem(LS_PENDING, JSON.stringify(updated));

    // push to recent bookings (mock behavior: booking agent will pick it)
    const recent = JSON.parse(localStorage.getItem(LS_RECENT) || "[]");
    recent.unshift({
      id,
      application_id: item.application_id,
      employee_name: item.employee_name,
      booking_type: `${item.travel_mode} Booking`,
      vendor: "Eastern Travels",
      confirmed_at: null
    });
    localStorage.setItem(LS_RECENT, JSON.stringify(recent));
    return { data: { success: true, message: "Forwarded to booking agent" } };
  },

  // reject with reason
  async rejectRequest(id: number, reason: string) {
    await mockDelay(450);
    const pending = JSON.parse(localStorage.getItem(LS_PENDING) || "[]");
    const item = pending.find((p: any) => p.id === id);
    if (!item) throw new Error("Pending item not found");

    // remove from pending
    const updated = pending.filter((p: any) => p.id !== id);
    localStorage.setItem(LS_PENDING, JSON.stringify(updated));

    // log rejection to console (or store in LS if you want)
    console.log("DeskAgent REJECTED:", { id, application_id: item.application_id, reason, at: new Date().toISOString() });

    return { data: { success: true, message: "Rejected" } };
  }
};

/* ============================
   Component
   ============================ */

type PendingItem = {
  id: number;
  application_id: string;
  employee_name: string;
  purpose: string;
  from_location: string;
  to_location: string;
  travel_mode: string;
  departure_date: string;
  approved_date: string;
  status: string;
};

export default function DeskAgentDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pending, setPending] = useState<PendingItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState<any | null>(null);

  // Reject modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedForAction, setSelectedForAction] = useState<PendingItem | null>(null);

  // KPIs
  const [kPending, setKPending] = useState(0);
  const [kDueToday, setKDueToday] = useState(0);
  const [k24h, setK24h] = useState(0);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const resPend = await mockDeskAgentAPI.getPendingRequests();
      const pend: PendingItem[] = resPend.data.results || [];
      setPending(pend);

      const resRecent = await mockDeskAgentAPI.getRecentBookings();
      setRecentBookings(resRecent.data.results || []);

      // KPIs
      setKPending(pend.length);
      const today = new Date();
      const dueToday = pend.filter(p => {
        if (!p.departure_date) return false;
        const d = new Date(p.departure_date);
        return d.toDateString() === today.toDateString();
      }).length;
      setKDueToday(dueToday);

      const next24 = pend.filter(p => {
        if (!p.departure_date) return false;
        const d = new Date(p.departure_date);
        const diff = d.getTime() - Date.now();
        return diff > 0 && diff <= 24 * 3600 * 1000;
      }).length;
      setK24h(next24);

    } catch (err: any) {
      console.error("Failed to load dashboard", err);
      toast({
        title: "Load failed",
        description: err?.message || "Could not fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso?: string | null) {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  const handleView = async (appIdOrItem: PendingItem) => {
    try {
      const applicationId = appIdOrItem.application_id || appIdOrItem.id;
      const res = await mockDeskAgentAPI.getApplication(applicationId);
      setViewingApp(res.data);
      setViewOpen(true);
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Cannot fetch application", variant: "destructive" });
    }
  };

  const handleSendToBooking = async (item: PendingItem) => {
    setActionLoadingId(item.id);
    try {
      await mockDeskAgentAPI.sendToBooking(item.id);
      toast({ title: "Forwarded", description: `${item.application_id} forwarded to booking agent.` });
      await loadAll();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed", description: err?.message || "Failed to forward", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openReject = (item: PendingItem) => {
    setSelectedForAction(item);
    setRejectReason("");
    setIsRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!selectedForAction) return;
    if (!rejectReason || rejectReason.trim().length < 3) {
      toast({ title: "Validation", description: "Please provide a rejection reason", variant: "destructive" });
      return;
    }
    setActionLoadingId(selectedForAction.id);
    try {
      await mockDeskAgentAPI.rejectRequest(selectedForAction.id, rejectReason);
      toast({ title: "Rejected", description: `${selectedForAction.application_id} rejected.` });
      setIsRejectOpen(false);
      setSelectedForAction(null);
      await loadAll();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed", description: err?.message || "Reject failed", variant: "destructive" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const headerUser = (() => {
    try {
      const u = localStorage.getItem("user");
      if (!u) return { username: "DeskAgent" };
      return JSON.parse(u);
    } catch {
      return { username: "DeskAgent" };
    }
  })();

  const handleLogout = () => {
    // clear auth tokens and redirect to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = ROUTES.login || "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold">
            TS
          </div>
          <div>
            <div className="text-lg font-semibold">TSF Travel — Desk Agent</div>
            <div className="text-xs text-gray-500">Operational queue & monitoring</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">Hello, <span className="font-medium">{headerUser.username || headerUser.full_name || headerUser.email}</span></div>
          <button className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{kPending}</div>
              <div className="text-sm text-muted-foreground mt-1">Awaiting action (approved by manager)</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Due Today</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{kDueToday}</div>
              <div className="text-sm text-muted-foreground mt-1">Departures scheduled today</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Within 24h</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{k24h}</div>
              <div className="text-sm text-muted-foreground mt-1">Trips starting within 24 hours</div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests (main) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Pending Travel Requests (Approved by Manager)</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-gray-500">Loading...</div>
                ) : pending.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">No pending requests at the moment.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application ID</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Departure</TableHead>
                          <TableHead>Approved At</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono">{row.application_id}</TableCell>
                            <TableCell>{row.employee_name}</TableCell>
                            <TableCell>{row.from_location} → {row.to_location}</TableCell>
                            <TableCell>{row.travel_mode}</TableCell>
                            <TableCell>{formatDate(row.departure_date)}</TableCell>
                            <TableCell>{formatDate(row.approved_date)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleView(row)} title="View application">
                                  <Eye className="w-4 h-4" />
                                </Button>

                                <Button variant="outline" size="sm" onClick={() => handleSendToBooking(row)} disabled={actionLoadingId === row.id}>
                                  {actionLoadingId === row.id ? "Processing..." : <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Send</span>}
                                </Button>

                                <Button variant="destructive" size="sm" onClick={() => openReject(row)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Recent bookings & Alerts */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <div className="text-sm text-gray-500">No recent bookings</div>
                ) : (
                  <ul className="space-y-3">
                    {recentBookings.slice(0, 6).map((b: any) => (
                      <li key={b.id} className="flex items-start gap-3">
                        <div className="mt-1">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{b.application_id} — {b.booking_type}</div>
                          <div className="text-xs text-gray-500">{b.employee_name} • {b.vendor || "Partner"}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Alerts & SLA</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <div className="text-sm text-gray-700">
                    {pending.filter(p => {
                      if (!p.departure_date) return false;
                      const diff = new Date(p.departure_date).getTime() - Date.now();
                      return diff > 0 && diff <= 48 * 3600 * 1000;
                    }).length} requests starting within 48 hours
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Standard SLA: 24 hours from manager approval</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reject modal */}
        {isRejectOpen && selectedForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Reject Travel Request</h3>
              <p className="text-sm text-gray-600 mb-4">Rejection will close the travel request and notify the requester. Provide a reason for audit.</p>

              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">Application</label>
                <div className="text-sm text-gray-800 font-mono">{selectedForAction.application_id} — {selectedForAction.employee_name}</div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">Reason</label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter rejection reason (min 10 characters)" />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setIsRejectOpen(false); setSelectedForAction(null); }}>Cancel</Button>
                <Button variant="destructive" onClick={confirmReject} disabled={actionLoadingId === selectedForAction.id}>
                  {actionLoadingId === selectedForAction.id ? "Rejecting..." : "Confirm Reject"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View application modal */}
        {viewOpen && viewingApp && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6 bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{viewingApp.application_id} — {viewingApp.employee_name}</h3>
                  <p className="text-sm text-gray-600">{viewingApp.purpose}</p>
                </div>
                <div>
                  <button className="px-3 py-2 text-sm text-gray-600" onClick={() => setViewOpen(false)}>Close</button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Itinerary</h4>
                  <ul className="space-y-2">
                    {viewingApp.itinerary?.map((it: any) => (
                      <li key={`${it.leg}-${it.date}`} className="text-sm">
                        <div className="font-medium">{it.from} → {it.to}</div>
                        <div className="text-xs text-gray-500">{new Date(it.date).toLocaleString()} • {it.mode}</div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Approvals</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {viewingApp.approvals?.map((ap: any, idx: number) => (
                      <li key={idx}>
                        <div className="font-medium">{ap.level} — {ap.approver}</div>
                        <div className="text-xs text-gray-500">{ap.status} • {new Date(ap.at).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Booking status & attachments (Booking Agent uploads)</h4>
                {Array.isArray(viewingApp.booking_status) && viewingApp.booking_status.length === 0 && viewingApp.attachments?.length === 0 ? (
                  <div className="text-sm text-gray-500">No booking actions performed yet by booking agent.</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {viewingApp.booking_status?.map((b: any, i: number) => (
                        <div key={i} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{b.type} • {b.status}</div>
                            <div className="text-xs text-gray-500">{b.updated_at ? new Date(b.updated_at).toLocaleString() : "-"}</div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{b.note}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <div className="font-medium mb-2">Attachments</div>
                      <ul className="space-y-2">
                        {viewingApp.attachments?.map((att: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              {att.filename || `Attachment ${idx + 1}`}
                            </a>
                            <div className="text-xs text-gray-500">{att.type || "document"}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
