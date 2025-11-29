// Expense Claim Types based on backend serializers

export interface ExpenseType {
  id: number;
  name: string;
  code: string;
  is_distance_based: boolean;
  requires_receipt: boolean;
  max_amount_without_receipt?: number;
  is_active: boolean;
}

export interface ClaimStatus {
  id: number;
  name: string;
  label: string;
  description?: string;
}

export interface DABreakdown {
  date: string;
  hours: number;
  eligible_da: number;
  eligible_incidental: number;
}

export interface ExpenseItem {
  id?: number;
  expense_type: number;
  expense_type_display?: string;
  expense_date: string;
  amount: number;
  has_receipt: boolean;
  receipt_file?: File | string | null;
  is_self_certified: boolean;
  self_certified_reason?: string;
  distance_km?: number;
  vendor_name?: string;
  bill_number?: string;
  remarks?: string;
}

export interface ApprovalFlow {
  id: number;
  approver: number;
  approver_name: string;
  level: number;
  status: string;
  remarks?: string;
  acted_on?: string;
}

export interface ExpenseClaim {
  id: number;
  travel_application: number;
  travel_request_id: string;
  employee: number;
  employee_name: string;
  grade?: string;
  submitted_on: string;
  status: number;
  status_code: string;
  status_display: string;
  
  // Travel details
  purpose?: string;
  from_date?: string;
  to_date?: string;
  destinations?: string[];
  total_days?: number;
  
  // Financial details
  total_expenses: number;
  total_da: number;
  total_incidental: number;
  advance_received: number;
  gross_total: number;
  final_amount: number;
  settlement_due_date?: string;
  
  // Items
  expense_items: ExpenseItem[];
  da_breakdown: DABreakdown[];
  
  // Approval
  approval_flow: ApprovalFlow[];
  current_approver?: number;
  current_approver_name?: string;
}

export interface ExpenseClaimCreate {
  travel_application: number;
  expense_items: Omit<ExpenseItem, 'id' | 'expense_type_display'>[];
}

export interface ExpenseClaimValidateRequest {
  travel_application: number;
  expense_items: Omit<ExpenseItem, 'id' | 'expense_type_display'>[];
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface ExpenseClaimValidateResponse {
  is_valid: boolean;
  total_expenses: number;
  total_da: number;
  total_incidental: number;
  advance_received: number;
  gross_total: number;
  final_amount: number;
  da_breakdown: DABreakdown[];
  warnings: ValidationWarning[];
  errors: ValidationWarning[];
}

export interface ExpenseClaimActionRequest {
  action: 'approve' | 'reject';
  remarks?: string;
}

export interface ClaimListParams {
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TravelApplication {
  id: number;
  travel_request_id: string;
  purpose: string;
  from_date: string;
  to_date: string;
  total_days: number;
  destinations: string[];
  advance_taken: number;
  employee_name: string;
  grade?: string;
}
