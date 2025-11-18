// components/layouts/EmployeeLayout.tsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { authAPI } from "@/src/api/auth";
import { ROUTES } from "@/routes/routes";

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
  LayoutDashboard,
  Plane,
  FilePlus,
  ClipboardIcon,
  CircleCheckBig,
  ReceiptIndianRupee,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
  Users,
  LogOut,
  ChartColumnIncreasing,
} from "lucide-react";

// -----------------------------------------------------------
// Helper functions
// -----------------------------------------------------------

const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return { username: "User" };
  }
};

const getPrimaryDashboard = () => {
  const v = localStorage.getItem("primary_dashboard");
  if (!v) return "/employee/dashboard";
  return v.startsWith("/") ? v : `/${v}`;
};

// -----------------------------------------------------------
// EMPLOYEE SIDEBAR SECTIONS
// -----------------------------------------------------------

const getEmployeeSidebar = (primaryDashboard) => [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: primaryDashboard,
  },
  {
    title: "Travel",
    icon: Plane,
    collapsible: true,
    items: [
      { label: "Create Request", path: ROUTES.makeTravelApplication, Icon: FilePlus },
      { label: "My Applications", path: ROUTES.travelApplicationList, Icon: ClipboardIcon },
      { label: "Approvals", path: ROUTES.travelRequestApproval, Icon: CircleCheckBig },
    ],
  },
  {
    title: "Expense",
    icon: ReceiptIndianRupee,
    collapsible: true,
    items: [
      { label: "Reports", path: "/expense-reports", Icon: FileText },
      { label: "Reimbursements", path: "/reimbursements", Icon: CreditCard },
    ],
  },
  {
    title: "Reports",
    icon: ChartColumnIncreasing,
    path: "/reports",
  },
];

// -----------------------------------------------------------
// Logo Component
// -----------------------------------------------------------
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

// -----------------------------------------------------------
// Layout Component
// -----------------------------------------------------------

export function EmployeeLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [activeSection, setActiveSection] = useState(null);

  const user = useMemo(() => getUserInfo(), []);
  const primaryDashboard = useMemo(() => getPrimaryDashboard(), []);
  const sections = useMemo(
    () => getEmployeeSidebar(primaryDashboard),
    [primaryDashboard]
  );

  const sidebarExpanded = !sidebarCollapsed;

  // Auto-open correct menu based on URL
  useEffect(() => {
    const section = sections.find(
      (s) =>
        s.path === location.pathname ||
        s.items?.some((item) => item.path === location.pathname)
    );

    if (section) {
      setActiveSection(section.title);
      if (section.collapsible) {
        setOpenSections((prev) => ({ ...prev, [section.title]: true }));
      }
    }
  }, [location.pathname, sections]);

  // Logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    finally {
      navigate("/login");
    }
  };

  const handleNavigate = (path) => navigate(path);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const toggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // -----------------------------------------------------------
  // JSX Rendering
  // -----------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
          sidebarExpanded ? "w-[280px]" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex h-20 items-center px-6 border-b border-gray-200">
          <Logo expanded={sidebarExpanded} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 h-[calc(100vh-5rem)]">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections[section.title];
            const items = section.items || [];
            const isActive = activeSection === section.title;

            return (
              <div key={section.title}>
                {/* Main Nav Item */}
                <button
                  onClick={() => {
                    setActiveSection(section.title);
                    if (section.collapsible && items.length > 0) {
                      toggleSection(section.title);
                    } else if (section.path) {
                      handleNavigate(section.path);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center rounded-lg py-2.5 transition-all duration-300 focus:outline-none",
                    sidebarExpanded ? "px-4 gap-3 justify-between" : "px-4 justify-center",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon 
                      className={cn(
                        "h-5 w-5 flex-shrink-0", 
                        isActive ? "text-white" : "text-gray-500"
                      )} 
                      strokeWidth={2} 
                    />
                    {sidebarExpanded && (
                      <span className="text-sm font-medium whitespace-nowrap truncate">
                        {section.title}
                      </span>
                    )}
                  </div>
                  {sidebarExpanded && section.collapsible && items.length > 0 && (
                    <ChevronDown
                      size={16}
                      className={cn(
                        "flex-shrink-0 transition-transform duration-300",
                        isOpen ? "rotate-180" : "rotate-0",
                        isActive ? "text-white" : "text-gray-500"
                      )}
                    />
                  )}
                </button>

                {/* Submenu */}
                {sidebarExpanded && section.collapsible && isOpen && items.length > 0 && (
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {items.map((item) => {
                      const ItemIcon = item.Icon;
                      const isItemActive = location.pathname === item.path;
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          className={cn(
                            "w-full flex items-center gap-3 py-2 pl-12 pr-4 text-sm rounded-lg transition-all duration-300 focus:outline-none min-w-0",
                            isItemActive
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          <ItemIcon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div 
        className={cn(
          "transition-all duration-300 min-h-screen", 
          sidebarExpanded ? "ml-[280px]" : "ml-20"
        )}
      >
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-20 bg-white border-b border-gray-200 px-6">
          <div className="flex h-full items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>

            <div className="flex items-center gap-4">
              {/* Notification */}
              <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 relative transition-colors">
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 transition-colors focus:outline-none">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-foreground">
                      {user.username}
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate(ROUTES.profile)}>
                    <Users className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}