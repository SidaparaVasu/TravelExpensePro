export const ROUTES = {
  // Auth
  login: "/login",
  root: "/",

  // Dashboards
  adminDashboard: "/admin/dashboard",
  employeeDashboard: "/employee/dashboard",

  // Profile
  profile: "/profile",

  // Travel Management
  makeTravelApplicationOld: "/travel/make-travel-application-old",
  // makeTravelApplication: "/travel/make-travel-application",
  makeTravelApplication: "/travel/make-travel-application",
  travelApplicationList: "/travel/travel-application-list",
  travelApplicationView: (id: number | string) => `/travel/travel-application/${id}/`,
  travelRequestApproval: "/travel/travel-request-approval",
  travelBookings: "/travel/bookings",
  itineraries: "/itineraries",

  // Expense Management
  expenseReports: "/expense-reports",
  reimbursements: "/reimbursements",
  approvals: "/approvals",

  // Administration
  // Masters
  master: "/masters",
  // company masters
  orgMaster: "/masters/organizations",
  employeeTypeMaster: "/master/employee-type",
  // geography masters
  geographyMaster: "/masters/geography",
  cityCategoryMaster: "/masters/city-categories",
  locationMaster: "/masters/location",
  // grade master
  gradeMaster: "/masters/grade",
  // travel master
  gradeEntitlementMaster: "/master/grade-entitlement",
  // approval masters
  approvalMatrixMaster: "/masters/approval-matrix",
  // accommodation masters
  guestHouseMaster: "/masters/guest-house",
  guestHouseMasterForm: "/masters/create-guest-house",
  // conveyance rate masters
  conveyanceRateMaster: "/masters/conveyance-rate",
  // da incidentals masters
  daIncidentalMaster: "/masters/da-incidentals",
  
  // travel master
  glCodeMaster: "/masters/gl-code",
  travelModeMaster: "/masters/travel-mode",
  settings: "/settings",
  reports: "/reports",
};
