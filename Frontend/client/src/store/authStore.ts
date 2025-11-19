import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/src/api/auth';
import { UserProfile } from '@/src/types/auth.types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  switchRole: (roleName: string) => Promise<string | undefined>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Initialize auth on app start
      initializeAuth: () => {
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');
        const rolesStr = localStorage.getItem('roles');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            const roles = rolesStr ? JSON.parse(rolesStr) : null;

            set({
              user: { ...user, roles },
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('Failed to initialize auth:', error);
            // Clear invalid data
            localStorage.clear();
            set({ user: null, isAuthenticated: false });
          }
        }
      },

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login({ username, password });
          const { user, profile, roles, permissions } = response.data;

          // Determine redirect
          const primaryRole = roles.find(r => r.is_primary);
          const redirectTo = primaryRole
            ? `/${primaryRole.role_type}/dashboard`
            : '/employee/dashboard';

          // Update store
          set({
            user: {
              ...user,
              profile,
              roles,
              permissions
            } as any,
            isAuthenticated: true,
            isLoading: false,
          });

          return redirectTo;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.clear();
          set({ user: null, isAuthenticated: false });
        }
      },

      loadProfile: async () => {
        try {
          const profileData = await authAPI.getProfile();
          console.log('Profile loaded:', profileData);

          // Update localStorage
          if (profileData) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          set({ user: profileData });
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      },

      switchRole: async (roleName: string) => {
        try {
          const redirect_to = await authAPI.switchRole(roleName);

          // Refresh profile to update user roles
          const profile = await authAPI.getProfile();

          if (profile.data) {
            localStorage.setItem('user', JSON.stringify(profile.data));
            set({ user: profile.data });
          }

          return redirect_to;
        } catch (err) {
          console.error("Failed to switch role", err);
          throw err;
        }
      },
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);