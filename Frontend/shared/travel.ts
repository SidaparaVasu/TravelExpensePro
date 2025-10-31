// client/shared/travel.ts

export interface StatsResponse {
  activeTrips: number;
  pendingExpenses: string;
  awaitingApproval: number;
  monthlyBudget: string;
}

export interface ApprovalStats {
  pendingApproval: number;
  approvedToday: number;
  totalBudget: string;
  rejected: number;
}

export interface TravelRequest {
  id: string;
  name: string;
  avatar: string;
  from: string;
  to: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
}

export interface TravelRequestApproval {
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

export interface ExpenseReport {
  id: string;
  title: string;
  submittedBy: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  submissionDate: string;
}

export interface MonthlyExpense {
  month: string;
  amount: number;
}