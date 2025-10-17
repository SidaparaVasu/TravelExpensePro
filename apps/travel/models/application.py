from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal

class TravelApplication(models.Model):
    """
    Enhanced travel application with TSF-specific requirements
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'), 
        ('pending_manager', 'Pending Manager Approval'),
        ('approved_manager', 'Approved by Manager'),
        ('rejected_manager', 'Rejected by Manager'),
        ('pending_chro', 'Pending CHRO Approval'),
        ('approved_chro', 'Approved by CHRO'),
        ('rejected_chro', 'Rejected by CHRO'),
        ('pending_ceo', 'Pending CEO Approval'),
        ('approved_ceo', 'Approved by CEO'),
        ('rejected_ceo', 'Rejected by CEO'),
        ('pending_travel_desk', 'Pending Travel Desk'),
        ('booking_in_progress', 'Booking in Progress'),
        ('booked', 'Bookings Confirmed'),
        ('completed', 'Travel Completed'),
        ('cancelled', 'Cancelled'),
    ]

    VALID_STATUS_TRANSITIONS = {
        'draft': ['pending_manager', 'cancelled'],
        'pending_manager': ['approved_manager', 'rejected_manager'],
        'approved_manager': ['pending_chro', 'pending_ceo', 'pending_travel_desk'],
        'pending_chro': ['approved_chro', 'rejected_chro'],
        'approved_chro': ['pending_ceo', 'pending_travel_desk'],
        'pending_ceo': ['approved_ceo', 'rejected_ceo'],
        'approved_ceo': ['pending_travel_desk'],
        'pending_travel_desk': ['booking_in_progress'],
        'booking_in_progress': ['booked'],
        'booked': ['completed'],
        'completed': ['completed'],  # Allow staying completed
    }

    # Basic Information
    employee = models.ForeignKey(
        'authentication.User', 
        on_delete=models.CASCADE, 
        related_name='travel_applications'
    )
    purpose = models.TextField(help_text="Purpose of travel")
    
    # TSF Required Fields
    internal_order = models.CharField(
        max_length=50, 
        help_text="IO reference number"
    )
    general_ledger = models.ForeignKey(
        'master_data.GLCodeMaster',
        on_delete=models.PROTECT,
        help_text="GL code for expenses"
    )
    sanction_number = models.CharField(
        max_length=50,
        help_text="Sanction number for approval"
    )
    
    # Financial
    advance_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Advance amount requested"
    )
    estimated_total_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Status and Tracking
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='draft')
    is_settled = models.BooleanField(default=False)
    settlement_due_date = models.DateField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Approval Tracking
    current_approver = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pending_approvals'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status', 'current_approver']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"TR-{self.id} - {self.employee.username} ({self.status})"
    
    def get_travel_request_id(self):
        """Generate formatted travel request ID"""
        return f"TSF-TR-{self.created_at.year}-{self.id:06d}"
    
    def calculate_estimated_cost(self):
        """Calculate estimated cost from trip details"""
        total = Decimal('0')
        for trip in self.trip_details.all():
            for booking in trip.bookings.all():
                total += booking.estimated_cost or Decimal('0')
        self.estimated_total_cost = total
        return total
    
    def get_travel_duration_days(self):
        """Get total travel duration in days"""
        if not self.trip_details.exists():
            return 0
        
        earliest_departure = self.trip_details.aggregate(
            min_date=models.Min('departure_date')
        )['min_date']
        
        latest_return = self.trip_details.aggregate(
            max_date=models.Max('return_date')
        )['max_date']
        
        if earliest_departure and latest_return:
            return (latest_return - earliest_departure).days + 1
        return 0
    
    def requires_advance_booking_validation(self):
        """Check if any bookings require advance booking validation"""
        for trip in self.trip_details.all():
            for booking in trip.bookings.all():
                if booking.requires_advance_booking_check():
                    return True
        return False
    
    def set_settlement_due_date(self):
        """Set settlement due date (30 days after latest return date)"""
        latest_return = self.trip_details.aggregate(
            max_date=models.Max('return_date')
        )['max_date']
        
        if latest_return:
            from datetime import timedelta
            self.settlement_due_date = latest_return + timedelta(days=30)
            self.save(update_fields=['settlement_due_date'])

    def update_status_after_approval(self, approved_flow):
        """
        Update application status after an approval step is completed
        """
        # Get next pending approval
        next_approval = self.approval_flows.filter(
            sequence__gt=approved_flow.sequence,
            status='pending'
        ).order_by('sequence').first()
        
        if next_approval:
            # Move to next approval step
            self.current_approver = next_approval.approver
            self.status = f'pending_{next_approval.approval_level}'
        else:
            # All approvals completed - send to travel desk
            self.current_approver = None
            self.status = 'pending_travel_desk'
        
        self.save()

    # def can_transition_to(self, new_status):
    #     """Check if status transition is valid"""
    #     allowed = self.VALID_STATUS_TRANSITIONS.get(self.status, [])
    #     return new_status in allowed

    # def save(self, *args, **kwargs):
    #     if self.pk:  # Existing instance
    #         old_instance = TravelApplication.objects.get(pk=self.pk)
    #         if old_instance.status != self.status:
    #             if not self.can_transition_to(self.status):
    #                 raise ValueError(
    #                     f"Invalid status transition from {old_instance.status} to {self.status}"
    #                 )
    #     super().save(*args, **kwargs)



class TripDetails(models.Model):
    """
    Individual trip segments within a travel application
    """
    travel_application = models.ForeignKey(
        TravelApplication, 
        on_delete=models.CASCADE, 
        related_name='trip_details'
    )
    
    # Location Information
    from_location = models.ForeignKey(
        'master_data.LocationMaster',
        on_delete=models.PROTECT,
        related_name='trips_from'
    )
    to_location = models.ForeignKey(
        'master_data.LocationMaster',
        on_delete=models.PROTECT,
        related_name='trips_to'
    )
    
    # Dates
    departure_date = models.DateField()
    return_date = models.DateField()
    
    # Trip specific details
    trip_purpose = models.TextField(blank=True, help_text="Specific purpose for this trip segment")
    guest_count = models.PositiveIntegerField(default=0, help_text="Number of guests accompanying")
    
    class Meta:
        ordering = ['departure_date']
        indexes = [
            models.Index(fields=['travel_application', 'departure_date']),
        ]
    
    def __str__(self):
        return f"{self.from_location.location_name} → {self.to_location.location_name} ({self.departure_date})"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.return_date < self.departure_date:
            raise ValidationError("Return date cannot be earlier than departure date")
    
    def get_duration_days(self):
        """Get duration of this trip in days"""
        return (self.return_date - self.departure_date).days + 1
    
    def get_city_category(self):
        """Get destination city category for DA calculation"""
        return self.to_location.city.category.name
    


class TravelApproval(models.Model):
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    travel_application = models.OneToOneField(TravelApplication, on_delete=models.CASCADE, related_name='approval')
    manager = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, related_name='approvals_to_review')
    status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Approval for {self.travel_application.id} by {self.manager.username} | {self.travel_application.status} | {self.status}"
    
    def save(self, *args, **kwargs):
        # first save this approval
        super().save(*args, **kwargs)

        if self.status == "approved":
            self.travel_application.status = "approved_manager"
            self.travel_application.save(update_fields=["status"])
        elif self.status == "rejected":
            self.travel_application.status = "rejected_manager"
            self.travel_application.save(update_fields=["status"])
        elif self.status == "pending":
            self.travel_application.status = "pending_manager"
            self.travel_application.save(update_fields=["status"])

        