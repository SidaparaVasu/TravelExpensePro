from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.response_formatter import success_response, error_response

class TravelExpenseEstimateView(APIView):
    """Get complete expense estimate for travel application"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        from apps.travel.models import TravelApplication
        
        try:
            travel_app = TravelApplication.objects.get(
                pk=pk,
                employee=request.user
            )
        except TravelApplication.DoesNotExist:
            return error_response('Travel application not found', status_code=404)
        
        # Calculate DA/Incidentals
        da_breakdown = travel_app.calculate_da_entitlement()
        
        # Get booking costs
        booking_costs = {
            'flights': 0,
            'trains': 0,
            'accommodation': 0,
            'vehicles': 0
        }
        
        for trip in travel_app.trip_details.all():
            for booking in trip.bookings.all():
                cost = float(booking.estimated_cost or 0)
                mode = booking.booking_type.name.lower()
                
                if 'flight' in mode:
                    booking_costs['flights'] += cost
                elif 'train' in mode:
                    booking_costs['trains'] += cost
                elif 'accommodation' in mode:
                    booking_costs['accommodation'] += cost
                elif any(x in mode for x in ['car', 'vehicle']):
                    booking_costs['vehicles'] += cost
        
        # Calculate totals
        total_bookings = sum(booking_costs.values())
        total_da_incidentals = da_breakdown['grand_total']
        grand_total = total_bookings + total_da_incidentals
        
        return success_response(
            data={
                'travel_request_id': travel_app.get_travel_request_id(),
                'booking_costs': booking_costs,
                'total_bookings': total_bookings,
                'da_breakdown': da_breakdown,
                'total_da_incidentals': total_da_incidentals,
                'grand_total': grand_total,
                'advance_requested': float(travel_app.advance_amount or 0),
                'balance_payable': grand_total - float(travel_app.advance_amount or 0)
            },
            message='Expense estimate calculated successfully'
        )