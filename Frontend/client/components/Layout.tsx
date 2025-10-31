import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

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
  User,
  Calendar,
  MapPinTrack,
  FileText,
  CreditCard,
  CheckCircle,
  Users,
  Settings,
  Reports,
  Approvals,
} from "@/assets/icons";
import { GaugeIcon, FilePlus, ClipboardIcon } from "lucide-react";
import { authAPI } from "@/src/api/auth";
import { ROUTES } from "@/routes/routes";
import { hasRole } from "@/src/utils/roles";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user info safely
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.username || "User";
  const primaryDashboard = localStorage.getItem("primary_dashboard") || "/dashboard";

  const sidebarExpanded = !sidebarCollapsed;

  const checkAdminPermission = () => {
    console.log(hasRole("Admin"), hasRole("CEO"));
    if (hasRole("Admin") || hasRole("CEO") || hasRole("CHRO")){
      return true
    }
  }

  // Sidebar sections
  const sections = [
    {
      title: "Dashboard",
      items: [{ label: "Overview", path: primaryDashboard, Icon: GaugeIcon }],
    },
    {
      title: "Travel Management",
      items: [
        // { label: "Make Travel OLD", path: ROUTES.makeTravelApplicationOld, Icon: ClipboardIcon },
        // { label: "Make Travel Request", path: ROUTES.makeTravelApplication, Icon: ClipboardIcon },
        { label: "Create Travel Request", path: ROUTES.makeTravelApplication3, Icon: FilePlus },
        { label: "My Applications", path: ROUTES.travelApplicationList, Icon: ClipboardIcon },
        { label: "Travel Approvals", path: ROUTES.travelRequestApproval, Icon: CheckCircle },
        { label: "Bookings", path: "/booking", Icon: Calendar },
        { label: "Itineraries", path: "/itineraries", Icon: MapPinTrack },
      ],
    },
    {
      title: "Expense Management",
      items: [
        { label: "Expense Reports", path: "/expense-reports", Icon: FileText },
        { label: "Reimbursements", path: "/reimbursements", Icon: CreditCard },
        { label: "Expense Approvals", path: "/approvals", Icon: CheckCircle },
      ],
    },
    {
      title: "Administration",
      items: [
        { label: "Master", path: ROUTES.master, Icon: Users, adminOnly: checkAdminPermission },
        { label: "Settings", path: "/settings", Icon: Settings, adminOnly: checkAdminPermission },
        { label: "Reports", path: "/reports", Icon: Reports, adminOnly: checkAdminPermission },
      ],
    },
  ] as const;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error: any) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white transition-all duration-700 ease-in-out border-r border-border overflow-hidden",
          sidebarExpanded ? "w-[300px]" : "w-16 sm:w-20",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span
                className={cn(
                  "text-lg font-semibold text-foreground whitespace-nowrap overflow-hidden transition-[opacity,max-width,margin] duration-700",
                  sidebarExpanded
                    ? "opacity-100 max-w-[220px] ml-2"
                    : "opacity-0 max-w-0 ml-0",
                )}
              >
                Travel Expenses Pro
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden py-4 pb-6",
              sidebarExpanded ? "px-6" : "px-5",
            )}
          >
            <div className="space-y-8">
              {sections.map((section) => {
                // Hide the whole section if it has only admin-only items
                const hasVisibleItems = section.items.some(
                  (item) => !item.adminOnly
                );
                if (!hasVisibleItems) return null;

                return (
                  <div key={section.title}>
                    {sidebarExpanded && (
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                        {section.title}
                      </h3>
                    )}
                    <div className="space-y-1 font-semibold">
                      {section.items.map(({ label, path, Icon, adminOnly }) => {
                        if (adminOnly) return null;
                        return (
                          <NavItem
                            key={label}
                            icon={<Icon className="h-4 w-4" strokeWidth='2.75'/>}
                            label={label}
                            active={location.pathname === path}
                            expanded={sidebarExpanded}
                            onClick={() => navigate(path)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-700 ease-in-out min-h-screen overflow-hidden",
          sidebarExpanded ? "ml-[300px]" : "ml-16 sm:ml-20",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 bg-white border-b border-border px-6">
          <div className="flex h-full items-center justify-between">
            <button
              aria-label="Toggle sidebar"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <button
                aria-label="Notifications"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-foreground" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-md p-1.5 hover:bg-gray-100 transition-colors">
                    <img
                      src="https://api.builder.io/api/v1/image/assets/TEMP/f608110c5bb486e70228637345583ddd9f1e7591?width=80"
                      alt={username}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {username}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(ROUTES.profile)}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="h-min-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, expanded, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-[5px] py-2 transition-colors",
        expanded ? "gap-3 px-5 text-left items-center" : "justify-center px-4",
        active
          ? "bg-primary text-primary-foreground"
          : "text-secondary-foreground hover:bg-gray-100",
      )}
    >
      <span className={cn(active ? "text-white" : "text-gray-500")}>
        {icon}
      </span>
      <span
        className={cn(
          "text-base font-medium whitespace-nowrap overflow-hidden transition-[opacity,max-width,margin] duration-700 ease-in-out",
          expanded
            ? "opacity-100 max-w-[200px] ml-2"
            : "opacity-0 max-w-0 ml-0",
        )}
      >
        {label}
      </span>
    </button>
  );
}
