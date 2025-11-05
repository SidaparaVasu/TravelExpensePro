import { useState, useMemo, memo } from "react";
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
  MapPinCheck,
  FileText,
  CreditCard,
  CheckCircle,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { GaugeIcon, FilePlus, ClipboardIcon, LucideIcon } from "lucide-react";
import { authAPI } from "@/src/api/auth";
import { ROUTES } from "@/routes/routes";
import { hasRole } from "@/src/utils/roles";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
  badge?: string;
  color?: string;
}

interface SidebarItem {
  label: string;
  path: string;
  Icon: LucideIcon | React.ComponentType<any>;
  adminOnly?: boolean;
  badge?: string;
  color?: string;
}

interface SidebarSection {
  title: string;
  items: readonly SidebarItem[];
  color: string;
}

interface UserInfo {
  username: string;
  email?: string;
  avatar?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_WIDTH = {
  EXPANDED: "280px",
  COLLAPSED: "72px",
} as const;

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

// ============================================================================
// Utility Functions
// ============================================================================

const getUserInfo = (): UserInfo => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return { username: "User" };
    
    const user = JSON.parse(userStr);
    return {
      username: user?.username || "User",
      email: user?.email || "user@company.com",
      avatar: user?.avatar || `${DEFAULT_AVATAR}${user?.username || "User"}`,
    };
  } catch (error) {
    console.error("Failed to parse user data:", error);
    return { username: "User", email: "user@company.com" };
  }
};

const getPrimaryDashboard = (): string => {
  return localStorage.getItem("primary_dashboard") || "/dashboard";
};

const canViewItem = (item: SidebarItem): boolean => {
  if (!item.adminOnly) return true;
  return hasRole("Admin") || hasRole("CEO") || hasRole("CHRO");
};

// ============================================================================
// Sidebar Configuration with Colors
// ============================================================================

const getSidebarSections = (primaryDashboard: string): readonly SidebarSection[] => [
  {
    title: "Dashboard",
    color: "from-violet-500 to-purple-600",
    items: [
      { label: "Overview", path: primaryDashboard, Icon: GaugeIcon, color: "violet" }
    ],
  },
  {
    title: "Travel Management",
    color: "from-blue-500 to-cyan-600",
    items: [
      { label: "Create Request", path: ROUTES.makeTravelApplication3, Icon: FilePlus, color: "blue", badge: "New" },
      { label: "My Applications", path: ROUTES.travelApplicationList, Icon: ClipboardIcon, color: "blue" },
      { label: "Approvals", path: ROUTES.travelRequestApproval, Icon: CheckCircle, color: "blue" },
      { label: "Bookings", path: "/booking", Icon: Calendar, color: "blue" },
      { label: "Itineraries", path: "/itineraries", Icon: MapPinCheck, color: "blue" },
    ],
  },
  {
    title: "Expense Management",
    color: "from-emerald-500 to-teal-600",
    items: [
      { label: "Reports", path: "/expense-reports", Icon: FileText, color: "emerald" },
      { label: "Reimbursements", path: "/reimbursements", Icon: CreditCard, color: "emerald" },
      { label: "Approvals", path: "/approvals", Icon: CheckCircle, color: "emerald" },
    ],
  },
  {
    title: "Administration",
    color: "from-orange-500 to-red-600",
    items: [
      { label: "Master Data", path: ROUTES.master, Icon: Users, adminOnly: true, color: "orange" },
      { label: "Settings", path: "/settings", Icon: Settings, adminOnly: true, color: "orange" },
    ],
  },
] as const;

// ============================================================================
// Components
// ============================================================================

/**
 * Animated Logo with gradient
 */
const Logo = memo(({ expanded }: { expanded: boolean }) => (
  <div className="flex items-center gap-3 group">
    <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
      <Sparkles className="h-6 w-6 text-white" strokeWidth={2} />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
    </div>
    <div className={cn(
      "flex flex-col transition-all duration-300",
      expanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
    )}>
      <span className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
        TravelEx Pro
      </span>
      <span className="text-xs text-gray-500 font-medium">Expense Management</span>
    </div>
  </div>
));
Logo.displayName = "Logo";

/**
 * Modern Navigation Item with animations
 */
const NavItem = memo(({ icon, label, active = false, expanded, onClick, badge, color = "blue" }: NavItemProps) => {
  const colorClasses = {
    violet: "from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
    blue: "from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
    emerald: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
    orange: "from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center rounded-xl transition-all duration-300",
        expanded ? "gap-3 px-4 py-3" : "justify-center px-4 py-3",
        active
          ? `bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg scale-[1.02]`
          : "text-gray-600 hover:bg-gray-50 hover:scale-[1.01]"
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn(
        "flex-shrink-0 transition-transform duration-300",
        active ? "text-white scale-110" : "text-gray-500 group-hover:scale-110"
      )}>
        {icon}
      </span>
      
      {expanded && (
        <>
          <span className="text-sm font-semibold whitespace-nowrap flex-1 text-left">
            {label}
          </span>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
              {badge}
            </span>
          )}
          {active && (
            <ChevronRight className="h-4 w-4 opacity-70" strokeWidth={3} />
          )}
        </>
      )}

      {/* Hover effect */}
      {!active && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-blue-500 to-purple-500" />
      )}
    </button>
  );
});
NavItem.displayName = "NavItem";

/**
 * Section with gradient accent
 */
const SidebarSection = memo(({ 
  section, 
  expanded, 
  currentPath, 
  onNavigate 
}: { 
  section: SidebarSection;
  expanded: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}) => {
  const visibleItems = useMemo(
    () => section.items.filter(canViewItem),
    [section.items]
  );

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-2">
      {expanded && (
        <div className="flex items-center gap-2 px-4 mb-3">
          <div className={cn(
            "h-1 w-8 rounded-full bg-gradient-to-r",
            section.color
          )} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {section.title}
          </h3>
        </div>
      )}
      <nav className="space-y-1" aria-label={section.title}>
        {visibleItems.map((item) => (
          <NavItem
            key={item.path}
            icon={<item.Icon className="h-5 w-5" strokeWidth={2} />}
            label={item.label}
            active={currentPath === item.path}
            expanded={expanded}
            onClick={() => onNavigate(item.path)}
            badge={item.badge}
            color={item.color}
          />
        ))}
      </nav>
    </div>
  );
});
SidebarSection.displayName = "SidebarSection";

/**
 * Modern User Menu
 */
const UserMenu = memo(({ user, onLogout, onNavigate }: {
  user: UserInfo;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 transition-all duration-300 hover:shadow-md group">
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.username}
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
          />
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900">{user.username}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-64 p-2">
      <div className="px-3 py-2 mb-2">
        <p className="text-sm font-semibold text-gray-900">{user.username}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onNavigate(ROUTES.profile)} className="rounded-lg cursor-pointer">
        <Users className="mr-3 h-4 w-4" />
        Profile
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onNavigate("/settings")} className="rounded-lg cursor-pointer">
        <Settings className="mr-3 h-4 w-4" />
        Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="rounded-lg cursor-pointer text-red-600">
        <LogOut className="mr-3 h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));
UserMenu.displayName = "UserMenu";

// ============================================================================
// Main Layout Component
// ============================================================================

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => getUserInfo(), []);
  const primaryDashboard = useMemo(() => getPrimaryDashboard(), []);
  const sections = useMemo(() => getSidebarSections(primaryDashboard), [primaryDashboard]);
  const sidebarExpanded = !sidebarCollapsed;

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

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Backdrop for mobile */}
      {sidebarExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar with glassmorphism */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-300 ease-out shadow-xl",
          sidebarExpanded ? "w-[280px]" : "w-[72px]"
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex h-20 items-center justify-between px-5 border-b border-gray-200/50">
            <Logo expanded={sidebarExpanded} />
            {sidebarExpanded && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="space-y-8">
              {sections.map((section) => (
                <SidebarSection
                  key={section.title}
                  section={section}
                  expanded={sidebarExpanded}
                  currentPath={location.pathname}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </nav>

          {/* User Profile Section */}
          {sidebarExpanded && (
            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
              <div className="flex items-center gap-3 px-3 py-2">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-out min-h-screen",
          sidebarExpanded ? "lg:ml-[280px]" : "lg:ml-[72px]"
        )}
      >
        {/* Header with glassmorphism */}
        <header className="sticky top-0 z-20 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 shadow-sm">
          <div className="flex h-full items-center justify-between max-w-[1600px] mx-auto">
            {/* Left: Menu + Breadcrumb */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Menu className="h-5 w-5 text-gray-700" strokeWidth={2} />
              </button>
              
              {/* Breadcrumb or page title can go here */}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-sm hover:shadow-md group"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" strokeWidth={2} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              {/* User Menu */}
              <UserMenu 
                user={user} 
                onLogout={handleLogout}
                onNavigate={handleNavigate}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main 
          className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto"
          role="main"
        >
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}