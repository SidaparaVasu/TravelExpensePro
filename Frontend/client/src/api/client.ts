import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL_ALT || 'http://localhost:8000/api';

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
    : import.meta.env.VITE_API_BASE_URL_ALT;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // headers: { 'Content-Type': 'application/json' },
  headers: {},
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // ✅ If the payload is FormData, let axios set correct headers
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
  
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        // alert(`new_access_token ${data.data.access}`);
        // console.log('new_access_token', data.data.access);
        
        localStorage.setItem('access_token', data.data.access);
        originalRequest.headers.Authorization = `Bearer ${data.data.access}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);