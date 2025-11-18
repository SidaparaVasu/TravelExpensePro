import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { useApprovalStore } from '@/src/store/approvalStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { approvalApplicationList, approveTravelApplication, rejectTravelApplication } from "@/lib/api/travel_application";
import { getUser } from "@/lib/api/user";
import {
  Download,
  Filter,
  Search,
  Clock,
  CheckCircle,
  IndianRupeeIcon,
  XCircle,
  ChevronDown
} from "lucide-react";
import { api } from "@/lib/http";
import { travelAPI } from "@/lib/api/travel";
// import { approvalAPI, ApprovalApplication } from "@/lib/api/approval";
import { approvalAPI } from "@/src/api/approval";

interface ApprovalStats {
  pendingApproval: number;
  approvedToday: number;
  totalBudget: string;
  rejected: number;
}

interface TravelRequestApproval {
  id: string;
  employee: {
    name: string;
    avatar: string;
    department: string;
  };
  destination: {
    location: string;
    purpose: string;
  };
  travelDates: {
    startDate: string;
    endDate: string;
    duration: string;
  };
  budget: string;
  status: "pending" | "approved" | "rejected";
  priority: "high" | "medium" | "low";
  requestDate: string;
}

export interface TripSummary {
  from: string;
  to: string;
  departure: string;
  return: string;
  duration: number;
}

export interface TravelApplication {
  id: number;
  travel_request_id: string;
  employee_name: string;
  employee_grade: string;
  department: string;
  purpose: string;
  estimated_total_cost: string;
  status: string;
  submitted_at: string | null;
  current_approval: string | null;
  trip_summary: TripSummary[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


export default function TravelRequestApprovals() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  // const [approvals, setApprovals] = useState<ApprovalResponse | null>(null);
  // const [approvals, setApprovals] = useState<ApprovalApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default status 'pending'
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [applications, setApplications] = useState<PaginatedResponse<TravelApplication>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });

  useEffect(() => {
    // loadData();
    fetchApprovals(statusFilter);
    fetchStatistics();
  }, [statusFilter]);

  const fetchApprovals = async (filter: string) => {
    try {
      const appr: PaginatedResponse<TravelApplication> = await approvalAPI.getApprovals(statusFilter);
      setApplications(appr.data);
      // console.log(appr.results);
    } catch (err) {
      console.error("Failed to load pending approvals!", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await approvalAPI.getStats();
      setStats(stats);
      // console.log(stats.data);
    } catch (err) {
      console.error("Failed to load approval statistics!", err);
    } finally {
      setLoading(false);
    }
  };

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusUpdate = async (id: number, action: "approve" | "reject") => {
    try {
      setUpdatingId(id); // disable buttons for this request
      if (action === "approve") {
        await approvalAPI.approve(id);
      } else {
        // Prompt user for rejection reason
        const notes = prompt("Enter reason for rejection") || "";
        if (!notes) {
          alert("Rejection reason is required");
          return;
        }
        await approvalAPI.reject(id, notes);
      }

      // Update local state immediately
      setApplications(prev =>
        prev.map(req =>
          req.id === id
            ? { ...req, status: action === "approve" ? "approved_manager" : "rejected_manager" }
            : req
        )
      );

      fetchStatistics();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null); // re-enable buttons
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      pending_manager: 'default',
      pending_travel_desk: 'pending',
      approved_manager: 'success',
      rejected_manager: 'destructive',
      rejected_chro: 'destructive',
      rejected_ceo: 'destructive',
      completed: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  // const getStatusBadge = (status: string) => {
  //   const variants = {
  //     pending: "bg-orange-50 text-orange-500 hover:bg-orange-100",
  //     approved: "bg-green-50 text-green-600 hover:bg-green-100",
  //     rejected: "bg-red-50 text-red-500 hover:bg-red-100",
  //     submitted: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  //   };

  //   const labels = {
  //     pending: "Pending",
  //     approved: "Approved",
  //     rejected: "Rejected",
  //     submitted: "Submitted"
  //   };

  //   return (
  //     <Badge className={`${variants[status as keyof typeof variants]} rounded-sm px-3 py-1`}>
  //       {labels[status as keyof typeof labels]}
  //     </Badge>
  //   );
  // };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: "bg-green-100 text-green-600 border-green-200 hover:bg-green-100",
      medium: "bg-orange-50 text-orange-500 border-yellow-200 hover:bg-orange-50",
      low: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
    };

    const labels = {
      high: "High",
      medium: "Medium",
      low: "Low",
    };

    return (
      <Badge className={`${variants[priority as keyof typeof variants]} rounded-sm px-3 py-1`}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    if (startDate === endDate) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  function daysBetween(from_date: string, to_date: string) {
    // Convert strings to Date objects
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    // Calculate difference in milliseconds
    const diffTime = toDate - fromDate;

    // Convert milliseconds to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  if (loading) {
    return (
      // <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading...</div>
        </div>
      // </Layout>
    );
  }


  return (
    // <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
              Travel Request Approvals
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="h-9 w-9 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.data.pending_approval}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pending Approval
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-9 w-9 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.data.approved_today}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Approved Today
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-blue-50 flex items-center justify-center">
                    <IndianRupeeIcon className="h-9 w-9 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.data.total_budget}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Budget
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-red-50 flex items-center justify-center">
                    <XCircle className="h-9 w-9 text-red-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.data.rejected}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rejected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by employee name or request ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Requests Table */}
        <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Recent Travel Requests
              </h2>
              <div className="text-sm text-blue-800 font-medium mt-2 sm:mt-0">
                {applications?.length || 0} pending requests
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/30">
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Employee
                    </TableHead>
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Destination
                    </TableHead>
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Travel Dates
                    </TableHead>
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Budget
                    </TableHead>
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Priority
                    </TableHead>
                    <TableHead className="text-dark-600 text-center font-semibold text-xs uppercase tracking-wider">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>

                  {

                    Array.isArray(applications) && applications.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* <img
                              // src={request.employee.avatar}
                              // alt={request.employee.name}
                              className="w-12 h-12 rounded-md object-cover"
                            /> */}
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                              {request.employee_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {/* {request.employee_name} */}
                                {request.employee_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {/* {request.employee} */}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {request.trip_summary[0]?.from} → {request.trip_summary[0]?.to}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.purpose}

                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {formatDateRange(request.trip_summary[0]?.departure, request.trip_summary[0]?.return)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {/* {daysBetween(request.trip_summary[0]?.departure, request.trip_summary[0]?.return)} */}
                              {request.trip_summary[0]?.duration} Days
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {/* {request.trip_summary[0].bookings[0].booking_value} */}
                            &#x20b9;{request.estimated_total_cost}
                          </div>
                        </TableCell>
                        <TableCell>
                          {/* {request.status === "submitted" && getStatusBadge("submitted")}
                          {request.status === "pending_manager" && getStatusBadge("pending")}
                          {request.status === "approved_manager" && getStatusBadge("approved")}
                          {request.status === "rejected_manager" && getStatusBadge("rejected")} */}
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge("high")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === "pending_manager" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                  onClick={() => handleStatusUpdate(request.id, "approve")}
                                  disabled={updatingId === request.id}
                                >
                                  {updatingId === request.id ? (
                                    <>
                                      <Spinner size="sm" /> Processing
                                    </>
                                  ) : (
                                    "Approve"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStatusUpdate(request.id, "reject")}
                                  disabled={updatingId === request.id}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline"
                              // onClick={() => navigate(`/travel-request/${request.id}`)}
                              onClick={() => navigate(`/travel/travel-application/${request.id}/`)}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  }

                </TableBody>
              </Table>
              {applications.length === 0 && (
                // <center className="m-5">No pending application for approval.</center>
                <center className="m-5">
                  {statusFilter === "all" && "No travel applications for approval."}
                  {statusFilter === "pending" && "No pending applications for approval."}
                  {statusFilter === "approved" && "No approved applications for approval."}
                  {statusFilter === "rejected" && "No rejected applications for approval."}
                </center>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
                {/* Showing 1-10 of {approvals?.length || 0} requests */}
                Showing 1-10 of {applications.length || 0} requests
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive={currentPage === 1}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive={false}>
                      2
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive={false}>
                      3
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    // </Layout>
  );
}
