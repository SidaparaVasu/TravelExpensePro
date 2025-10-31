export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    tokens: {
      access: string;
      refresh: string;
    };
    user: {
      id: number;
      username: string;
      employee_id: string;
      full_name: string;
      email: string;
    };
    roles: {
      primary: {
        name: string;
        dashboard: 'employee' | 'admin';
      };
      available: Array<{
        id: number;
        name: string;
        dashboard: string;
      }>;
    };
    permissions: string[];
    redirect_to: string;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  employee_type: string,
  roles: Array<{
    name: string;
    dashboard: string;
    is_primary: boolean;
  }>;
  department: string;
  designation: string;
  grade: string;
  employeeType: string;
  company: string;
}