import { apiClient } from './client';
import { LoginRequest, LoginResponse, UserProfile } from '@/src/types/auth.types';
import { useNavigate, useLocation } from "react-router-dom";

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    
    if (data.success) {
      localStorage.setItem('access_token', data.data.tokens.access);
      localStorage.setItem('refresh_token', data.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('primary_dashboard', data.data.redirect_to);
      localStorage.setItem('roles', JSON.stringify(data.data.roles));
    }
    
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await apiClient.post('/auth/logout/', { refresh_token: refreshToken });
    } finally {
      localStorage.clear();
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/auth/profile/');
    return data;
  },

  switchRole: async (roleName: string) => {
    const { data } = await apiClient.post('/auth/switch-role/', { role_name: roleName });
    return data;
  },
};

