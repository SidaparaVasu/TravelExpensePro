"""
If this file not available, Create directory structure first:
mkdir -p apps/master_data/management
mkdir -p apps/master_data/management/commands
touch apps/master_data/management/__init__.py
touch apps/master_data/management/commands/__init__.py
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.master_data.models import *
from apps.authentication.models import User
from datetime import date, timedelta
from apps.master_data.models import CountryMaster

# ✅ Import your reusable location population utility
from utils.populate_india_location_data import populate_india_location_data


class Command(BaseCommand):
    help = 'Populate initial travel-related master data'

    def handle(self, *args, **options):
        self.stdout.write('Starting travel data population...')

        # ✅ Instead of manually creating cities, states, and categories,
        # run your centralized India location data setup
        self.stdout.write('Ensuring India location and category data are populated...')
        # Step 1: Ensure India data exists before populating travel data
        india_exists = CountryMaster.objects.filter(country_name="India").exists()
        if not india_exists:
            print("ℹ️ India data not found. Populating location data first...")
            populate_india_location_data()
        else:
            print("✅ India location data already exists. Skipping location population.")

        # Continue with other travel-related data
        self.create_company_data()
        self.create_grades()
        self.create_travel_modes()
        self.create_approval_matrix()
        self.create_da_incidental_rates()
        self.create_conveyance_rates()
        self.create_travel_policies()
        self.create_email_templates()

        self.stdout.write(self.style.SUCCESS('Successfully populated travel data'))

    # ❌ Removed: create_city_categories and create_countries_states_cities
    # (These are now handled by populate_india_location_data utility)

    def create_company_data(self):
        company, _ = CompanyInformation.objects.get_or_create(
            name='Tata Steel Foundation',
            defaults={
                'address': 'Jamshedpur, Jharkhand',
                'pincode': '831001',
                'phone_number': '+91-657-6655000',
                'website': 'https://www.tatasteelfoundation.org',
                'email_address': 'info@tatasteelfoundation.org'
            }
        )

        # Create departments
        departments = [
            ('HR', 'Human Resources'),
            ('FIN', 'Finance'),
            ('IT', 'Information Technology'),
            ('OPS', 'Operations'),
        ]

        for code, name in departments:
            DepartmentMaster.objects.get_or_create(
                dept_code=code,
                defaults={
                    'dept_name': name,
                    'company': company
                }
            )

        self.stdout.write('Created company data')

    def create_grades(self):
        grades = [
            ('B-2A', 'Senior Management', 1),
            ('B-2B', 'Middle Management', 2),
            ('B-3', 'Junior Management', 3),
            ('B-4A', 'Senior Executive', 4),
            ('B-4B', 'Executive', 5),
        ]

        for name, desc, sort_no in grades:
            GradeMaster.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'sorting_no': sort_no
                }
            )

        self.stdout.write('Created grades')

    def create_travel_modes(self):
        modes = [
            ('Flight', 'Air Travel'),
            ('Train', 'Railway Travel'),
            ('Car', 'Road Travel'),
            ('Accommodation', 'Stay Arrangements'),
        ]

        for name, desc in modes:
            mode, _ = TravelModeMaster.objects.get_or_create(
                name=name,
                defaults={'description': desc}
            )

            # Create sub-options
            if name == 'Flight':
                sub_options = ['Economy Class', 'Business Class']
            elif name == 'Train':
                sub_options = ['Sleeper', '3rd AC', '2nd AC', '1st AC']
            elif name == 'Car':
                sub_options = ['Own Car', 'Company Car', 'Taxi', 'Rental']
            elif name == 'Accommodation':
                sub_options = ['Guest House', '3-Star Hotel', '4-Star Hotel', '5-Star Hotel']

            for sub_option in sub_options:
                TravelSubOptionMaster.objects.get_or_create(
                    mode=mode,
                    name=sub_option
                )

        self.stdout.write('Created travel modes and sub-options')

    def create_approval_matrix(self):
        # Get required objects
        flight_mode = TravelModeMaster.objects.get(name='Flight')
        train_mode = TravelModeMaster.objects.get(name='Train')
        grades = GradeMaster.objects.all()

        # Flight approval matrix
        for grade in grades:
            # Flights under 10k - Manager approval
            ApprovalMatrix.objects.get_or_create(
                travel_mode=flight_mode,
                employee_grade=grade,
                min_amount=0,
                defaults={
                    'max_amount': 10000,
                    'requires_manager': True,
                    'requires_chro': False,
                    'requires_ceo': False,
                    'flight_above_10k_ceo': False,
                    'advance_booking_required_days': 7
                }
            )

            # Flights above 10k - CEO approval
            ApprovalMatrix.objects.get_or_create(
                travel_mode=flight_mode,
                employee_grade=grade,
                min_amount=10001,
                defaults={
                    'requires_manager': True,
                    'requires_chro': False,
                    'requires_ceo': True,
                    'flight_above_10k_ceo': True,
                    'advance_booking_required_days': 7
                }
            )

            # Train approval - Manager only
            ApprovalMatrix.objects.get_or_create(
                travel_mode=train_mode,
                employee_grade=grade,
                min_amount=0,
                defaults={
                    'requires_manager': True,
                    'requires_chro': False,
                    'requires_ceo': False,
                    'advance_booking_required_days': 3
                }
            )

        self.stdout.write('Created approval matrix')

    def create_da_incidental_rates(self):
        grades = GradeMaster.objects.all()
        categories = CityCategoriesMaster.objects.all()

        rates = {
            'B-2A': {
                'A': {'da_full': 810, 'da_half': 405, 'inc_full': 243, 'inc_half': 122, 'stay_a': 1800, 'stay_b': 1000},
                'B': {'da_full': 648, 'da_half': 324, 'inc_full': 243, 'inc_half': 122, 'stay_a': 1800, 'stay_b': 1000},
                'C': {'da_full': 680, 'da_half': 340, 'inc_full': 255, 'inc_half': 128, 'stay_a': 1800, 'stay_b': 1000},
            },
            'B-2B': {
                'A': {'da_full': 810, 'da_half': 405, 'inc_full': 243, 'inc_half': 122, 'stay_a': 1200, 'stay_b': 800},
                'B': {'da_full': 648, 'da_half': 324, 'inc_full': 243, 'inc_half': 122, 'stay_a': 1200, 'stay_b': 800},
                'C': {'da_full': 680, 'da_half': 340, 'inc_full': 255, 'inc_half': 128, 'stay_a': 1200, 'stay_b': 800},
            },
        }

        for grade in grades:
            if grade.name in rates:
                for category in categories:
                    if category.name in rates[grade.name]:
                        rate_data = rates[grade.name][category.name]
                        DAIncidentalMaster.objects.get_or_create(
                            grade=grade,
                            city_category=category,
                            effective_from=date.today(),
                            defaults={
                                'da_full_day': rate_data['da_full'],
                                'da_half_day': rate_data['da_half'],
                                'incidental_full_day': rate_data['inc_full'],
                                'incidental_half_day': rate_data['inc_half'],
                                'stay_allowance_category_a': rate_data['stay_a'],
                                'stay_allowance_category_b': rate_data['stay_b'],
                            }
                        )

        self.stdout.write('Created DA/Incidental rates')

    def create_conveyance_rates(self):
        rates = [
            ('own_vehicle', 15.00, False, None),
            ('taxi_with_receipt', 0.00, True, None),
            ('taxi_without_receipt', 15.00, False, 500),
            ('auto_rickshaw', 12.00, False, 200),
            ('public_transport', 0.00, True, None),
        ]

        for conv_type, rate, receipt_req, max_claim in rates:
            ConveyanceRateMaster.objects.get_or_create(
                conveyance_type=conv_type,
                effective_from=date.today(),
                defaults={
                    'rate_per_km': rate,
                    'requires_receipt': receipt_req,
                    'max_claim_amount': max_claim,
                    'effective_to': None
                }
            )

        self.stdout.write('Created conveyance rates')

    def create_travel_policies(self):
        flight_mode = TravelModeMaster.objects.get(name='Flight')
        train_mode = TravelModeMaster.objects.get(name='Train')
        car_mode = TravelModeMaster.objects.get(name='Car')

        policies = [
            {
                'policy_type': 'advance_booking',
                'title': 'Flight Advance Booking Requirement',
                'description': 'Flight tickets must be booked at least 7 days in advance',
                'travel_mode': flight_mode,
                'rule_parameters': {'days': 7}
            },
            {
                'policy_type': 'advance_booking',
                'title': 'Train Advance Booking Requirement',
                'description': 'Train tickets must be booked at least 72 hours in advance',
                'travel_mode': train_mode,
                'rule_parameters': {'hours': 72}
            },
            {
                'policy_type': 'distance_limit',
                'title': 'Own Car Distance Limit',
                'description': 'Own car travel is limited to 150km per trip',
                'travel_mode': car_mode,
                'rule_parameters': {'max_distance': 150, 'requires_approval_above': True}
            },
        ]

        for policy_data in policies:
            TravelPolicyMaster.objects.get_or_create(
                policy_type=policy_data['policy_type'],
                title=policy_data['title'],
                defaults={
                    'description': policy_data['description'],
                    'travel_mode': policy_data['travel_mode'],
                    'rule_parameters': policy_data['rule_parameters'],
                    'effective_from': date.today()
                }
            )

        self.stdout.write('Created travel policies')

    def create_email_templates(self):
        templates = [
            {
                'template_type': 'travel_request_submitted',
                'subject': 'Travel Request Submitted - {{request_id}}',
                'body': '''Dear {{employee_name}},

                Your travel request {{request_id}} has been submitted successfully.

                Travel Details:
                - Purpose: {{purpose}}
                - From: {{from_location}} 
                - To: {{to_location}}
                - Departure: {{departure_date}}
                - Return: {{return_date}}

                Your request is now pending approval from {{approver_name}}.

                Best regards,
                TSF Travel Team'''
            },
            {
                'template_type': 'travel_request_approved',
                'subject': 'Travel Request Approved - {{request_id}}',
                'body': '''Dear {{employee_name}},

                Your travel request {{request_id}} has been approved by {{approver_name}}.

                The travel desk will now proceed with booking arrangements and will contact you with confirmation details.

                Best regards,
                TSF Travel Team'''
            },
            {
                'template_type': 'booking_confirmation',
                'subject': 'Booking Confirmation - {{request_id}}',
                'body': '''Dear {{employee_name}},

                Your travel bookings have been confirmed:

                {{booking_details}}

                Please find attached booking confirmations. Contact the travel desk for any changes.

                Best regards,
                TSF Travel Team'''
            }
        ]

        for template_data in templates:
            EmailTemplateMaster.objects.get_or_create(
                template_type=template_data['template_type'],
                defaults={
                    'subject': template_data['subject'],
                    'body': template_data['body']
                }
            )

        self.stdout.write('Created email templates')
