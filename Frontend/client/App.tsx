import "./global.css";
import { createRoot } from "react-dom/client";

import { isAuthenticated, isAdminUser } from "@/lib/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Route
import { ROUTES } from "@/routes/routes";

// Common pages
import NotFound from "./pages/common/NotFound";
import Login from "./pages/common/Login";
import NewProfile from "./pages/common/NewProfile";
// Dashboard
import AdminIndex from "./pages/admin/Index";
import EmployeeIndex from "./pages/employee/Index";
// Travel application
import MakeTravelApplicationOld from "./pages/common/travel/MakeTravelApplication";
import MakeTravelApplication from "./pages/common/travel/MakeTravelApplication2";
import MakeTravelApplication3 from "./pages/common/travel/MakeTravelApplication3";
import TravelApplicationList from "./pages/common/travel/TravelApplicationList";
import ApplicationView from "./pages/common/travel/ApplicationView";
import BookingsPage from "./pages/common/travel/BookingsPage";
import ItinerariesPage from "./pages/common/travel/ItineraryPage";
// Travel approval
import TravelRequestApprovals from "./pages/admin/TravelRequestApprovals";
// Master Pages
import MasterPage from "./pages/common/master/MasterIndex";
// Employee Master Pages
import EmployeeMasterPage from "./pages/common/master/employee-master/Index";
// Accommodation Pages
import GuestHouseMaster from "./pages/common/master/guest-house/Index";
import ARCHotelMaster from "./pages/common/master/arc-hotel/Index";
import LocationSPOCMasterPage from "./pages/common/master/LocationSPOCMaster";
// Geo. Master Pages
import GeographyMasters from "./pages/common/master/GeographyMaster";
import CityCategoriesMaster from "./pages/common/master/CityCategoriesMaster";
import LocationMasterPage from "./pages/common/master/LocationMaster";
// Org. Master Pages
import OrganizationMasters from "./pages/common/master/OrganizationMaster";
import EmployeeTypeMaster from "./pages/common/master/EmployeeTypeMaster";
// Travel Master Pages
import GLCodeMaster from "./pages/common/master/GLCodeMaster";
import TravelModeMaster from "./pages/common/master/TravelModeMaster";
import GradeEntitlementMaster from "./pages/common/master/NewGradeEntitlementMaster";
// Placeholder page
import { PlaceholderPage } from "./pages/PlaceholderPage";
// Grade Master Page
import GradeMasterPage from "./pages/common/master/GradeMaster";
// Approval Master Pages
import ApprovalMatrixMasterPage from "./pages/common/master/ApprovalMatrixMaster";
import DAIncidentalMasterPage  from "./pages/common/master/DAIncidentalsMaster";
import ConveyanceRateMasterPage from "./pages/common/master/ConveyanceRateMaster";
// UI Elements
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function Protected({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.root} element={<Login />} />
          {/* Login Page */}
          <Route path={ROUTES.login} element={<Login />} />
          {/* Dashboard Index Page */}
          <Route
            path={ROUTES.adminDashboard}
            element={
              <Protected>
                <AdminIndex />
              </Protected>
            }
          />
          <Route
            path={ROUTES.employeeDashboard}
            element={
              <Protected>
                <EmployeeIndex />
              </Protected>
            }
          />
          {/* Profile Page */}
          <Route
            path={ROUTES.profile}
            element={
              <Protected>
                <NewProfile />
              </Protected>
            }
          />
          {/* Travel Application */}
          <Route
            path={ROUTES.makeTravelApplicationOld}
            element={
              <Protected>
                <MakeTravelApplicationOld />
              </Protected>
            }
          />
          {/* <Route
            path={ROUTES.makeTravelApplication}
            element={
              <Protected>
                <MakeTravelApplication />
              </Protected>
            }
          /> */}
          <Route
            path={ROUTES.makeTravelApplication}
            element={
              <Protected>
                <MakeTravelApplication3 />
              </Protected>
            }
          />
          <Route
            path={ROUTES.travelApplicationList}
            element={
              <Protected>
                <TravelApplicationList />
              </Protected>
            }
          />
          <Route
            path={ROUTES.travelRequestApproval}
            element={
              <Protected>
                <TravelRequestApprovals />
              </Protected>
            }
          />

          <Route
            path={ROUTES.travelApplicationView(":id")}
            element={
              <Protected>
                <ApplicationView />
              </Protected>
            }
          />
          {/* Booking */}
          {/* <Route
            path={ROUTES.travelBookings}
            element={
              <Protected>
                <BookingsPage />
              </Protected>
            }
          />
          <Route
            path={ROUTES.itinerary(":id")}
            element={
              <Protected>
                <ItinerariesPage />
              </Protected>
            }
          /> */}
          <Route
            path="/expense-reports"
            element={
              <Protected>
                <PlaceholderPage
                  title="Expense Reports"
                  description="Submit and track expense reports"
                />
              </Protected>
            }
          />
          <Route
            path="/reimbursements"
            element={
              <Protected>
                <PlaceholderPage
                  title="Reimbursements"
                  description="Manage expense reimbursements"
                />
              </Protected>
            }
          />
          <Route
            path="/approvals"
            element={
              <Protected>
                <PlaceholderPage
                  title="Approvals"
                  description="Review and approve travel requests"
                />
              </Protected>
            }
          />
          {/* Administration */}
          <Route
            path={ROUTES.master}
            element={
              <Protected>
                <MasterPage />
              </Protected>
            }
          />
          {/* Employee Master */}
          <Route 
            path={ROUTES.employeeMasterPage}
            element={
              <Protected>
                <EmployeeMasterPage />
              </Protected>
            }
          />
          {/* Administation/Master  */}
          {/* Org. master routes */}
          <Route
            path={ROUTES.orgMaster}
            element={
              <Protected>
                <OrganizationMasters />
              </Protected>
            }
          />
          <Route
            path={ROUTES.employeeTypeMaster}
            element={
              <Protected>
                <EmployeeTypeMaster />
              </Protected>
            }
          />
          {/* Geo. master routes */}
          <Route
            path={ROUTES.geographyMaster}
            element={
              <Protected>
                <GeographyMasters />
              </Protected>
            }
          />
          <Route
            path={ROUTES.cityCategoryMaster}
            element={
              <Protected>
                <CityCategoriesMaster />
              </Protected>
            }
          />
          <Route
            path={ROUTES.locationMaster}
            element={
              <Protected>
                <LocationMasterPage />
              </Protected>
            }
          />
          {/* Grade master routes */}
          <Route
            path={ROUTES.gradeMaster}
            element={
              <Protected>
                <GradeMasterPage />
              </Protected>
            }
          />
          {/* Approval master routes */}
          <Route
            path={ROUTES.approvalMatrixMaster}
            element={
              <Protected>
                <ApprovalMatrixMasterPage />
              </Protected>
            }
          />
          {/* Conveyance Rate master routes */}
          <Route
            path={ROUTES.daIncidentalMaster}
            element={
              <Protected>
                <DAIncidentalMasterPage />
              </Protected>
            }
          />
          {/* Conveyance Rate master routes */}
          <Route
            path={ROUTES.conveyanceRateMaster}
            element={
              <Protected>
                <ConveyanceRateMasterPage />
              </Protected>
            }
          />
          {/* Travel master routes */}
          <Route
            path={ROUTES.glCodeMaster}
            element={
              <Protected>
                <GLCodeMaster />
              </Protected>
            }
          />
          <Route
            path={ROUTES.travelModeMaster}
            element={
              <Protected>
                <TravelModeMaster />
              </Protected>
            }
          />
          <Route
            path={ROUTES.gradeEntitlementMaster}
            element={
              <Protected>
                <GradeEntitlementMaster />
              </Protected>
            }
          />
          {/* Guest House master routes */}
          <Route
            path={ROUTES.guestHouseMaster}
            element={
              <Protected>
                <GuestHouseMaster />
              </Protected>
            }
          />
          {/* ARC Hotel master routes */}
          <Route
            path={ROUTES.arcHotelMaster}
            element={
              <Protected>
                <ARCHotelMaster />
              </Protected>
            }
          />
          {/* Location SPOC master routes */}
          <Route
            path={ROUTES.locationSPOCMaster}
            element={
              <Protected>
                <LocationSPOCMasterPage />
              </Protected>
            }
          />
          <Route
            path="/settings"
            element={
              <Protected>
                <PlaceholderPage
                  title="Settings"
                  description="Configure system settings"
                />
              </Protected>
            }
          />
          <Route
            path="/reports"
            element={
              <Protected>
                <PlaceholderPage
                  title="Reports"
                  description="View analytics and reports"
                />
              </Protected>
            }
          />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
