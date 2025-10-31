import { apiRequest } from "./api";

// Define login response type
interface LoginResponse {
  access: string;
  refresh: string;
  user: string;
}

// Login function
export async function login(username: string, password: string) {
  return await apiRequest<LoginResponse>("/auth/login/", "POST", {
    username,
    password,
  });
}


interface LogoutResponse {
  access: string;
  refresh: string;
}

// Logout function
export async function logout(refreshToken: string, accessToken?: string) {
  const storedAccess = localStorage.getItem("access");
  return await apiRequest<LogoutResponse>("/auth/logout/", "POST", { refresh_token: refreshToken }, storedAccess || null);
}
