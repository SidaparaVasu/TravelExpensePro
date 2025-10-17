from apps.master_data.models import ApprovalMatrix
from apps.authentication.models import User
from ..models import TravelApprovalFlow
from django.db import transaction

class ApprovalEngine:
    """
    Dynamic approval workflow engine based on TSF business rules
    """
    
    def __init__(self, travel_application):
        self.travel_application = travel_application
        self.employee = travel_application.employee
    
    def initiate_approval_process(self):
        """
        Generate and create approval workflow based on business rules
        """
        with transaction.atomic():
            # Clear any existing approval flows
            self.travel_application.approval_flows.all().delete()
            
            # Generate approval chain
            approval_chain = self.generate_approval_chain()
            
            # Create approval flow records
            self.create_approval_flows(approval_chain)
            
            # Set current approver and status
            if approval_chain:
                first_approval = approval_chain[0]

                # 👇 Force CEO/CHRO as current approver if required by special rules
                if any(a['approval_level'] in ['ceo', 'chro'] for a in approval_chain):
                    self.travel_application.current_approver = approval_chain[0]['approver']
                else:
                    self.travel_application.current_approver = first_approval['approver']

                # self.travel_application.current_approver = first_approval['approver']
                self.travel_application.status = f'pending_{first_approval["approval_level"]}'
                self.travel_application.save()
    
    def generate_approval_chain(self):
        """
        Generate dynamic approval chain based on travel details and business rules
        """
        total_amount = self.calculate_total_travel_amount()
        approval_chain = []
        sequence = 1
        
        # Always start with reporting manager (if exists)
        if self.employee.reporting_manager:
            approval_chain.append({
                'approver': self.employee.reporting_manager,
                'approval_level': 'manager',
                'sequence': sequence,
                'can_view': True,
                'can_approve': True,
                'is_required': True,
                'triggered_by_rule': 'reporting_hierarchy'
            })
            sequence += 1
        
        # Check if any booking requires special approvals
        special_approvals = self.check_special_approval_requirements()
        
        # CEO approval for flights > ₹10,000
        if special_approvals.get('requires_ceo_flight', False):
            ceo = self.get_user_by_role('CEO')
            if ceo:
                approval_chain.append({
                    'approver': ceo,
                    'approval_level': 'ceo',
                    'sequence': sequence,
                    'can_view': True,
                    'can_approve': True,
                    'is_required': True,
                    'triggered_by_rule': 'flight_above_10k'
                })
                sequence += 1
        
        # CHRO approval based on amount or special conditions
        if self.requires_chro_approval(total_amount, special_approvals):
            chro = self.get_user_by_role('CHRO')
            if chro:
                approval_chain.append({
                    'approver': chro,
                    'approval_level': 'chro',
                    'sequence': sequence,
                    'can_view': True,
                    'can_approve': True,
                    'is_required': True,
                    'triggered_by_rule': 'amount_threshold_or_policy'
                })
                sequence += 1
        
        # Apply approval matrix rules
        matrix_approvals = self.get_matrix_based_approvals(total_amount)
        for matrix_approval in matrix_approvals:
            matrix_approval['sequence'] = sequence
            approval_chain.append(matrix_approval)
            sequence += 1
        
        return approval_chain
    
    def calculate_total_travel_amount(self):
        """Calculate total estimated cost of travel"""
        return self.travel_application.estimated_total_cost or 0
    
    def check_special_approval_requirements(self):
        """
        Check for special approval requirements (flights > 10k, car > 150km, etc.)
        """
        special_requirements = {
            'requires_ceo_flight': False,
            'requires_chro_car': False,
            'high_value_travel': False
        }
        
        for trip in self.travel_application.trip_details.all():
            for booking in trip.bookings.all():
                # Flight > ₹10,000 requires CEO approval
                if (booking.booking_type.name.lower() == 'flight' and 
                    booking.estimated_cost and booking.estimated_cost > 10000):
                    special_requirements['requires_ceo_flight'] = True
                
                # Own car > 150km requires CHRO approval
                if (booking.booking_type.name.lower() == 'car' and
                    booking.booking_details.get('transport_type') == 'own_car' and
                    booking.booking_details.get('distance_km', 0) > 150):
                    special_requirements['requires_chro_car'] = True
        
        # High value travel (total > ₹50,000)
        if self.travel_application.estimated_total_cost > 50000:
            special_requirements['high_value_travel'] = True
        
        return special_requirements
    
    def requires_chro_approval(self, total_amount, special_approvals):
        """
        Determine if CHRO approval is required based on various conditions
        """
        # High value travel
        if special_approvals.get('high_value_travel', False):
            return True
        
        # Car distance policy
        if special_approvals.get('requires_chro_car', False):
            return True
        
        # Senior grade with international travel (future enhancement)
        # Add more CHRO approval conditions as needed
        
        return False
    
    def get_matrix_based_approvals(self, total_amount):
        """
        Get approvals based on approval matrix configuration
        """
        from django.db.models import Q

        matrix_approvals = []
        
        # Get primary travel mode for matrix lookup
        primary_mode = self.get_primary_travel_mode()
        if not primary_mode:
            return matrix_approvals
        
        # Find applicable matrix rule
        matrix_rule = ApprovalMatrix.objects.filter(
            travel_mode=primary_mode,
            employee_grade=self.employee.grade,
            min_amount__lte=total_amount,
            is_active=True
        ).filter(
            Q(max_amount__gte=total_amount) | Q(max_amount__isnull=True)
        ).first()
        
        if matrix_rule:
            # Additional CEO approval from matrix (different from flight rule)
            if matrix_rule.requires_ceo:
                ceo = self.get_user_by_role('CEO')
                if ceo:
                    matrix_approvals.append({
                        'approver': ceo,
                        'approval_level': 'ceo',
                        'can_view': True,
                        'can_approve': True,
                        'is_required': True,
                        'triggered_by_rule': f'matrix_{matrix_rule.id}'
                    })
            
            # CHRO approval from matrix
            if matrix_rule.requires_chro:
                chro = self.get_user_by_role('CHRO')
                if chro:
                    matrix_approvals.append({
                        'approver': chro,
                        'approval_level': 'chro',
                        'can_view': True,
                        'can_approve': True,
                        'is_required': True,
                        'triggered_by_rule': f'matrix_{matrix_rule.id}'
                    })
        
        return matrix_approvals
    
    def get_primary_travel_mode(self):
        """
        Get the primary travel mode for matrix lookup
        """
        # Get the highest cost booking's travel mode
        max_cost_booking = None
        max_cost = 0
        
        for trip in self.travel_application.trip_details.all():
            for booking in trip.bookings.all():
                if booking.estimated_cost and booking.estimated_cost > max_cost:
                    max_cost = booking.estimated_cost
                    max_cost_booking = booking
        
        return max_cost_booking.booking_type if max_cost_booking else None
    
    def get_user_by_role(self, role_name):
        """
        Get user by role name (CEO, CHRO, etc.)
        """
        from apps.authentication.models import UserRole
        user_role = UserRole.objects.filter(
            role__name=role_name,
            is_active=True
        ).first()
        
        return user_role.user if user_role else None
    
    def create_approval_flows(self, approval_chain):
        """
        Create TravelApprovalFlow records from approval chain
        """
        for approval_data in approval_chain:
            TravelApprovalFlow.objects.create(
                travel_application=self.travel_application,
                **approval_data
            )