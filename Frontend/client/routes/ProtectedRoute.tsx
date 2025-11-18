import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/src/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredDashboard?: string; // "admin" | "employee" | "travel-desk"
}

export default function ProtectedRoute({
  children,
  requiredDashboard,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Extract roles correctly
  const assignedRoles = user?.roles?.available || [];
  const primaryRole = user?.roles?.primary;

  // If no requiredDashboard → allow access
  if (!requiredDashboard) return <>{children}</>;

  // Check role based access
  const hasAccess =
    primaryRole?.dashboard === requiredDashboard ||
    assignedRoles.some(
      (r) => String(r.dashboard).toLowerCase() === requiredDashboard.toLowerCase()
    );

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
