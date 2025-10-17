from decimal import Decimal
from apps.master_data.models import DAIncidentalMaster, ConveyanceRateMaster

def calculate_da_incidentals(user, city_category, duration_days, duration_hours):
    """
    Calculate DA and incidentals based on user grade and city category
    """
    if not user.grade:
        return {'error': 'User grade not defined'}
    
    # Get current DA rates
    da_rates = DAIncidentalMaster.objects.filter(
        grade=user.grade,
        city_category__name=city_category,
        is_active=True
    ).order_by('-effective_from').first()
    
    if not da_rates:
        return {'error': f'DA rates not found for grade {user.grade.name} in category {city_category}'}
    
    # Calculate based on duration
    total_da = Decimal('0')
    total_incidentals = Decimal('0')
    
    full_days = duration_days
    if duration_hours % 24 > 12:  # If last day > 12 hours, count as full day
        pass
    elif duration_hours % 24 > 8:  # If last day 8-12 hours, count as half day
        full_days -= 1
        total_da += da_rates.da_half_day
        total_incidentals += da_rates.incidental_half_day
    else:  # Less than 8 hours on last day, no DA for last day
        full_days -= 1
    
    # Add full days
    total_da += da_rates.da_full_day * full_days
    total_incidentals += da_rates.incidental_full_day * full_days
    
    return {
        'da_amount': total_da,
        'incidental_amount': total_incidentals,
        'full_days': full_days,
        'rates_used': {
            'da_full_day': da_rates.da_full_day,
            'da_half_day': da_rates.da_half_day,
            'incidental_full_day': da_rates.incidental_full_day,
            'incidental_half_day': da_rates.incidental_half_day
        }
    }

def calculate_conveyance_cost(conveyance_type, distance_km, has_receipt=False):
    """
    Calculate conveyance reimbursement based on type and distance
    """
    # Get current conveyance rates
    rate = ConveyanceRateMaster.objects.filter(
        conveyance_type=conveyance_type,
        is_active=True
    ).order_by('-effective_from').first()
    
    if not rate:
        return {'error': f'Conveyance rate not found for {conveyance_type}'}
    
    if rate.requires_receipt and not has_receipt:
        return {'error': f'{conveyance_type} requires receipt for reimbursement'}
    
    # Calculate cost
    calculated_cost = rate.rate_per_km * Decimal(str(distance_km))
    
    # Apply maximum limits
    if rate.max_claim_amount and calculated_cost > rate.max_claim_amount:
        calculated_cost = rate.max_claim_amount
        
    if rate.max_distance_per_day and distance_km > rate.max_distance_per_day:
        return {
            'error': f'Distance {distance_km}km exceeds daily limit {rate.max_distance_per_day}km'
        }
    
    return {
        'cost': calculated_cost,
        'rate_per_km': rate.rate_per_km,
        'distance': distance_km,
        'requires_receipt': rate.requires_receipt
    }

def calculate_accommodation_allowance(user, city_category, accommodation_type='staying_with_friends'):
    """
    Calculate accommodation allowance when staying with friends/relatives
    """
    if not user.grade:
        return {'error': 'User grade not defined'}
    
    da_rates = DAIncidentalMaster.objects.filter(
        grade=user.grade,
        city_category__name=city_category,
        is_active=True
    ).order_by('-effective_from').first()
    
    if not da_rates:
        return {'error': f'Rates not found for grade {user.grade.name} in category {city_category}'}
    
    if city_category == 'A':
        allowance = da_rates.stay_allowance_category_a
    else:
        allowance = da_rates.stay_allowance_category_b
    
    return {
        'allowance_amount': allowance,
        'applicable_for': f'Category {city_category} cities'
    }