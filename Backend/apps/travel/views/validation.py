from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from utils.response_formatter import success_response, error_response
from datetime import datetime, timedelta

class RealTimeValidationView(APIView):
    """Real-time validation as user types"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        validation_type = request.data.get('type')
        
        validators = {
            'booking': self.validate_booking,
            'dates': self.validate_dates,
            'duplicate': self.validate_duplicate,
            'entitlement': self.validate_entitlement,
            'advance_booking': self.validate_advance_booking,
        }
        
        validator = validators.get(validation_type)
        if not validator:
            return error_response('Invalid validation type', status_code=400)
        
        return validator(request)
    
    def validate_booking(self, request):
        """Validate booking against entitlements"""
        from apps.travel.business_logic.validators import check_booking_entitlement
        from apps.master_data.models import TravelModeMaster, TravelSubOptionMaster, CityCategoriesMaster
        
        mode_id = request.data.get('mode_id')
        sub_option_id = request.data.get('sub_option_id')
        city_category_id = request.data.get('city_category_id')
        estimated_cost = request.data.get('estimated_cost', 0)
        
        try:
            mode = TravelModeMaster.objects.get(id=mode_id)
            sub_option = TravelSubOptionMaster.objects.get(id=sub_option_id)
            city_category = CityCategoriesMaster.objects.get(id=city_category_id)
            
            is_allowed, max_amount, message = check_booking_entitlement(
                request.user, mode, sub_option, city_category
            )
            
            warnings = []
            
            # Check amount limits
            if is_allowed and max_amount and estimated_cost > max_amount:
                warnings.append({
                    'field': 'estimated_cost',
                    'message': f'Amount ₹{estimated_cost} exceeds limit ₹{max_amount}',
                    'severity': 'warning'
                })
            
            # Check special approvals
            if mode.name.lower() == 'flight' and estimated_cost > 10000:
                warnings.append({
                    'field': 'estimated_cost',
                    'message': 'CEO approval required for flights above ₹10,000',
                    'severity': 'info'
                })
            
            return success_response(
                data={
                    'is_valid': is_allowed,
                    'is_allowed': is_allowed,
                    'max_amount': float(max_amount) if max_amount else None,
                    'message': message,
                    'warnings': warnings
                }
            )
            
        except Exception as e:
            return error_response(str(e), status_code=400)
    
    def validate_dates(self, request):
        """Validate travel dates"""
        departure = request.data.get('departure_date')
        return_date = request.data.get('return_date')
        
        errors = []
        warnings = []
        
        try:
            dep_date = datetime.strptime(departure, '%Y-%m-%d').date()
            ret_date = datetime.strptime(return_date, '%Y-%m-%d').date()
            
            # Check order
            if ret_date < dep_date:
                errors.append({
                    'field': 'return_date',
                    'message': 'Return date cannot be before departure date'
                })
            
            # Check if in past
            today = datetime.now().date()
            if dep_date < today:
                errors.append({
                    'field': 'departure_date',
                    'message': 'Departure date cannot be in the past'
                })
            
            # Check if too far in future
            if dep_date > today + timedelta(days=365):
                warnings.append({
                    'field': 'departure_date',
                    'message': 'Travel is more than 1 year in advance',
                    'severity': 'warning'
                })
            
            # Check duration
            duration = (ret_date - dep_date).days
            if duration > 90:
                errors.append({
                    'field': 'return_date',
                    'message': 'Maximum travel duration is 90 days'
                })
            
            return success_response(
                data={
                    'is_valid': len(errors) == 0,
                    'duration_days': duration,
                    'errors': errors,
                    'warnings': warnings
                }
            )
            
        except ValueError:
            return error_response('Invalid date format. Use YYYY-MM-DD', status_code=400)
    
    def validate_duplicate(self, request):
        """Check for duplicate/overlapping travel"""
        from apps.travel.business_logic.validators import validate_duplicate_travel_request
        
        departure = request.data.get('departure_date')
        return_date = request.data.get('return_date')
        
        try:
            dep_date = datetime.strptime(departure, '%Y-%m-%d').date()
            ret_date = datetime.strptime(return_date, '%Y-%m-%d').date()
            
            validate_duplicate_travel_request(request.user, dep_date, ret_date)
            
            return success_response(
                data={'has_duplicate': False},
                message='No overlapping travel found'
            )
            
        except Exception as e:
            return success_response(
                data={
                    'has_duplicate': True,
                    'message': str(e)
                },
                message='Overlapping travel detected'
            )
    
    def validate_entitlement(self, request):
        """Quick entitlement check"""
        from apps.master_data.models import GradeEntitlementMaster, TravelSubOptionMaster
        
        sub_option_id = request.data.get('sub_option_id')
        city_category_id = request.data.get('city_category_id')
        
        try:
            sub_option = TravelSubOptionMaster.objects.select_related('mode').get(id=sub_option_id)
            
            entitlement = GradeEntitlementMaster.objects.filter(
                grade=request.user.grade,
                sub_option=sub_option,
                city_category_id=city_category_id,
                is_allowed=True
            ).first()
            
            if entitlement:
                return success_response(
                    data={
                        'is_entitled': True,
                        'max_amount': float(entitlement.max_amount) if entitlement.max_amount else None,
                        'travel_mode': sub_option.mode.name,
                        'sub_option': sub_option.name
                    }
                )
            else:
                return success_response(
                    data={
                        'is_entitled': False,
                        'message': f'Grade {request.user.grade.name} not entitled to {sub_option.name}'
                    }
                )
                
        except Exception as e:
            return error_response(str(e), status_code=400)
    
    def validate_advance_booking(self, request):
        """Check advance booking requirements"""
        from apps.travel.business_logic.validators import validate_advance_booking
        
        departure = request.data.get('departure_date')
        mode = request.data.get('mode')  # 'flight', 'train'
        
        try:
            dep_date = datetime.strptime(departure, '%Y-%m-%d').date()
            
            validate_advance_booking(dep_date, mode, 0)
            
            return success_response(
                data={'meets_requirement': True},
                message='Advance booking requirement met'
            )
            
        except Exception as e:
            today = datetime.now().date()
            days_ahead = (dep_date - today).days
            required_days = 7 if mode.lower() == 'flight' else 3
            
            return success_response(
                data={
                    'meets_requirement': False,
                    'days_ahead': days_ahead,
                    'required_days': required_days,
                    'message': str(e)
                }
            )