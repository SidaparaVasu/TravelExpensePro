import { useState, useMemo, memo, useEffect } from "react";
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
  Calendar,
  FileText,
  CreditCard,
  CircleCheckBig,
  MapPinned,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Plane,
  ReceiptIndianRupee,
  ChartColumnIncreasing,
  Database,
  Users,
  LogOut,
} from "lucide-react";
import { FilePlus, ClipboardIcon } from "lucide-react";
import { authAPI } from "@/src/api/auth";
import { ROUTES } from "@/routes/routes";
import { hasRole } from "@/src/utils/roles";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
  hasSubmenu?: boolean;
  isOpen?: boolean;
}

interface SubNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarItem {
  label: string;
  path: string;
  Icon: any;
  adminOnly?: boolean;
}

interface SidebarSection {
  title: string;
  icon: any;
  items?: readonly SidebarItem[];
  path?: string;
  adminOnly?: boolean;
  collapsible?: boolean;
}

const getUserInfo = (): any => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "User" };
    const user = JSON.parse(userStr);
    return {
      username: user?.username || "User",
      email: user?.email,
      avatar: user?.avatar,
    };
  } catch (error) {
    console.error("Failed to parse user data:", error);
    return { username: "User" };
  }
};

const getPrimaryDashboard = (): string => {
  return localStorage.getItem("primary_dashboard") || "/dashboard";
};

const getSidebarSections = (primaryDashboard: string): readonly SidebarSection[] => [
  {
    title: "Admin Dashboard",
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
      { label: "Bookings", path: "/booking", Icon: Calendar },
      { label: "Itineraries", path: "/itineraries", Icon: MapPinned },
    ],
  },
  {
    title: "Expense",
    icon: ReceiptIndianRupee,
    collapsible: true,
    items: [
      { label: "Reports", path: "/expense-reports", Icon: FileText },
      { label: "Reimbursements", path: "/reimbursements", Icon: CreditCard },
      { label: "Approvals", path: "/approvals", Icon: CircleCheckBig },
    ],
  },
  {
    title: "Reports",
    icon: ChartColumnIncreasing,
    path: "/reports",
    adminOnly: true,
  },
  {
    title: "Settings",
    icon: Settings,
    collapsible: true,
    adminOnly: true,
    items: [
      { label: "Masters", path: ROUTES.master, Icon: Database },
      // { label: "Permission", path: "/settings/permission", Icon: Database },
      // { label: "Approval Workflow", path: "/settings/workflow", Icon: Database },
      // { label: "Import", path: "/settings/import", Icon: Database },
      // { label: "Email Setting", path: "/settings/email", Icon: Database },
      // { label: "Other Configurations", path: "/settings/config", Icon: Database },
    ],
  },
] as const;

// ──────────────────────────────
// UI COMPONENTS
// ──────────────────────────────

const Logo = memo(({ expanded }: { expanded: boolean }) => (
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
));
Logo.displayName = "Logo";

const NavItem = memo(({ icon, label, active = false, expanded, onClick, hasSubmenu = false, isOpen = false }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-lg py-2.5 transition-all duration-300 focus:outline-none",
        expanded ? "gap-3 px-4 justify-between" : "justify-center px-4",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("flex-shrink-0", active ? "text-white" : "text-gray-500")}>
          {icon}
        </span>
        {expanded && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
      </div>
      {expanded && hasSubmenu && (
        <span
          className={cn(
            "transition-transform duration-300",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        >
          <ChevronDown size={16} className={active ? "text-white" : "text-gray-500"} />
        </span>
      )}
    </button>
  );
});
NavItem.displayName = "NavItem";

const SubNavItem = memo(({ icon, label, active = false, onClick }: SubNavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-300 focus:outline-none",
        active ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-50"
      )}
    >
      <span className="ml-4 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
});
SubNavItem.displayName = "SubNavItem";

const UserMenu = memo(({ user, onLogout, onNavigate }: {
  user: any;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100 transition-colors focus:outline-none">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-foreground">{user.username}</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onNavigate(ROUTES.profile)}>
        <Users className="mr-2 h-4 w-4" /> Profile
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onNavigate("/settings")}>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="text-red-600">
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));
UserMenu.displayName = "UserMenu";

// ──────────────────────────────
// MAIN LAYOUT COMPONENT
// ──────────────────────────────
export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => getUserInfo(), []);
  const primaryDashboard = useMemo(() => getPrimaryDashboard(), []);
  const sections = useMemo(() => getSidebarSections(primaryDashboard), [primaryDashboard]);
  const sidebarExpanded = !sidebarCollapsed;

  useEffect(() => {
    const currentSection = sections.find(
      (section) =>
        section.path === location.pathname ||
        section.items?.some((item) => item.path === location.pathname)
    );
    if (currentSection) {
      setActiveSection(currentSection.title);
      if (currentSection.collapsible) {
        setOpenSections({ [currentSection.title]: true });
      }
    }
  }, [location.pathname, sections]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/login");
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const isCurrentlyOpen = !!prev[title];
      const newState: Record<string, boolean> = {};
      sections.forEach((section) => {
        if (section.collapsible) {
          newState[section.title] = section.title === title ? !isCurrentlyOpen : false;
        }
      });
      return newState;
    });
    setActiveSection(title);
  };

  const canViewSection = (section: SidebarSection): boolean => {
    if (!section.adminOnly) return true;
    return hasRole("Admin") || hasRole("CEO") || hasRole("CHRO");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all overflow-hidden",
          sidebarExpanded ? "w-[280px]" : "w-20"
        )}
        style={{ transitionDuration: "300ms" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center px-6 border-b border-gray-200">
            <Logo expanded={sidebarExpanded} />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {sections.map((section) => {
                if (!canViewSection(section)) return null;

                const Icon = section.icon;
                const isOpen = openSections[section.title];
                const hasItems = section.items && section.items.length > 0;
                const isActive = activeSection === section.title;

                return (
                  <div key={section.title}>
                    <NavItem
                      icon={<Icon className="h-5 w-5" strokeWidth={2} />}
                      label={section.title}
                      active={isActive}
                      expanded={sidebarExpanded}
                      onClick={() => {
                        setActiveSection(section.title);
                        if (section.collapsible && hasItems) {
                          toggleSection(section.title);
                        } else if (section.path) {
                          handleNavigate(section.path);
                        }
                      }}
                      hasSubmenu={section.collapsible && hasItems}
                      isOpen={isOpen}
                    />

                    {sidebarExpanded && section.collapsible && hasItems && isOpen && (
                      <div className="mt-1 space-y-1">
                        {section.items?.map((item) => {
                          const ItemIcon = item.Icon;
                          return (
                            <SubNavItem
                              key={item.path}
                              icon={<ItemIcon className="h-4 w-4" strokeWidth={2} />}
                              label={item.label}
                              active={location.pathname === item.path}
                              onClick={() => handleNavigate(item.path)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      <div
        className={cn(
          "transition-all min-h-screen",
          sidebarExpanded ? "ml-[280px]" : "ml-20"
        )}
        style={{ transitionDuration: "300ms" }}
      >
        <header className="sticky top-0 z-30 h-20 bg-white border-b border-gray-200 px-6">
          <div className="flex h-full items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>

            <div className="flex items-center gap-4">
              <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
              </button>

              <UserMenu user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
