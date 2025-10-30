from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncMonth, TruncWeek
from datetime import datetime, timedelta
from utils.response_formatter import success_response
from apps.authentication.decorators import require_role
from apps.travel.models import TripDetails

class TravelAnalyticsView(APIView):
    """Travel analytics and trends"""
    permission_classes = [IsAuthenticated]
    
    @require_role('Admin', 'Finance', 'CHRO', 'CEO')
    def get(self, request):
        from apps.travel.models import TravelApplication
        
        # Date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)  # Last 90 days
        
        # Total applications
        total_apps = TravelApplication.objects.filter(
            created_at__gte=start_date
        ).count()
        
        # Status breakdown
        status_breakdown = TravelApplication.objects.filter(
            created_at__gte=start_date
        ).values('status').annotate(count=Count('id'))
        
        # Monthly trend
        monthly_trend = TravelApplication.objects.filter(
            created_at__gte=start_date
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id'),
            total_cost=Sum('estimated_total_cost')
        ).order_by('month')
        
        # Top destinations
        top_destinations = TripDetails.objects.filter(
            travel_application__created_at__gte=start_date
        ).values(
            'to_location__city_name'
        ).annotate(
            visit_count=Count('id')
        ).order_by('-visit_count')[:10]
        
        # Average approval time
        from apps.travel.models import TravelApprovalFlow
        avg_approval = TravelApprovalFlow.objects.filter(
            status='approved',
            approved_at__gte=start_date
        ).annotate(
            approval_duration=F('approved_at') - F('created_at')
        ).aggregate(
            avg_duration=Avg('approval_duration')
        )
        
        # Department-wise spending
        dept_spending = TravelApplication.objects.filter(
            created_at__gte=start_date,
            status__in=['completed', 'booked']
        ).values(
            'employee__department__dept_name'
        ).annotate(
            total_spend=Sum('estimated_total_cost'),
            trip_count=Count('id')
        ).order_by('-total_spend')[:10]
        
        return success_response(
            data={
                'summary': {
                    'total_applications': total_apps,
                    'date_range': {
                        'start': start_date.date(),
                        'end': end_date.date()
                    }
                },
                'status_breakdown': list(status_breakdown),
                'monthly_trend': [
                    {
                        'month': item['month'].strftime('%Y-%m'),
                        'count': item['count'],
                        'total_cost': float(item['total_cost'] or 0)
                    }
                    for item in monthly_trend
                ],
                'top_destinations': list(top_destinations),
                'average_approval_hours': (
                    avg_approval['avg_duration'].total_seconds() / 3600 
                    if avg_approval['avg_duration'] else 0
                ),
                'department_spending': [
                    {
                        'department': item['employee__department__dept_name'],
                        'total_spend': float(item['total_spend'] or 0),
                        'trip_count': item['trip_count']
                    }
                    for item in dept_spending
                ]
            },
            message='Analytics retrieved successfully'
        )


class ComplianceReportView(APIView):
    """Travel policy compliance report"""
    permission_classes = [IsAuthenticated]
    
    @require_role('Admin', 'CHRO', 'Finance')
    def get(self, request):
        from apps.travel.models import TravelApplication
        
        # Get applications from last 30 days
        cutoff = datetime.now() - timedelta(days=30)
        
        applications = TravelApplication.objects.filter(
            submitted_at__gte=cutoff
        ).select_related('employee')
        
        violations = []
        
        for app in applications:
            app_violations = []
            
            # Check advance booking compliance
            for trip in app.trip_details.all():
                days_ahead = (trip.departure_date - app.submitted_at.date()).days
                
                for booking in trip.bookings.all():
                    mode = booking.booking_type.name.lower()
                    
                    if mode == 'flight' and days_ahead < 7:
                        app_violations.append({
                            'type': 'advance_booking',
                            'message': f'Flight booked {days_ahead} days ahead (required: 7 days)'
                        })
                    
                    if mode == 'flight' and booking.estimated_cost > 10000:
                        # Check if CEO approval exists
                        has_ceo_approval = app.approval_flows.filter(
                            approval_level='ceo',
                            status='approved'
                        ).exists()
                        
                        if not has_ceo_approval:
                            app_violations.append({
                                'type': 'missing_approval',
                                'message': f'Flight cost ₹{booking.estimated_cost} requires CEO approval'
                            })
            
            if app_violations:
                violations.append({
                    'travel_request_id': app.get_travel_request_id(),
                    'employee': app.employee.get_full_name(),
                    'violations': app_violations
                })
        
        compliance_rate = ((applications.count() - len(violations)) / applications.count() * 100) if applications.count() > 0 else 100
        
        return success_response(
            data={
                'total_applications': applications.count(),
                'compliant': applications.count() - len(violations),
                'violations': len(violations),
                'compliance_rate': round(compliance_rate, 2),
                'violation_details': violations
            },
            message='Compliance report generated'
        )