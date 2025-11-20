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
import TravelApplicationList from "./pages/common/travel/TravelApplicationList";
import ApplicationView from "./pages/common/travel/ApplicationView";
import TravelRequestApprovals from "./pages/common/travel/TravelRequestApprovals";
import BookingsPage from "./pages/common/travel/BookingsPage";
import ItinerariesPage from "./pages/common/travel/ItineraryPage";

// Master Pages (Admin Only)
import MasterPage from "./pages/common/master/MasterIndex";
import UserManagementPage from "./pages/common/master/user-management/Index";
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
                <EmployeeLayout>
                  <NewProfile />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          {/* ---------------- TRAVEL (EMPLOYEE + ADMIN) ---------------- */}
          <Route
            path={ROUTES.makeTravelApplicationOld}
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <MakeTravelApplicationOld />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.makeTravelApplication}
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <MakeTravelApplication3 />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.travelApplicationList}
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <TravelApplicationList />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.travelRequestApproval}
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <TravelRequestApprovals />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          <Route
            path="/travel/itineraries/:id"
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <ItinerariesPage />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          <Route
            path="/travel/bookings"
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <BookingsPage />
                </EmployeeLayout>
              </AuthOnly>
            }
          />

          <Route
            path={ROUTES.travelApplicationView(":id")}
            element={
              <AuthOnly>
                <EmployeeLayout>
                  <ApplicationView />
                </EmployeeLayout>
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
              </ProtectedRoute> } />

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

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);