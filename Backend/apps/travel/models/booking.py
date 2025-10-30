from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Booking(models.Model):
    """
    Generic booking model for all travel modes
    """
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('requested', 'Requested'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    trip_details = models.ForeignKey(
        'TripDetails', 
        on_delete=models.CASCADE, 
        related_name='bookings'
    )
    booking_type = models.ForeignKey(
        'master_data.TravelModeMaster', 
        on_delete=models.CASCADE
    )
    sub_option = models.ForeignKey(
        'master_data.TravelSubOptionMaster', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Booking Details (stored as JSON for flexibility)
    booking_details = models.JSONField(default=dict)
    
    # Status and Cost
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    estimated_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    actual_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )

    special_instruction = models.TextField(blank=True, default='')
    
    # Booking Reference
    booking_reference = models.CharField(max_length=100, blank=True)
    vendor_reference = models.CharField(max_length=100, blank=True)
    
    # Files
    booking_file = models.FileField(upload_to=' booking_files/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    booked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['trip_details', 'booking_type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.booking_type.name} - {self.trip_details} ({self.status})"
    
    def requires_advance_booking_check(self):
        """Check if this booking requires advance booking validation"""
        from apps.travel.business_logic.validators import validate_advance_booking
        try:
            validate_advance_booking(
                self.trip_details.departure_date,
                self.booking_type.name,
                self.estimated_cost or 0
            )
            return False
        except:
            return True