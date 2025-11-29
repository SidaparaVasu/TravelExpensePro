export type UserType = 'organizational' | 'external';

export type Gender = 'M' | 'F' | 'O' | 'N';

export const GENDER_LABELS: Record<Gender, string> = {
  M: 'Male',
  F: 'Female',
  O: 'Other / Non-binary',
  N: 'Prefer not to say',
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  organizational: 'Organizational User',
  external: 'External User',
};

export interface User {
  id: number;
  employee_id: string | null;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: Gender;
  user_type: UserType;
  department: number | null;
  department_name: string | null;
  designation: number | null;
  designation_name: string | null;
  employee_type: number | null;
  employee_type_name: string | null;
  company: number | null;
  company_name: string | null;
  grade: number | null;
  grade_name: string | null;
  base_location: number | null;
  base_location_name: string | null;
  reporting_manager: number | null;
  reporting_manager_name: string | null;
  is_active: boolean;
  date_joined?: string;
  last_login?: string;
}

export interface OrganizationalProfileData {
  employee_id: string;
  company: number | null;
  department: number | null;
  designation: number | null;
  employee_type: number | null;
  grade: number | null;
  base_location: number | null;
  reporting_manager: number | null;
}

export interface ExternalProfileData {
  organization_name: string;
  organization_type: string;
  contact_phone: string;
  external_reference_id: string;
}

export interface UserCreatePayload {
  username: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: Gender;
  user_type: UserType;
  is_active: boolean;
  organizational_profile?: OrganizationalProfileData;
  external_profile?: ExternalProfileData;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: Gender;
  is_active?: boolean;
  organizational_profile?: Partial<OrganizationalProfileData>;
  external_profile?: Partial<ExternalProfileData>;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    total_pages: number;
    current_page: number;
    page_size: number;
    results: User[];
  };
  errors: null | Record<string, string[]>;
}

export interface UserFilters {
  search: string;
  user_type: UserType | 'organizational';
  is_active: 'true' | 'false';
  page: number;
  page_size: number;
}
