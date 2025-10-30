import { RequestHandler } from "express";
import {
  ApprovalStats,
  ExpenseReport,
  MonthlyExpense,
  StatsResponse,
  TravelRequest,
  TravelRequestApproval,
} from "@shared/travel";

// Mock data for demonstration
const mockStats: StatsResponse = {
  activeTrips: 24,
  pendingExpenses: "$12,450",
  awaitingApproval: 18,
  monthlyBudget: "$45,000",
};

const mockApprovalStats: ApprovalStats = {
  pendingApproval: 12,
  approvedToday: 8,
  totalBudget: "$45.2K",
  rejected: 3,
};

const mockTravelRequests: TravelRequest[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar:
      "https://api.builder.io/api/v1/image/assets/TEMP/4fa4c38ef3892012b166bc2fbb474ffbd49bda2e?width=100",
    from: "New York",
    to: "London",
    status: "pending",
    requestDate: "2025-01-15",
  },
  {
    id: "2",
    name: "Mike Chen",
    avatar:
      "https://api.builder.io/api/v1/image/assets/TEMP/584eb215fe812bf81c2c9ffc953c457482b1f3de?width=100",
    from: "San Francisco",
    to: "Tokyo",
    status: "approved",
    requestDate: "2025-01-14",
  },
  {
    id: "3",
    name: "Emma Davis",
    avatar:
      "https://api.builder.io/api/v1/image/assets/TEMP/39373ec2416a0763f8d322ef0bcb73c6be64dd70?width=100",
    from: "Chicago",
    to: "Berlin",
    status: "rejected",
    requestDate: "2025-01-13",
  },
];

const mockTravelRequestApprovals: TravelRequestApproval[] = [
  {
    id: "1",
    employee: {
      name: "Sarah Johnson",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/4fa4c38ef3892012b166bc2fbb474ffbd49bda2e?width=100",
      department: "Engineering",
    },
    destination: {
      location: "San Francisco, CA",
      purpose: "Client Meeting",
    },
    travelDates: {
      startDate: "2025-03-15",
      endDate: "2025-03-18",
      duration: "4 days",
    },
    budget: "$2,450",
    status: "pending",
    priority: "high",
    requestDate: "2025-01-15",
  },
  {
    id: "2",
    employee: {
      name: "Mike Chen",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/584eb215fe812bf81c2c9ffc953c457482b1f3de?width=100",
      department: "San Francisco",
    },
    destination: {
      location: "New York, NY",
      purpose: "Conference",
    },
    travelDates: {
      startDate: "2025-03-22",
      endDate: "2025-03-22",
      duration: "1 day",
    },
    budget: "$3,200",
    status: "pending",
    priority: "medium",
    requestDate: "2025-01-14",
  },
  {
    id: "3",
    employee: {
      name: "Sarah Johnson",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/4fa4c38ef3892012b166bc2fbb474ffbd49bda2e?width=100",
      department: "Engineering",
    },
    destination: {
      location: "San Francisco, CA",
      purpose: "Client Meeting",
    },
    travelDates: {
      startDate: "2025-03-15",
      endDate: "2025-03-18",
      duration: "4 days",
    },
    budget: "$2,450",
    status: "pending",
    priority: "high",
    requestDate: "2025-01-13",
  },
  {
    id: "4",
    employee: {
      name: "Mike Chen",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/584eb215fe812bf81c2c9ffc953c457482b1f3de?width=100",
      department: "San Francisco",
    },
    destination: {
      location: "New York, NY",
      purpose: "Conference",
    },
    travelDates: {
      startDate: "2025-03-22",
      endDate: "2025-03-22",
      duration: "1 day",
    },
    budget: "$3,200",
    status: "pending",
    priority: "medium",
    requestDate: "2025-01-12",
  },
];

const mockExpenseReports: ExpenseReport[] = [
  {
    id: "1",
    title: "Q1 2025 Business Travel",
    submittedBy: "Submitted by Alex Rivera",
    amount: "$3,245",
    status: "pending",
    submissionDate: "2025-01-15",
  },
  {
    id: "2",
    title: "Client Meeting Expenses",
    submittedBy: "Submitted by Lisa Park",
    amount: "$3,245",
    status: "approved",
    submissionDate: "2025-01-14",
  },
  {
    id: "3",
    title: "Conference Attendance",
    submittedBy: "Submitted by David Kim",
    amount: "$3,245",
    status: "rejected",
    submissionDate: "2025-01-13",
  },
];

const mockMonthlyExpenses: MonthlyExpense[] = [
  { month: "Jan", amount: 1500 },
  { month: "Feb", amount: 2500 },
  { month: "Mar", amount: 1000 },
  { month: "Apr", amount: 2700 },
  { month: "May", amount: 2750 },
  { month: "Jun", amount: 1600 },
  { month: "Jul", amount: 2800 },
  { month: "Aug", amount: 2900 },
  { month: "Sep", amount: 800 },
  { month: "Oct", amount: 700 },
  { month: "Nov", amount: 1900 },
  { month: "Dec", amount: 2000 },
];

// API Handlers
export const getStats: RequestHandler = (req, res) => {
  res.json(mockStats);
};

export const getApprovalStats: RequestHandler = (req, res) => {
  res.json(mockApprovalStats);
};

export const getTravelRequests: RequestHandler = (req, res) => {
  res.json(mockTravelRequests);
};

export const getTravelRequestApprovals: RequestHandler = (req, res) => {
  res.json({
    requests: mockTravelRequestApprovals,
    total: 45,
    page: 1,
    limit: 10,
  });
};

export const getExpenseReports: RequestHandler = (req, res) => {
  res.json(mockExpenseReports);
};

export const getMonthlyExpenses: RequestHandler = (req, res) => {
  res.json(mockMonthlyExpenses);
};

// ** THIS IS THE CORRECTED FUNCTION FOR THE DETAIL PAGE **
export const getTravelRequest: RequestHandler = (req, res) => {
  const { id } = req.params;
  const request = mockTravelRequestApprovals.find((r) => r.id === id);

  if (!request) {
    return res.status(404).json({ error: "Travel request not found" });
  }

  res.json(request);
};

export const updateTravelRequestStatus: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const requestIndex = mockTravelRequestApprovals.findIndex((r) => r.id === id);

  if (requestIndex === -1) {
    return res.status(404).json({ error: "Travel request not found" });
  }

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  mockTravelRequestApprovals[requestIndex].status = status as "pending" | "approved" | "rejected";
  res.json(mockTravelRequestApprovals[requestIndex]);
};

// Individual expense report handlers
export const getExpenseReport: RequestHandler = (req, res) => {
  const { id } = req.params;
  const report = mockExpenseReports.find((r) => r.id === id);

  if (!report) {
    return res.status(404).json({ error: "Expense report not found" });
  }

  res.json(report);
};

export const updateExpenseReportStatus: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const reportIndex = mockExpenseReports.findIndex((r) => r.id === id);

  if (reportIndex === -1) {
    return res.status(404).json({ error: "Expense report not found" });
  }

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  mockExpenseReports[reportIndex].status = status;
  res.json(mockExpenseReports[reportIndex]);
};