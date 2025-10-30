from rest_framework import serializers
from django.db import transaction
from ..models import TravelApplication, TripDetails, Booking, TravelAdvanceRequest
from ..business_logic.validators import (
    validate_advance_booking, validate_travel_entitlement,
    validate_duplicate_travel_request
)

class BookingSerializer(serializers.ModelSerializer):
    booking_type_name = serializers.CharField(source='booking_type.name', read_only=True)
    sub_option_name = serializers.CharField(source='sub_option.name', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_type', 'booking_type_name', 'sub_option', 'sub_option_name',
            'booking_details', 'status', 'estimated_cost', 'actual_cost',
            'booking_reference', 'vendor_reference', 'booking_file', 'special_instruction'
        ]

class TravelAdvanceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelAdvanceRequest
        fields = ['id', 'air_fare', 'train_fare', 'lodging_fare', 
                 'conveyance_fare', 'other_expenses', 'special_instruction', 'total']
        read_only_fields = ['total']

class TripDetailsSerializer(serializers.ModelSerializer):
    bookings = BookingSerializer(many=True, required=False)
    from_location_name = serializers.CharField(source='from_location.city_name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.city_name', read_only=True)
    duration_days = serializers.SerializerMethodField()
    city_category = serializers.SerializerMethodField()
    travel_advance = TravelAdvanceRequestSerializer(required=False, allow_null=True)

    class Meta:
        model = TripDetails
        fields = [
            'id', 'from_location', 'from_location_name', 'to_location', 'to_location_name',
            'departure_date', 'return_date', 'trip_purpose', 'guest_count',
            'duration_days', 'city_category', 'bookings', 'travel_advance'
        ]
    
    def get_duration_days(self, obj):
        return obj.get_duration_days()
    
    def get_city_category(self, obj):
        return obj.get_city_category()

class TravelApplicationSerializer(serializers.ModelSerializer):
    trip_details = TripDetailsSerializer(many=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_grade = serializers.CharField(source='employee.grade.name', read_only=True)
    gl_code_name = serializers.CharField(source='general_ledger.vertical_name', read_only=True)
    travel_request_id = serializers.SerializerMethodField()
    total_duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = TravelApplication
        fields = [
            'id', 'employee', 'employee_name', 'employee_grade', 'purpose',
            'internal_order', 'general_ledger', 'gl_code_name', 'sanction_number',
            'advance_amount', 'estimated_total_cost', 'status', 'is_settled',
            'settlement_due_date', 'travel_request_id', 'total_duration_days',
            'created_at', 'updated_at', 'submitted_at', 'trip_details'
        ]
        read_only_fields = [
            'employee', 'status', 'is_settled', 'estimated_total_cost',
            'created_at', 'updated_at', 'submitted_at'
        ]
    
    def get_travel_request_id(self, obj):
        return obj.get_travel_request_id()
    
    def get_total_duration_days(self, obj):
        return obj.get_travel_duration_days()
    
    def validate(self, data):
        """Enhanced validation with better error messages"""
        trip_details_data = data.get('trip_details', [])
        
        if not trip_details_data:
            raise serializers.ValidationError({
                'trip_details': 'At least one trip detail is required'
            })
        
        user = self.context['request'].user
        errors = {}
        
        # Validate each trip
        for idx, trip_data in enumerate(trip_details_data):
            trip_errors = {}
            
            departure = trip_data.get('departure_date')
            return_date = trip_data.get('return_date')
            
            # Date validation
            if return_date and departure and return_date < departure:
                trip_errors['dates'] = 'Return date cannot be earlier than departure date'
            
            # Check for duplicate travel (only if not draft)
            if not self.instance and self.context.get('status') != 'draft':
                try:
                    validate_duplicate_travel_request(user, departure, return_date)
                except Exception as e:
                    trip_errors['duplicate'] = str(e)
            
            # Booking validation
            bookings_data = trip_data.get('bookings', [])
            # if not bookings_data:
            #     trip_errors['bookings'] = 'At least one booking is required per trip'
            
            if trip_errors:
                errors[f'trip_{idx}'] = trip_errors
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        trip_details_data = validated_data.pop('trip_details')
        validated_data['employee'] = self.context['request'].user
        
        travel_application = TravelApplication.objects.create(**validated_data)
        
        for trip_data in trip_details_data:
            bookings_data = trip_data.pop('bookings', [])
            trip_detail = TripDetails.objects.create(
                travel_application=travel_application,
                **trip_data
            )

            advance_data = validated_data.pop('travel_advance', None)
            if advance_data:
                TravelAdvanceRequest.objects.create(trip_detail=trip_detail, **advance_data)
            
            for booking_data in bookings_data:
                # Validate own car if applicable
                if booking_data.get('booking_details', {}).get('transport_type') == 'own_car':
                    from apps.travel.business_logic.validators import validate_own_car_booking
                    
                    errors = validate_own_car_booking(
                        booking_data['booking_details'],
                        booking_data.get('booking_details', {}).get('distance_km')
                    )
                    
                    if any(e['severity'] == 'error' for e in errors):
                        error_messages = [e['message'] for e in errors if e['severity'] == 'error']
                        raise serializers.ValidationError({'own_car': error_messages})
                
                Booking.objects.create(trip_details=trip_detail, **booking_data)
        
        travel_application.calculate_estimated_cost()
        travel_application.save(update_fields=['estimated_total_cost'])
        
        return travel_application
    
    @transaction.atomic
    def update(self, instance, validated_data):
        trip_details_data = validated_data.pop('trip_details', None)
        
        # Update travel application fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update trip details if provided
        if trip_details_data is not None:
            # Delete existing trip details and recreate
            instance.trip_details.all().delete()
            
            for trip_data in trip_details_data:
                bookings_data = trip_data.pop('bookings', [])
                trip_detail = TripDetails.objects.create(
                    travel_application=instance,
                    **trip_data
                )

                advance_data = validated_data.pop('travel_advance', None)
                if advance_data:
                    TravelAdvanceRequest.objects.update_or_create(
                        trip_detail=instance, defaults=advance_data
                    )
                
                for booking_data in bookings_data:
                    Booking.objects.create(trip_details=trip_detail, **booking_data)
            
            # Recalculate estimated cost
            instance.calculate_estimated_cost()
            instance.save(update_fields=['estimated_total_cost'])
        
        return instance

class TravelApplicationSubmissionSerializer(serializers.Serializer):
    """
    Serializer for travel application submission with validation
    """
    def validate(self, data):
        travel_app = self.instance
        
        # Run business validations before submission
        for trip in travel_app.trip_details.all():
            for booking in trip.bookings.all():
                try:
                    # Validate advance booking requirements
                    validate_advance_booking(
                        trip.departure_date,
                        booking.booking_type.name,
                        booking.estimated_cost or 0
                    )
                    
                    # Validate travel entitlements
                    if booking.sub_option:
                        validate_travel_entitlement(
                            travel_app.employee,
                            booking.booking_type,
                            booking.sub_option,
                            # trip.to_location.city.category
                            trip.to_location.category.name
                        )
                        
                except Exception as e:
                    raise serializers.ValidationError({
                        'validation_error': str(e),
                        'trip_id': trip.id,
                        'booking_id': booking.id
                    })
        
        return data