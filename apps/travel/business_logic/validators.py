from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

def validate_advance_booking(departure_date, travel_mode, estimated_cost=0):
    """
    Validate advance booking requirements based on TSF policy
    """
    today = timezone.now().date()
    days_ahead = (departure_date - today).days
    
    if travel_mode.lower() == 'flight':
        if days_ahead < 7:
            raise ValidationError(
                f"Flight booking requires 7 days advance notice. "
                f"Current booking is only {days_ahead} days ahead."
            )
    elif travel_mode.lower() == 'train':
        if days_ahead < 3:  # 72 hours = 3 days minimum
            raise ValidationError(
                f"Train booking requires 72 hours advance notice. "
                f"Current booking is only {days_ahead} days ahead."
            )

def validate_flight_fare(amount, user_grade):
    """
    Check if flight fare exceeds ₹10,000 limit requiring CEO approval
    """
    if amount > 10000:
        return {
            'requires_ceo_approval': True,
            'message': f"Flight fare ₹{amount} exceeds ₹10,000 limit. CEO approval required."
        }
    return {'requires_ceo_approval': False}

def validate_own_car_distance(distance_km):
    """
    Validate own car usage distance limit (150km)
    """
    if distance_km > 150:
        raise ValidationError(
            f"Own car travel limited to 150km. Requested: {distance_km}km. "
            f"CHRO approval required for distances above 150km."
        )

def validate_car_safety_requirements(car_details):
    """
    Validate car safety requirements (minimum 6 airbags)
    """
    airbags = car_details.get('airbags', 0)
    if airbags < 6:
        raise ValidationError(
            "Car must have minimum 6 airbags for official travel. "
            f"Provided car has {airbags} airbags."
        )

def validate_travel_entitlement(user, travel_mode, sub_option, city_category):
    """
    Check if user's grade allows the requested travel mode/sub-option
    """
    from apps.master_data.models import GradeEntitlementMaster
    
    if not user.grade:
        raise ValidationError("User grade not defined. Cannot validate entitlements.")
    
    entitlement = GradeEntitlementMaster.objects.filter(
        grade=user.grade,
        sub_option=sub_option,
        city_category=city_category,
        is_allowed=True
    ).first()
    
    if not entitlement:
        raise ValidationError(
            f"Grade {user.grade.name} is not entitled to {sub_option.name} "
            f"in {city_category.name} category cities."
        )
    
    return entitlement

def validate_accommodation_entitlement(user, accommodation_type, city_category, rate_per_night):
    """
    Validate accommodation entitlements based on user grade
    """
    from apps.master_data.models import GradeEntitlementMaster
    
    # Get accommodation entitlement for user's grade
    entitlement = GradeEntitlementMaster.objects.filter(
        grade=user.grade,
        sub_option__name__icontains=accommodation_type,
        city_category=city_category,
        is_allowed=True
    ).first()
    
    if not entitlement:
        raise ValidationError(
            f"Grade {user.grade.name} is not entitled to {accommodation_type} "
            f"accommodation in {city_category.name} category cities."
        )
    
    if entitlement.max_amount and rate_per_night > entitlement.max_amount:
        raise ValidationError(
            f"Rate ₹{rate_per_night} exceeds maximum allowed ₹{entitlement.max_amount} "
            f"for {accommodation_type} in {city_category.name} category cities."
        )
    
    return entitlement

def validate_duplicate_travel_request(user, departure_date, return_date):
    """
    Check for overlapping travel requests for the same user
    """
    from apps.travel.models import TravelApplication
    
    overlapping_requests = TravelApplication.objects.filter(
        employee=user,
        status__in=['submitted', 'pending_manager', 'approved_manager', 'pending_chro', 
                   'approved_chro', 'pending_ceo', 'approved_ceo', 'pending_travel_desk',
                   'booking_in_progress', 'booked'],
        trip_details__departure_date__lte=return_date,
        trip_details__return_date__gte=departure_date
    ).distinct()
    
    if overlapping_requests.exists():
        existing_request = overlapping_requests.first()
        raise ValidationError(
            f"Overlapping travel request exists: {existing_request.get_travel_request_id()}"
        )

def calculate_da_eligibility(trip_duration_hours, distance_km):
    """
    Calculate DA eligibility based on TSF policy
    - One way distance > 50 km AND duration > 8 hours
    """
    if distance_km <= 50:
        return {
            'eligible': False,
            'reason': 'One way distance must exceed 50 kilometers'
        }
    
    if trip_duration_hours <= 8:
        return {
            'eligible': False,
            'reason': 'Travel duration must exceed 8 hours including travel time'
        }
    
    # Determine DA amount based on duration
    if trip_duration_hours > 12:
        da_type = 'full_day'
    else:
        da_type = 'half_day'
    
    return {
        'eligible': True,
        'da_type': da_type
    }


def check_booking_entitlement(user, booking_type, sub_option, city_category):
    """
    Check if user's grade allows this booking type
    Returns: (is_allowed: bool, max_amount: Decimal, message: str)
    """
    from apps.master_data.models import GradeEntitlement
    
    if not user.grade:
        return False, None, "User grade not defined"
    
    # Find entitlement rule
    entitlement = GradeEntitlement.objects.filter(
        grade=user.grade,
        sub_option=sub_option,
        city_category=city_category,
        is_allowed=True
    ).first()
    
    if not entitlement:
        return False, None, f"Grade {user.grade.name} not entitled to {sub_option.name} in {city_category.name} category cities"
    
    return True, entitlement.max_amount, "Allowed"

def validate_booking_against_entitlement(user, trip_details, booking):
    """
    Validate booking against user's grade entitlements
    """
    from apps.master_data.models import TravelSubOption
    
    if not booking.sub_option:
        return  # Skip if no sub-option selected
    
    sub_option = TravelSubOption.objects.select_related('mode').get(id=booking.sub_option)
    city_category = trip_details.to_location.city.category
    
    is_allowed, max_amount, message = check_booking_entitlement(
        user, 
        booking.booking_type, 
        sub_option,
        city_category
    )
    
    if not is_allowed:
        raise ValidationError(message)
    
    # Check max amount if specified
    if max_amount and booking.estimated_cost > max_amount:
        raise ValidationError(
            f"Booking cost ₹{booking.estimated_cost} exceeds maximum allowed ₹{max_amount} "
            f"for {sub_option.name} in {city_category.name} category cities"
        )
    

    def validate_own_car_usage(booking_details, estimated_distance):
        """Validate own car meets TSF requirements"""
        
        if estimated_distance > 150:
            raise ValidationError(
                f"Own car travel limited to 150km. Distance: {estimated_distance}km requires CHRO approval"
            )
        
        airbags = booking_details.get('airbags', 0)
        if airbags < 6:
            raise ValidationError(
                f"Car must have minimum 6 airbags. Current: {airbags} airbags"
            )
        

    def validate_own_car_booking(booking_details, estimated_distance=None):
        """
        Validate own car usage against TSF policy
        - Max 150km without approval
        - Minimum 6 airbags required
        """
        errors = []
        
        # Distance validation
        if estimated_distance and estimated_distance > 150:
            errors.append({
                'field': 'distance',
                'message': f'Own car limited to 150km. Current: {estimated_distance}km. CHRO approval required above 150km.',
                'severity': 'warning'  # Not blocking, but needs approval
            })
        
        # Airbag validation
        airbags = booking_details.get('airbags', 0)
        if airbags < 6:
            errors.append({
                'field': 'airbags',
                'message': f'Car must have minimum 6 airbags for safety. Current: {airbags} airbags.',
                'severity': 'error'
            })
        
        # Car details validation
        if not booking_details.get('car_model'):
            errors.append({'field': 'car_model', 'message': 'Car model required', 'severity': 'error'})
        
        if not booking_details.get('registration_number'):
            errors.append({'field': 'registration_number', 'message': 'Registration number required', 'severity': 'error'})
        
        return errors