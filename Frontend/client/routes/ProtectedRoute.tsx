import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/src/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredDashboard?: string;
}

export default function ProtectedRoute({
  children,
  requiredDashboard,
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();

  // Not authenticated → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No dashboard requirement → allow access
  if (!requiredDashboard) return <>{children}</>;

  // Get roles from localStorage
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  
  // Check if user has a role with matching role_type
  const hasAccess = roles.some((r: any) => {
    const roleType = r.role_type?.toLowerCase();
    const required = requiredDashboard.toLowerCase();
    
    // Match exact role_type or common aliases
    if (roleType === required) return true;
    if (roleType === 'travel_desk' && required === 'travel_desk') return true;
    if (roleType === 'admin' && required === 'admin') return true;
    
    return false;
  });

  // No access → go to unauthorized page
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}