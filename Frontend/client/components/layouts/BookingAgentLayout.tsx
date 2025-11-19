// components/layouts/DeskAgentLayout.tsx
import { useState, useMemo } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { authAPI } from "@/src/api/auth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Bell,
  Menu,
  Plane,
  Hotel,
  Car,
  FileText,
  CheckCircle,
  BarChart3,
  Settings,
  Users,
  LogOut,
} from "lucide-react";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return { username: "User" };
  }
};

const getRoles = () => {
  try {
    const rolesData = JSON.parse(localStorage.getItem("roles") || "{}");
    return (rolesData.available || []).map((r) => r.name.toLowerCase());
  } catch {
    return [];
  }
};

const HAS_DESK_ROLE = () => {
  const roles = getRoles();
  return roles.includes("travel desk") || roles.includes("admin");
};

const NAV = [
  { label: "Travel Bookings", path: "/desk-agent/travel-bookings", icon: Plane },
  { label: "Hotel Bookings", path: "/desk-agent/hotel-bookings", icon: Hotel },
  { label: "Car Rentals", path: "/desk-agent/car-rentals", icon: Car },
  { label: "Pending Requests", path: "/desk-agent/pending-requests", icon: FileText },
  { label: "Approved Booking", path: "/desk-agent/approved-bookings", icon: CheckCircle },
  { label: "Analytics", path: "/desk-agent/analytics", icon: BarChart3 },
];

// Logo Component
const Logo = ({ expanded }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center flex-shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
        <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor" />
      </svg>
    </div>
    <span
      className={cn(
        "text-lg font-semibold text-foreground whitespace-nowrap transition-all duration-300",
        expanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
      )}
    >
      Travel Expenses Pro
    </span>
  </div>
);

export function DeskAgentLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Role protection
  if (!HAS_DESK_ROLE()) {
    return <Navigate to="/unauthorized" replace />;
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = useMemo(() => getUser(), []);
  const expanded = !sidebarCollapsed;

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
          expanded ? "w-[280px]" : "w-20"
        )}
      >
        <div className="flex h-20 items-center px-6 border-b border-gray-200">
          <Logo expanded={expanded} />
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex w-full items-center rounded-lg py-2.5 text-sm transition-all duration-300 focus:outline-none min-w-0",
                    expanded ? "gap-3 px-4" : "justify-center px-4",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-5 w-5 flex-shrink-0", 
                      isActive ? "text-white" : "text-gray-500"
                    )} 
                    strokeWidth={2} 
                  />
                  {expanded && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          expanded ? "ml-[280px]" : "ml-20"
        )}
      >
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-20 bg-white border-b border-gray-200 px-6">
          <div className="flex h-full items-center justify-between">
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 relative transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 transition-colors focus:outline-none">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground">{user.username}</span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Users className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-[calc(100vh-5rem)] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}