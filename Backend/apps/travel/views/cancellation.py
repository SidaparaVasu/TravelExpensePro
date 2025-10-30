from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from utils.response_formatter import success_response, error_response
from django.core.exceptions import ValidationError

class TravelCancellationRequestView(APIView):
    """Request travel application cancellation"""
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, pk):
        from apps.travel.models import TravelApplication
        
        try:
            travel_app = TravelApplication.objects.get(pk=pk)
        except TravelApplication.DoesNotExist:
            return error_response('Travel application not found', status_code=404)
        
        reason = request.data.get('reason', '')
        if not reason:
            return error_response('Cancellation reason is required', status_code=400)
        
        try:
            travel_app.cancel_application(
                cancelled_by=request.user,
                reason=reason
            )
            
            return success_response(
                data={
                    'travel_request_id': travel_app.get_travel_request_id(),
                    'status': travel_app.status,
                    'cancelled_at': travel_app.cancellation_requested_at
                },
                message='Travel application cancelled successfully'
            )
            
        except ValidationError as e:
            return error_response(str(e), status_code=400)


class PartialCancellationView(APIView):
    """Cancel specific trips/bookings within an application"""
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request, pk):
        from apps.travel.models import TravelApplication, TripDetails
        
        try:
            travel_app = TravelApplication.objects.get(pk=pk, employee=request.user)
        except TravelApplication.DoesNotExist:
            return error_response('Travel application not found', status_code=404)
        
        trip_ids_to_cancel = request.data.get('trip_ids', [])
        reason = request.data.get('reason', '')
        
        if not trip_ids_to_cancel:
            return error_response('Specify trips to cancel', status_code=400)
        
        # Cancel specified trips
        cancelled_trips = TripDetails.objects.filter(
            id__in=trip_ids_to_cancel,
            travel_application=travel_app
        )
        
        # Cancel bookings for these trips
        for trip in cancelled_trips:
            trip.bookings.update(status='cancelled')
            trip.accommodation_bookings.update(status='cancelled')
            trip.vehicle_bookings.update(status='cancelled')
        
        # Recalculate total cost
        travel_app.calculate_estimated_cost()
        travel_app.save()
        
        return success_response(
            data={'cancelled_trips': cancelled_trips.count()},
            message=f'Successfully cancelled {cancelled_trips.count()} trip(s)'
        )