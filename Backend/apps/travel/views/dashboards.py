from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta
from apps.authentication.models.user import User
from utils.response_formatter import success_response
from apps.authentication.decorators import require_role

class EmployeeDashboardView(APIView):
    """Comprehensive employee dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.travel.models import TravelApplication
        
        user = request.user
        
        # Status counts
        status_counts = {
            'draft': TravelApplication.objects.filter(employee=user, status='draft').count(),
            'pending': TravelApplication.objects.filter(
                employee=user,
                status__in=['pending_manager', 'pending_chro', 'pending_ceo']
            ).count(),
            'approved': TravelApplication.objects.filter(
                employee=user,
                status__in=['approved_manager', 'approved_chro', 'approved_ceo', 'pending_travel_desk']
            ).count(),
            'booked': TravelApplication.objects.filter(employee=user, status__in=['booking_in_progress', 'booked']).count(),
            'completed': TravelApplication.objects.filter(employee=user, status='completed').count(),
            'rejected': TravelApplication.objects.filter(
                employee=user,
                status__in=['rejected_manager', 'rejected_chro', 'rejected_ceo']
            ).count(),
        }
        
        # Recent applications
        recent = TravelApplication.objects.filter(employee=user).order_by('-created_at')[:5]
        recent_data = [{
            'id': app.id,
            'travel_request_id': app.get_travel_request_id(),
            'purpose': app.purpose[:50],
            'status': app.status,
            'created_at': app.created_at,
            'estimated_cost': float(app.estimated_total_cost or 0)
        } for app in recent]
        
        # Upcoming travels
        today = timezone.now().date()
        upcoming = TravelApplication.objects.filter(
            employee=user,
            status__in=['booked', 'approved_manager', 'approved_chro', 'approved_ceo'],
            trip_details__departure_date__gte=today
        ).distinct().order_by('trip_details__departure_date')[:5]
        
        upcoming_data = [{
            'id': app.id,
            'travel_request_id': app.get_travel_request_id(),
            'departure_date': app.trip_details.first().departure_date if app.trip_details.exists() else None,
            'destination': app.trip_details.first().to_location.city_name if app.trip_details.exists() else None
        } for app in upcoming]
        
        # Settlement pending
        settlement_pending = TravelApplication.objects.filter(
            employee=user,
            status='completed',
            is_settled=False
        ).count()
        
        return success_response(
            data={
                'status_counts': status_counts,
                'recent_applications': recent_data,
                'upcoming_travels': upcoming_data,
                'settlement_pending': settlement_pending,
                'total_applications': TravelApplication.objects.filter(employee=user).count()
            },
            message='Dashboard data retrieved successfully'
        )


class ManagerDashboardView(APIView):
    """Manager dashboard with team statistics"""
    permission_classes = [IsAuthenticated]
    
    @require_role('Manager', 'CHRO', 'CEO', 'Admin')
    def get(self, request):
        from apps.travel.models import TravelApplication, TravelApprovalFlow
        
        user = request.user
        
        # Pending approvals
        pending = TravelApprovalFlow.objects.filter(
            approver=user,
            status='pending'
        ).count()
        
        # Team statistics (subordinates)
        team_members = User.objects.filter(reporting_manager=user)
        team_travel_count = TravelApplication.objects.filter(
            employee__in=team_members
        ).count()
        
        # This month's approvals
        this_month = timezone.now().replace(day=1)
        approvals_this_month = TravelApprovalFlow.objects.filter(
            approver=user,
            status='approved',
            approved_at__gte=this_month
        ).count()
        
        # Budget overview
        pending_budget = TravelApplication.objects.filter(
            approval_flows__approver=user,
            approval_flows__status='pending'
        ).aggregate(total=Sum('estimated_total_cost'))['total'] or 0
        
        # Average approval time
        avg_time = TravelApprovalFlow.objects.filter(
            approver=user,
            status='approved'
        ).annotate(
            approval_time=F('approved_at') - F('created_at')
        ).aggregate(avg=Avg('approval_time'))
        
        return success_response(
            data={
                'pending_approvals': pending,
                'team_size': team_members.count(),
                'team_travel_requests': team_travel_count,
                'approvals_this_month': approvals_this_month,
                'pending_budget': float(pending_budget),
                'average_approval_hours': avg_time['avg'].total_seconds() / 3600 if avg_time['avg'] else 0
            },
            message='Manager dashboard retrieved successfully'
        )


class TravelDeskDashboardEnhancedView(APIView):
    """Enhanced travel desk dashboard"""
    permission_classes = [IsAuthenticated]
    permission_required = 'booking_manage'
    
    def get(self, request):
        from apps.travel.models import TravelApplication, AccommodationBooking, VehicleBooking
        
        # Applications pending travel desk
        pending_apps = TravelApplication.objects.filter(
            status='pending_travel_desk'
        ).count()
        
        # Booking statistics
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        booking_stats = {
            'accommodation': {
                'pending': AccommodationBooking.objects.filter(status='pending').count(),
                'this_week': AccommodationBooking.objects.filter(created_at__gte=week_start).count(),
            },
            'vehicle': {
                'pending': VehicleBooking.objects.filter(status='pending').count(),
                'this_week': VehicleBooking.objects.filter(created_at__gte=week_start).count(),
            }
        }
        
        # Upcoming bookings
        upcoming = AccommodationBooking.objects.filter(
            check_in_date__gte=today,
            check_in_date__lte=today + timedelta(days=7),
            status__in=['guest_house_confirmed', 'arc_hotel_confirmed']
        ).count()
        
        return success_response(
            data={
                'pending_applications': pending_apps,
                'booking_statistics': booking_stats,
                'upcoming_check_ins': upcoming
            },
            message='Travel desk dashboard retrieved successfully'
        )