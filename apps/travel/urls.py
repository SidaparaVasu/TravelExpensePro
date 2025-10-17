from django.urls import path
from .views.travel_views import *
from .views.approval_views import *
from .views.booking import *

urlpatterns = [
    # Travel Applications
    path('my-applications/', MyTravelApplicationsView.as_view(), name='my-travel-applications'),
    path('applications/', TravelApplicationListCreateView.as_view(), name='travel-application-list'),
    path('applications/<int:pk>/', TravelApplicationDetailView.as_view(), name='travel-application-detail'),
    path('applications/<int:pk>/submit/', TravelApplicationSubmitView.as_view(), name='travel-application-submit'),
    path('applications/<int:pk>/validate/', TravelApplicationValidationView.as_view(), name='travel-application-validate'),
    path('applications/<int:application_id>/request-accommodation/', RequestAccommodationBookingView.as_view()),

    # Approval Workflow
    path('approvals/pending/', ManagerPendingApprovalsView.as_view(), name='pending-approvals'),
    path('approvals/chro/', CHROPendingApprovalsView.as_view(), name='chro-pending-approvals'),
    path('approvals/ceo/', CEOPendingApprovalsView.as_view(), name='ceo-pending-approvals'),
    path('approvals/<int:pk>/action/', ApprovalActionView.as_view(), name='approval-action'),
    path('approvals/<int:pk>/history/', ApprovalHistoryView.as_view(), name='approval-history'),
    path('approvals/dashboard/', ApprovalDashboardView.as_view(), name='approval-dashboard'),

    # Statistics
    path('applications/stats/', TravelApplicationDashboardStatsView.as_view(), name='travel-stats'),
    path('approvals/stats/', ApprovalStatsView.as_view(), name='approval-stats'),

    # List views with filters
    path('applications/my-drafts/', MyDraftApplicationsView.as_view(), name='my-drafts'),
    path('applications/my-pending/', MyPendingApplicationsView.as_view(), name='my-pending'),

    # Booking Management
    path('bookings/check-entitlement/', CheckBookingEntitlementView.as_view(), name='check-entitlement'),
    path('bookings/accommodation/request/', AccommodationBookingRequestView.as_view(), name='accommodation-request'),
    path('bookings/vehicle/request/', VehicleBookingRequestView.as_view(), name='vehicle-request'),
    path('bookings/accommodation/', AccommodationBookingListView.as_view(), name='accommodation-list'),
    path('bookings/accommodation/<int:pk>/', AccommodationBookingDetailView.as_view(), name='accommodation-detail'),
    path('bookings/vehicle/', VehicleBookingListView.as_view(), name='vehicle-list'),
    path('bookings/vehicle/<int:pk>/', VehicleBookingDetailView.as_view(), name='vehicle-detail'),
    path('bookings/vehicle/<int:pk>/confirm/', VehicleBookingConfirmView.as_view(), name='vehicle-confirm'),
    path('bookings/status/update/', BookingStatusUpdateView.as_view(), name='booking-status-update'),
    
    # Document Management
    path('documents/upload/', TravelDocumentUploadView.as_view(), name='document-upload'),
    path('documents/', TravelDocumentListView.as_view(), name='document-list'),
    
    # Travel Desk
    path('travel-desk/dashboard/', TravelDeskDashboardView.as_view(), name='travel-desk-dashboard'),
]