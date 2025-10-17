from django.shortcuts import render

# Create your views here.
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from ..models import TravelApplication, TripDetails, Booking
from ..serializers.travel_serializers import *
from apps.authentication.permissions import IsEmployee, IsAdminUser, HasCustomPermission, IsOwnerOrApprover
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

class TravelApplicationPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class TravelApplicationDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        stats = {
            'total_applications': TravelApplication.objects.filter(employee=user).count(),
            'draft': TravelApplication.objects.filter(employee=user, status='draft').count(),
            'pending': TravelApplication.objects.filter(
                employee=user, 
                status__in=['submitted', 'pending_manager', 'pending_chro', 'pending_ceo']
            ).count(),
            'approved': TravelApplication.objects.filter(
                employee=user,
                status__in=['approved_manager', 'approved_chro', 'approved_ceo', 
                          'pending_travel_desk', 'booking_in_progress', 'booked']
            ).count(),
            'rejected': TravelApplication.objects.filter(
                employee=user,
                status__in=['rejected_manager', 'rejected_chro', 'rejected_ceo']
            ).count(),
        }
        
        return Response({
            'success': True,
            'data': stats
        })

class MyDraftApplicationsView(ListAPIView):
    serializer_class = TravelApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TravelApplication.objects.filter(
            employee=self.request.user,
            status='draft'
        ).order_by('-created_at')

class MyPendingApplicationsView(ListAPIView):
    serializer_class = TravelApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # return self.request
        return TravelApplication.objects.filter(
            employee=self.request.user,
            status__in=['submitted', 'pending_manager', 'pending_chro', 'pending_ceo']
        ).order_by('-submitted_at')

class TravelApplicationListCreateView(ListCreateAPIView):
    """
    List and create travel applications (Employee access)
    """
    serializer_class = TravelApplicationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TravelApplicationPagination
    
    def get_queryset(self):
        # Employees see only their own applications
        return TravelApplication.objects.filter(
            employee=self.request.user
        ).select_related(
            'employee', 'general_ledger'
        ).prefetch_related(
            'trip_details__bookings'
        ).order_by('-created_at').order_by('-created_at')
    
    def perform_create(self, serializer):
        # Ensure the application is linked to the logged-in user
        serializer.save(employee=self.request.user)

class TravelApplicationDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, delete travel application
    """
    serializer_class = TravelApplicationSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrApprover]
    
    def get_queryset(self):
        return TravelApplication.objects.select_related('employee', 'general_ledger')

class TravelApplicationSubmitView(APIView):
    """
    Submit travel application for approval
    """
    permission_classes = [IsAuthenticated, IsEmployee or IsAdminUser]
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            travel_app = TravelApplication.objects.get(
                pk=pk, 
                employee=request.user,
                status='draft'
            )
        except TravelApplication.DoesNotExist:
            return Response(
                {'error': 'Travel application not found or already submitted'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate before submission
        serializer = TravelApplicationSubmissionSerializer(instance=travel_app, data={})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {'error': 'Validation failed', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status and timestamps
        travel_app.status = 'pending_manager'
        travel_app.submitted_at = timezone.now()
        travel_app.save(update_fields=['status', 'submitted_at'])
        
        # Set settlement due date
        travel_app.set_settlement_due_date()
        
        # Trigger approval workflow (will be implemented later)
        from apps.travel.business_logic.approval_engine import ApprovalEngine
        try:
            approval_engine = ApprovalEngine(travel_app)
            approval_engine.initiate_approval_process()
        except Exception as e:
            # Log error but don't fail submission
            print(f"{str(e)}")
            pass
        
        return Response({
            'message': 'Travel application submitted successfully',
            'travel_request_id': travel_app.get_travel_request_id(),
            'status': travel_app.status,
            'warning': 'Please contact admin to assign approvers'
        }, status=status.HTTP_201_CREATED)

class MyTravelApplicationsView(APIView):
    """
    Dashboard view for employee's travel applications
    """
    permission_classes = [IsAuthenticated, IsEmployee or IsAdminUser]
    
    def get(self, request):
        user = request.user
        
        # Get statistics
        stats = {
            'draft': TravelApplication.objects.filter(employee=user, status='draft').count(),
            'pending_approval': TravelApplication.objects.filter(
                employee=user, 
                status__in=['submitted', 'pending_manager', 'pending_chro', 'pending_ceo']
            ).count(),
            'approved': TravelApplication.objects.filter(
                employee=user,
                status__in=['approved_manager', 'approved_chro', 'approved_ceo', 
                          'pending_travel_desk', 'booking_in_progress', 'booked']
            ).count(),
            'completed': TravelApplication.objects.filter(employee=user, status='completed').count(),
            'rejected': TravelApplication.objects.filter(
                employee=user,
                status__in=['rejected_manager', 'rejected_chro', 'rejected_ceo']
            ).count(),
        }
        
        # Get recent applications
        recent_apps = TravelApplication.objects.filter(
            employee=user
        ).select_related('general_ledger').order_by('-created_at')[:5]
        
        recent_serializer = TravelApplicationSerializer(recent_apps, many=True)
        
        return Response({
            'statistics': stats,
            'recent_applications': recent_serializer.data
        })


class TravelApplicationValidationView(APIView):
    """
    Pre-submission validation endpoint
    """
    permission_classes = [IsAuthenticated, IsEmployee]
    
    def post(self, request, pk):
        try:
            travel_app = TravelApplication.objects.get(pk=pk, employee=request.user)
        except TravelApplication.DoesNotExist:
            return Response(
                {'error': 'Travel application not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        validation_results = []
        has_errors = False
        has_warnings = False
        
        # Validate each trip and booking
        for trip in travel_app.trip_details.all():
            trip_validations = {
                'trip_id': trip.id,
                'from_to': f"{trip.from_location.location_name} → {trip.to_location.location_name}",
                'departure_date': trip.departure_date,
                'return_date': trip.return_date,
                'issues': [],
                'bookings': []
            }
            
            # Trip-level validations
            try:
                from apps.travel.business_logic.validators import validate_duplicate_travel_request
                validate_duplicate_travel_request(
                    travel_app.employee, 
                    trip.departure_date, 
                    trip.return_date
                )
            except Exception as e:
                trip_validations['issues'].append({
                    'type': 'duplicate_travel',
                    'message': str(e),
                    'severity': 'error'
                })
                has_errors = True
            
            # Booking-level validations
            for booking in trip.bookings.all():
                booking_validation = {
                    'booking_id': booking.id, 
                    'booking_type': booking.booking_type.name,
                    'sub_option': booking.sub_option.name if booking.sub_option else None,
                    'estimated_cost': float(booking.estimated_cost or 0),
                    'issues': []
                }
                
                try:
                    # Advance booking validation
                    from apps.travel.business_logic.validators import validate_advance_booking
                    validate_advance_booking(
                        trip.departure_date,
                        booking.booking_type.name,
                        booking.estimated_cost or 0
                    )
                except Exception as e:
                    booking_validation['issues'].append({
                        'type': 'advance_booking',
                        'message': str(e),
                        'severity': 'error'
                    })
                    has_errors = True
                
                # Travel entitlement validation
                if booking.sub_option:
                    try:
                        from apps.travel.business_logic.validators import validate_travel_entitlement
                        validate_travel_entitlement(
                            travel_app.employee,
                            booking.booking_type,
                            booking.sub_option,
                            trip.to_location.city.category
                        )
                    except Exception as e:
                        booking_validation['issues'].append({
                            'type': 'entitlement',
                            'message': str(e),
                            'severity': 'error'
                        })
                        has_errors = True
                
                # Flight fare validation
                if booking.booking_type.name.lower() == 'flight' and booking.estimated_cost > 10000:
                    booking_validation['issues'].append({
                        'type': 'ceo_approval_required',
                        'message': f'Flight fare ₹{booking.estimated_cost} exceeds ₹10,000. CEO approval will be required.',
                        'severity': 'warning'
                    })
                    has_warnings = True
                
                # Own car distance validation
                if (booking.booking_type.name.lower() == 'car' and 
                    booking.booking_details.get('transport_type') == 'own_car'):
                    distance = booking.booking_details.get('distance_km', 0)
                    if distance > 150:
                        booking_validation['issues'].append({
                            'type': 'car_distance_limit',
                            'message': f'Own car distance {distance}km exceeds 150km limit. CHRO approval required.',
                            'severity': 'warning'
                        })
                        has_warnings = True
                    
                    # Car safety validation
                    try:
                        from apps.travel.business_logic.validators import validate_car_safety_requirements
                        validate_car_safety_requirements(booking.booking_details)
                    except Exception as e:
                        booking_validation['issues'].append({
                            'type': 'car_safety',
                            'message': str(e),
                            'severity': 'error'
                        })
                        has_errors = True
                
                trip_validations['bookings'].append(booking_validation)
            
            validation_results.append(trip_validations)
        
        # Calculate DA eligibility
        da_calculations = []
        for trip in travel_app.trip_details.all():
            duration_hours = trip.get_duration_days() * 24
            # Simplified distance calculation - you might want to enhance this
            estimated_distance = 100  # Default estimate
            
            from apps.travel.business_logic.validators import calculate_da_eligibility
            da_eligibility = calculate_da_eligibility(duration_hours, estimated_distance)
            
            if da_eligibility['eligible']:
                from apps.travel.business_logic.calculations import calculate_da_incidentals
                da_calc = calculate_da_incidentals(
                    travel_app.employee,
                    trip.get_city_category(),
                    trip.get_duration_days(),
                    duration_hours
                )
                da_calculations.append({
                    'trip_id': trip.id,
                    'eligible': True,
                    'da_type': da_eligibility['da_type'],
                    'calculations': da_calc
                })
            else:
                da_calculations.append({
                    'trip_id': trip.id,
                    'eligible': False,
                    'reason': da_eligibility['reason']
                })
        
        return Response({
            'can_submit': not has_errors,
            'has_warnings': has_warnings,
            'validation_summary': {
                'total_trips': len(validation_results),
                'errors_count': sum(len(trip.get('issues', [])) + 
                                  sum(len(booking.get('issues', [])) for booking in trip.get('bookings', [])) 
                                  for trip in validation_results),
                'warnings_count': sum(len([issue for issue in trip.get('issues', []) if issue.get('severity') == 'warning']) +
                                    sum(len([issue for issue in booking.get('issues', []) if issue.get('severity') == 'warning']) 
                                        for booking in trip.get('bookings', [])) 
                                    for trip in validation_results)
            },
            'validation_results': validation_results,
            'da_calculations': da_calculations
        })
    

class TravelApplicationCostEstimateView(APIView):
    """
    Get cost estimates for travel application
    """
    permission_classes = [IsAuthenticated, IsEmployee]
    
    def get(self, request, pk):
        try:
            travel_app = TravelApplication.objects.get(pk=pk, employee=request.user)
        except TravelApplication.DoesNotExist:
            return Response(
                {'error': 'Travel application not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cost_breakdown = {
            'travel_costs': [],
            'accommodation_costs': [],
            'da_incidentals': [],
            'total_estimated_cost': 0
        }
        
        total_cost = 0
        
        for trip in travel_app.trip_details.all():
            trip_costs = {
                'trip_id': trip.id,
                'from_to': f"{trip.from_location.location_name} → {trip.to_location.location_name}",
                'bookings': []
            }
            
            for booking in trip.bookings.all():
                booking_cost = {
                    'booking_type': booking.booking_type.name,
                    'sub_option': booking.sub_option.name if booking.sub_option else None,
                    'estimated_cost': float(booking.estimated_cost or 0)
                }
                
                if booking.booking_type.name.lower() in ['flight', 'train', 'car']:
                    cost_breakdown['travel_costs'].append(booking_cost)
                elif booking.booking_type.name.lower() == 'accommodation':
                    cost_breakdown['accommodation_costs'].append(booking_cost)
                
                total_cost += booking.estimated_cost or 0
                trip_costs['bookings'].append(booking_cost)
            
            # Calculate DA/Incidentals for this trip
            from apps.travel.business_logic.calculations import calculate_da_incidentals
            da_calc = calculate_da_incidentals(
                travel_app.employee,
                trip.get_city_category(),
                trip.get_duration_days(),
                trip.get_duration_days() * 24
            )
            
            if 'da_amount' in da_calc:
                da_entry = {
                    'trip_id': trip.id,
                    'city_category': trip.get_city_category(),
                    'duration_days': trip.get_duration_days(),
                    'da_amount': float(da_calc['da_amount']),
                    'incidental_amount': float(da_calc['incidental_amount']),
                    'total': float(da_calc['da_amount'] + da_calc['incidental_amount'])
                }
                cost_breakdown['da_incidentals'].append(da_entry)
                total_cost += da_entry['total']
        
        cost_breakdown['total_estimated_cost'] = float(total_cost)
        
        return Response(cost_breakdown)
    
class CheckBookingEntitlementView(APIView):
    """
    Check if user is entitled to specific booking type
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        sub_option_id = request.data.get('sub_option_id')
        city_category_id = request.data.get('city_category_id')
        
        if not sub_option_id or not city_category_id:
            return Response(
                {'error': 'sub_option_id and city_category_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.master_data.models import TravelSubOption, CityCategoriesMaster
        from apps.travel.business_logic.validators import check_booking_entitlement
        
        try:
            sub_option = TravelSubOption.objects.select_related('mode').get(id=sub_option_id)
            city_category = CityCategoriesMaster.objects.get(id=city_category_id)
            
            is_allowed, max_amount, message = check_booking_entitlement(
                request.user,
                sub_option.mode,
                sub_option,
                city_category
            )
            
            return Response({
                'is_allowed': is_allowed,
                'max_amount': float(max_amount) if max_amount else None,
                'message': message,
                'sub_option_name': sub_option.name,
                'city_category': city_category.name
            })
        
        except (TravelSubOption.DoesNotExist, CityCategoriesMaster.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        

class RequestAccommodationBookingView(APIView):
    """
    Request accommodation booking for approved travel application
    """
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, application_id):
        try:
            travel_app = TravelApplication.objects.get(
                id=application_id,
                employee=request.user,
                status__in=['approved_manager', 'approved_chro', 'approved_ceo']
            )
        except TravelApplication.DoesNotExist:
            return Response({'error': 'Application not found or not approved'}, status=404)
        
        results = []
        for trip in travel_app.trip_details.all():
            from apps.travel.business_logic.booking_engine import AccommodationBookingEngine
            engine = AccommodationBookingEngine(trip)
            
            result = engine.process_accommodation_request(
                guest_count=request.data.get('guest_count', 1),
                special_requests=request.data.get('special_requests', '')
            )
            results.append(result)
        
        return Response({'bookings': results})
    

class RequestVehicleBookingView(APIView):
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, application_id):
        travel_app = TravelApplication.objects.get(id=application_id, employee=request.user)
        
        vehicle_requests = request.data.get('vehicle_requests', [])
        results = []
        
        for trip_id in vehicle_requests:
            trip = travel_app.trip_details.get(id=trip_id)
            
            from apps.travel.business_logic.booking_engine import VehicleBookingEngine
            engine = VehicleBookingEngine(trip)
            
            result = engine.process_vehicle_request(request.data)
            results.append(result)
        
        return Response({'vehicle_bookings': results})