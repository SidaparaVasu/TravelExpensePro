// App.tsx
import "./global.css";
import { createRoot } from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "@/routes/ProtectedRoute";
import { ROUTES } from "@/routes/routes";
import UnauthorizedPage from "./pages/common/UnauthorizedPage";

// Layouts
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { EmployeeLayout } from "@/components/layouts/EmployeeLayout";
import { BookingAgentLayout } from "@/components/layouts/BookingAgentLayout";

// Common Pages
import Login from "./pages/common/Login";
import NotFound from "./pages/common/NotFound";
import NewProfile from "./pages/common/NewProfile";

// Dashboards
import AdminIndex from "./pages/admin/Index";
import EmployeeIndex from "./pages/employee/Index";
import DeskAgentIndex from "./pages/deskagent/Index";

// Travel
import MakeTravelApplicationOld from "./pages/common/travel/MakeTravelApplication";
import MakeTravelApplication3 from "./pages/common/travel/MakeTravelApplication3";
import MakeTravelApplicationNew from "./pages/common/travel/newtravel/Index";
import TravelApplicationList from "./pages/common/travel/TravelApplicationList";
import ApplicationView from "./pages/common/travel/ApplicationView";
import TravelRequestApprovals from "./pages/common/travel/TravelRequestApprovals";
import BookingsPage from "./pages/common/travel/BookingsPage";
import ItinerariesPage from "./pages/common/travel/ItineraryPage";

// Expense
import ExpenseIndex from "./pages/common/expense/Index";
import MyClaimsPage from "./pages/common/expense/MyClaimsPage";
import ClaimDetailPage from "./pages/common/expense/ClaimDetailPage";
import CreateClaimApplicationPage from "./pages/common/expense/CreateClaimApplicationPage";
import ClaimApprovalPage from "./pages/common/expense/ClaimApprovalPage";

// Master Pages (Admin Only)
import MasterPage from "./pages/common/master/MasterIndex";
import UserManagementPage from "./pages/common/master/user-management/Index";
import UsersPage from "./pages/common/master/users/Index";
import EmployeeMasterPage from "./pages/common/master/employee-master/Index";
import GuestHouseMaster from "./pages/common/master/guest-house/Index";
import ARCHotelMaster from "./pages/common/master/arc-hotel/Index";
import LocationSPOCMasterPage from "./pages/common/master/LocationSPOCMaster";
import GeographyMasters from "./pages/common/master/GeographyMaster";
import CityCategoriesMaster from "./pages/common/master/CityCategoriesMaster";
import LocationMasterPage from "./pages/common/master/LocationMaster";
import OrganizationMasters from "./pages/common/master/OrganizationMaster";
import EmployeeTypeMaster from "./pages/common/master/EmployeeTypeMaster";
import GLCodeMaster from "./pages/common/master/GLCodeMaster";
import TravelModeMaster from "./pages/common/master/TravelModeMaster";
import GradeEntitlementMaster from "./pages/common/master/NewGradeEntitlementMaster";
import GradeMasterPage from "./pages/common/master/GradeMaster";
import ApprovalMatrixMasterPage from "./pages/common/master/ApprovalMatrixMaster";
import DAIncidentalMasterPage from "./pages/common/master/DAIncidentalsMaster";
import ConveyanceRateMasterPage from "./pages/common/master/ConveyanceRateMaster";
import ExpenseTypesMasterPage from "./pages/common/master/ExpenseTypeMaster";
import ClaimStatusMasterPage from "./pages/common/master/ClaimStatusMaster";

// UI
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

/**
 * Basic Auth Guard (employee/admin)
 */
function AuthOnly({ children }: { children: JSX.Element }) {
  return localStorage.getItem("access_token")
    ? children
    : <Navigate to={ROUTES.login} replace />;
}

const isAdminUser = () => {
  const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  return roles.some((r: any) =>
    ["admin", "manager", "chro", "ceo"].includes(r.role_type?.toLowerCase())
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          {/* ---------------- UNAUTHORIZED / 404 ---------------- */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFound />} />

          {/* ---------------- AUTH ---------------- */}
          <Route path="/" element={<Login />} />
          <Route path={ROUTES.login} element={<Login />} />

          {/* ---------------- EMPLOYEE DASHBOARD ---------------- */}
          <Route
            path={ROUTES.employeeDashboard}
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <EmployeeIndex />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          {/* ---------------- ADMIN DASHBOARD ---------------- */}
          <Route
            path={ROUTES.adminDashboard}
            element={
              <ProtectedRoute requiredDashboard="admin">
                <AdminLayout>
                  <AdminIndex />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ---------------- DESK AGENT DASHBOARD ---------------- */}
          <Route
            path={ROUTES.deskAgentDashboard}
            element={
              <ProtectedRoute requiredDashboard="travel_desk">
                <DeskAgentIndex />
              </ProtectedRoute>
            }
          />

          {/* ---------------- PROFILE ---------------- */}
          <Route
            path={ROUTES.profile}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <NewProfile />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <NewProfile />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />


          {/* ---------------- TRAVEL (EMPLOYEE + ADMIN) ---------------- */}
          <Route
            path={ROUTES.makeTravelApplicationOld}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <MakeTravelApplicationOld />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <MakeTravelApplicationOld />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.makeTravelApplication(":id?")}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <MakeTravelApplication3 />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <MakeTravelApplication3 />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.makeTravelApplicationNew}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <MakeTravelApplicationNew />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <MakeTravelApplicationNew />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.travelApplicationList}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <TravelApplicationList />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <TravelApplicationList />
                  </EmployeeLayout>
                )}
              </AuthOnly>

            }
          />

          <Route
            path={ROUTES.travelRequestApproval}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <TravelRequestApprovals />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <TravelRequestApprovals />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path="/travel/itineraries/:id"
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <ItinerariesPage />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <ItinerariesPage />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path="/travel/bookings"
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <BookingsPage />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <BookingsPage />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.travelApplicationView(":id")}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <ApplicationView />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <ApplicationView />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          {/* ---------------- EXPENSE (EMPLOYEE + ADMIN) ---------------- */}
          <Route
            path={ROUTES.indexExpense}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <ExpenseIndex />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <ExpenseIndex />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.indexClaimPage}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <MyClaimsPage />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <MyClaimsPage />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.claimDetailPage(":id")}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <ClaimDetailPage />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <ClaimDetailPage />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.claimApplicationPage}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <CreateClaimApplicationPage />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <CreateClaimApplicationPage />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.claimApprovalPage}
            element={
              <AuthOnly>
                {isAdminUser() ? (
                  <AdminLayout>
                    <ClaimApprovalPage />
                  </AdminLayout>
                ) : (
                  <EmployeeLayout>
                    <ClaimApprovalPage />
                  </EmployeeLayout>
                )}
              </AuthOnly>
            }
          />

          {/* ---------------- MASTER PAGES (ADMIN ONLY) ---------------- */}
          <Route
            path={ROUTES.master}
            element={
              <ProtectedRoute requiredDashboard="admin">
                <AdminLayout>
                  <MasterPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.employeeMasterPage}
            element={
              <ProtectedRoute requiredDashboard="admin">
                <AdminLayout>
                  <EmployeeMasterPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* All other master routes */}
          <Route path={ROUTES.userManagement} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><UserManagementPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.users} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><UsersPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.orgMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><OrganizationMasters /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.employeeTypeMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><EmployeeTypeMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.geographyMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><GeographyMasters /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.cityCategoryMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><CityCategoriesMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.locationMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><LocationMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.gradeMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><GradeMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.approvalMatrixMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><ApprovalMatrixMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.daIncidentalMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><DAIncidentalMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.conveyanceRateMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><ConveyanceRateMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.glCodeMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><GLCodeMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.travelModeMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><TravelModeMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.gradeEntitlementMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><GradeEntitlementMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.guestHouseMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><GuestHouseMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.arcHotelMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><ARCHotelMaster /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.locationSPOCMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><LocationSPOCMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.expenseTypeMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><ExpenseTypesMasterPage /></AdminLayout>
            </ProtectedRoute>} />

          <Route path={ROUTES.claimStatusMaster} element={
            <ProtectedRoute requiredDashboard="admin">
              <AdminLayout><ClaimStatusMasterPage /></AdminLayout>
            </ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

import { HelmetProvider } from "react-helmet-async";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <App />
    </LocalizationProvider>
  </HelmetProvider>
);