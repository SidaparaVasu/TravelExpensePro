from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.response_formatter import success_response
from datetime import datetime, timedelta

class GuestHouseAvailabilityView(APIView):
    """Check guest house availability for date range"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        city_id = request.data.get('city_id')
        check_in = datetime.strptime(request.data.get('check_in_date'), '%Y-%m-%d').date()
        check_out = datetime.strptime(request.data.get('check_out_date'), '%Y-%m-%d').date()
        
        from apps.master_data.models import CityMaster
        from apps.master_data.models import GuestHouseMaster
        from apps.travel.models import AccommodationBooking
        
        city = CityMaster.objects.get(id=city_id)
        guest_houses = GuestHouseMaster.objects.filter(city=city, is_active=True)
        
        availability = []
        for gh in guest_houses:
            overlapping = AccommodationBooking.objects.filter(
                guest_house=gh,
                status__in=['guest_house_confirmed', 'guest_house_requested'],
                check_in_date__lt=check_out,
                check_out_date__gt=check_in
            ).count()
            
            total_rooms = gh.total_rooms or 10
            available = total_rooms - overlapping
            
            availability.append({
                'id': gh.id,
                'name': gh.name,
                'total_rooms': total_rooms,
                'available_rooms': available,
                'is_available': available > 0,
                'address': gh.address,
                'contact': gh.phone_number
            })
        
        return success_response(
            data={'guest_houses': availability},
            message='Availability checked successfully'
        )