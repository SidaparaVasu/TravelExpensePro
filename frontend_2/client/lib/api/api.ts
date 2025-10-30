// utils/api.ts

const API_BASE_URL = "http://127.0.0.1:8000/api"; // change to your backend URL

// Define HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Define API response shape
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * General API request function
 * @param endpoint - API endpoint (e.g. "/travel-applications/")
 * @param method - HTTP method
 * @param body - Request body (for POST/PUT)
 * @param token - JWT token (if authentication required)
 * @returns Promise<ApiResponse<T>>
 */
export async function apiRequest<T = any>(
  endpoint: string,
  method: HttpMethod = "GET",
  body: Record<string, any> | null = null,
  token: string | null = null
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (response.status === 401) {
      throw new Error("Unauthorized. Please login again.");
    }

    const data = (await response.json()) as T;

    if (!response.ok) {
      throw new Error((data as any)?.message || "Something went wrong");
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
