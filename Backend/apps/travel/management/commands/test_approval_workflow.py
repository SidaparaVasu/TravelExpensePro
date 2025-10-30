from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from apps.authentication.models import User, Role, UserRole
from apps.master_data.models import LocationMaster, GLCodeMaster, TravelModeMaster, TravelSubOptionMaster
from apps.travel.models import TravelApplication, TripDetails, Booking
from apps.travel.business_logic.approval_engine import ApprovalEngine

class Command(BaseCommand):
    help = 'Test approval workflow with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Testing approval workflow...')
        
        try:
            # Create test scenario
            travel_app = self.create_test_travel_application()
            self.stdout.write(f'Created test travel application: {travel_app.get_travel_request_id()}')
            
            # Test approval engine
            approval_engine = ApprovalEngine(travel_app)
            approval_engine.initiate_approval_process()
            
            # Display generated approval chain
            self.display_approval_chain(travel_app)
            
            self.stdout.write(self.style.SUCCESS('Approval workflow test completed'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Test failed: {str(e)}'))

    def create_test_travel_application(self):
        # Get test data
        employee = User.objects.filter(userrole__role__name='Employee').first()
        if not employee:
            raise Exception('No employee user found')
            
        gl_code = GLCodeMaster.objects.first()
        if not gl_code:
            raise Exception('No GL code found')
            
        from_location = LocationMaster.objects.first()  
        to_location = LocationMaster.objects.exclude(location_id=from_location.pk).first()
        
        if not from_location or not to_location:
            raise Exception('Insufficient location data')
        
        # Create travel application
        travel_app = TravelApplication.objects.create(
            employee=employee,
            purpose='Test approval workflow',
            internal_order='TEST-IO-001',
            general_ledger=gl_code,
            sanction_number='TEST-SAN-001',
            advance_amount=5000,
            status='submitted',
            submitted_at=timezone.now()
        )
        
        # Create trip details
        trip = TripDetails.objects.create(
            travel_application=travel_app,
            from_location=from_location,
            to_location=to_location,
            departure_date=date.today() + timedelta(days=10),
            return_date=date.today() + timedelta(days=12),
            trip_purpose='Test trip'
        )
        
        # Create high-cost flight booking to trigger CEO approval
        flight_mode = TravelModeMaster.objects.filter(name='Flight').first()
        economy_class = TravelSubOptionMaster.objects.filter(mode=flight_mode, name='Economy Class').first()
        
        Booking.objects.create(
            trip_details=trip,
            booking_type=flight_mode,
            sub_option=economy_class,
            estimated_cost=12000,  # Above 10k to trigger CEO approval
            booking_details={'test': 'high_cost_flight'}
        )
        
        # Update estimated cost
        travel_app.calculate_estimated_cost()
        travel_app.save()
        
        return travel_app

    def display_approval_chain(self, travel_app):
        self.stdout.write('\nGenerated Approval Chain:')
        self.stdout.write('-' * 50)
        
        for flow in travel_app.approval_flows.all().order_by('sequence'):
            self.stdout.write(
                f'{flow.sequence}. {flow.approval_level.upper()}: '
                f'{flow.approver.get_full_name()} '
                f'(Rule: {flow.triggered_by_rule}) '
                f'[{flow.status}]'
            )