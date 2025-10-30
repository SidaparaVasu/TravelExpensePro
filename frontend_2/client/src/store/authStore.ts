import { create } from 'zustand';
import { authAPI } from '@/src/api/auth';
import { UserProfile } from '@/src/types/auth.types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  switchRole: (roleName: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login({ username, password });
      set({ isAuthenticated: true, isLoading: false });
      return response.data.redirect_to;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authAPI.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    try {
      const profile = await authAPI.getProfile();
      console.log(profile.data);
      set({ user: profile.data });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },

  switchRole: async (roleName: string) => {
    const response = await authAPI.switchRole(roleName);
    await authAPI.getProfile().then((profile) => set({ user: profile }));
    return response.redirect_to;
  },
}));