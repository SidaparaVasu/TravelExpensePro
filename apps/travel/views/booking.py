from datetime import timezone
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.shortcuts import get_object_or_404

from ..models import (
    TravelApplication, TripDetails, AccommodationBooking, 
    VehicleBooking, TravelDocument
)
from ..serializers.booking import (
    AccommodationBookingSerializer, VehicleBookingSerializer,
    TravelDocumentSerializer, AccommodationRequestSerializer,
    VehicleRequestSerializer
)
from ..business_logic.booking_engine import AccommodationBookingEngine, VehicleBookingEngine
from ...authentication.permissions import IsEmployee, HasCustomPermission

class AccommodationBookingRequestView(APIView):
    """
    Request accommodation booking with priority logic
    """
    permission_classes = [IsAuthenticated, IsEmployee]
    
    @transaction.atomic
    def post(self, request):
        serializer = AccommodationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        trip_id = serializer.validated_data['trip_id']
        
        # Get trip details and verify ownership
        trip = get_object_or_404(
            TripDetails,
            id=trip_id,
            travel_application__employee=request.user
        )
        
        # Check if accommodation already requested
        if trip.accommodation_bookings.exists():
            return Response(
                {'error': 'Accommodation already requested for this trip'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process accommodation request using booking engine
        booking_engine = AccommodationBookingEngine(trip)
        result = booking_engine.process_accommodation_request(
            guest_count=serializer.validated_data['guest_count'],
            special_requests=serializer.validated_data.get('special_requests', '')
        )
        
        return Response(result)

class VehicleBookingRequestView(APIView):
    """
    Request vehicle booking with SPOC coordination
    """
    permission_classes = [IsAuthenticated, IsEmployee]
    
    @transaction.atomic
    def post(self, request):
        serializer = VehicleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        trip_id = serializer.validated_data['trip_id']
        
        # Get trip details and verify ownership
        trip = get_object_or_404(
            TripDetails,
            id=trip_id,
            travel_application__employee=request.user
        )
        
        # Process vehicle request using booking engine
        booking_engine = VehicleBookingEngine(trip)
        result = booking_engine.process_vehicle_request(serializer.validated_data)
        
        return Response(result)

class AccommodationBookingListView(ListCreateAPIView):
    """
    List accommodation bookings (Travel Desk)
    """
    serializer_class = AccommodationBookingSerializer
    permission_classes = [IsAuthenticated, HasCustomPermission]
    permission_required = 'booking_manage'
    
    def get_queryset(self):
        return AccommodationBooking.objects.select_related(
            'trip_details__travel_application__employee',
            'guest_house', 'arc_hotel'
        ).order_by('-created_at')

class AccommodationBookingDetailView(RetrieveUpdateDestroyAPIView):
    """
    Manage accommodation booking (Travel Desk)
    """
    serializer_class = AccommodationBookingSerializer
    permission_classes = [IsAuthenticated, HasCustomPermission]
    permission_required = 'booking_manage'
    
    def get_queryset(self):
        return AccommodationBooking.objects.select_related(
            'guest_house', 'arc_hotel'
        )

class VehicleBookingListView(ListCreateAPIView):
    """
    List vehicle bookings (SPOC/Travel Desk)
    """
    serializer_class = VehicleBookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # SPOCs see only their assigned bookings
        if user.locationspoc_set.exists():
            return VehicleBooking.objects.filter(
                assigned_spoc__spoc_user=user
            ).select_related('trip_details__travel_application__employee')
        
        # Travel desk sees all bookings
        elif user.has_role('Travel Desk'):
            return VehicleBooking.objects.select_related(
                'trip_details__travel_application__employee',
                'assigned_spoc__spoc_user'
            ).order_by('-created_at')
        
        return VehicleBooking.objects.none()

class VehicleBookingDetailView(RetrieveUpdateDestroyAPIView):
    """
    Manage vehicle booking (SPOC/Travel Desk)
    """
    serializer_class = VehicleBookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.locationspoc_set.exists():
            return VehicleBooking.objects.filter(assigned_spoc__spoc_user=user)
        elif user.has_role('Travel Desk'):
            return VehicleBooking.objects.all()
        
        return VehicleBooking.objects.none()

class VehicleBookingConfirmView(APIView):
    """
    Confirm vehicle booking with driver and vehicle details (SPOC)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        vehicle_booking = get_object_or_404(
            VehicleBooking,
            pk=pk,
            assigned_spoc__spoc_user=request.user
        )
        
        # Update booking with confirmation details
        vehicle_booking.vendor_name = request.data.get('vendor_name', '')
        vehicle_booking.driver_name = request.data.get('driver_name', '')
        vehicle_booking.driver_phone = request.data.get('driver_phone', '')
        vehicle_booking.vehicle_number = request.data.get('vehicle_number', '')
        vehicle_booking.duty_slip_number = request.data.get('duty_slip_number', '')
        vehicle_booking.status = 'vehicle_assigned'
        vehicle_booking.save()
        
        # Generate duty slip (placeholder)
        duty_slip_data = self.generate_duty_slip(vehicle_booking)
        
        return Response({
            'message': 'Vehicle booking confirmed',
            'duty_slip_number': vehicle_booking.duty_slip_number,
            'driver_details': {
                'name': vehicle_booking.driver_name,
                'phone': vehicle_booking.driver_phone,
                'vehicle': vehicle_booking.vehicle_number
            }
        })
    
    def generate_duty_slip(self, vehicle_booking):
        """Generate duty slip (placeholder implementation)"""
        import uuid
        if not vehicle_booking.duty_slip_number:
            vehicle_booking.duty_slip_number = f"DS-{uuid.uuid4().hex[:8].upper()}"
            vehicle_booking.save()
        return vehicle_booking.duty_slip_number

class TravelDocumentUploadView(APIView):
    """
    Upload travel-related documents
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        travel_app_id = request.data.get('travel_application')
        
        # Verify user can upload to this application
        travel_app = get_object_or_404(
            TravelApplication,
            id=travel_app_id
        )
        
        # Check permissions
        if (travel_app.employee != request.user and 
            not request.user.has_role('Travel Desk') and
            not request.user.has_role('Admin')):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TravelDocumentSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        document = serializer.save(
            travel_application=travel_app,
            uploaded_by=request.user
        )
        
        return Response(
            TravelDocumentSerializer(document, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

class TravelDocumentListView(ListCreateAPIView):
    """
    List travel documents
    """
    serializer_class = TravelDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        travel_app_id = self.request.query_params.get('travel_application')
        
        if travel_app_id:
            # Get documents for specific travel application
            travel_app = get_object_or_404(TravelApplication, id=travel_app_id)
            
            # Check permissions
            if (travel_app.employee != self.request.user and 
                not self.request.user.has_role('Travel Desk') and
                not self.request.user.has_role('Admin')):
                return TravelDocument.objects.none()
            
            return travel_app.documents.filter(is_active=True)
        
        # For travel desk/admin - show all documents
        if (self.request.user.has_role('Travel Desk') or 
            self.request.user.has_role('Admin')):
            return TravelDocument.objects.filter(is_active=True).order_by('-uploaded_at')
        
        # For employees - show only their documents
        return TravelDocument.objects.filter(
            travel_application__employee=self.request.user,
            is_active=True
        ).order_by('-uploaded_at')

class TravelDeskDashboardView(APIView):
    """
    Travel desk dashboard with booking statistics
    """
    permission_classes = [IsAuthenticated, HasCustomPermission]
    permission_required = 'booking_manage'
    
    def get(self, request):
        # Accommodation statistics
        accommodation_stats = {
            'pending_requests': AccommodationBooking.objects.filter(status='pending').count(),
            'guest_house_bookings': AccommodationBooking.objects.filter(
                accommodation_type='guest_house',
                status__in=['guest_house_requested', 'guest_house_confirmed']
            ).count(),
            'arc_hotel_bookings': AccommodationBooking.objects.filter(
                accommodation_type='arc_hotel',
                status__in=['arc_hotel_requested', 'arc_hotel_confirmed']
            ).count(),
            'alternative_hotels': AccommodationBooking.objects.filter(
                accommodation_type='non_arc_hotel'
            ).count()
        }
        
        # Vehicle statistics
        vehicle_stats = {
            'pending_assignments': VehicleBooking.objects.filter(status='pending').count(),
            'spoc_notified': VehicleBooking.objects.filter(status='spoc_notified').count(),
            'vehicle_assigned': VehicleBooking.objects.filter(status='vehicle_assigned').count(),
            'completed_bookings': VehicleBooking.objects.filter(status='completed').count()
        }
        
        # Recent activity
        recent_accommodations = AccommodationBooking.objects.select_related(
            'trip_details__travel_application__employee'
        ).order_by('-created_at')[:10]
        
        recent_vehicles = VehicleBooking.objects.select_related(
            'trip_details__travel_application__employee',
            'assigned_spoc__spoc_user'
        ).order_by('-created_at')[:10]
        
        return Response({
            'accommodation_statistics': accommodation_stats,
            'vehicle_statistics': vehicle_stats,
            'recent_accommodations': AccommodationBookingSerializer(
                recent_accommodations, many=True
            ).data,
            'recent_vehicles': VehicleBookingSerializer(
                recent_vehicles, many=True
            ).data
        })

class BookingStatusUpdateView(APIView):
    """
    Update booking status (Travel Desk/SPOC)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        booking_type = request.data.get('booking_type')  # 'accommodation' or 'vehicle'
        booking_id = request.data.get('booking_id')
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if booking_type == 'accommodation':
            booking = get_object_or_404(AccommodationBooking, id=booking_id)
            
            # Verify permissions
            if not request.user.has_role('Travel Desk'):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            booking.status = new_status
            if new_status in ['guest_house_confirmed', 'arc_hotel_confirmed', 'alternative_hotel_booked']:
                booking.confirmed_at = timezone.now()
            booking.save()
            
        elif booking_type == 'vehicle':
            booking = get_object_or_404(VehicleBooking, id=booking_id)
            
            # Verify permissions (SPOC for their bookings or Travel Desk for all)
            if not (booking.assigned_spoc and booking.assigned_spoc.spoc_user == request.user or 
                   request.user.has_role('Travel Desk')):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            booking.status = new_status
            booking.save()
        
        else:
            return Response(
                {'error': 'Invalid booking type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': f'{booking_type.title()} booking status updated to {new_status}',
            'booking_id': booking_id,
            'new_status': new_status
        })