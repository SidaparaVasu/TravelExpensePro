from django.db import models
from django.core.validators import MinValueValidator

class ApprovalMatrix(models.Model):
    """
    Dynamic approval matrix based on travel mode, grade, and amount
    """
    travel_mode = models.ForeignKey('TravelModeMaster', on_delete=models.CASCADE)
    employee_grade = models.ForeignKey('GradeMaster', on_delete=models.CASCADE)
    
    # Amount thresholds
    min_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    max_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Leave blank for no upper limit"
    )
    
    # Approval requirements
    requires_manager = models.BooleanField(default=True)
    requires_chro = models.BooleanField(default=False)
    requires_ceo = models.BooleanField(default=False)
    
    # Special conditions
    flight_above_10k_ceo = models.BooleanField(
        default=True,
        help_text="Automatically require CEO approval for flights above ₹10,000"
    )
    
    # Visibility and action permissions
    manager_can_view = models.BooleanField(default=True)
    manager_can_approve = models.BooleanField(default=True)
    
    # Additional conditions
    advance_booking_required_days = models.IntegerField(
        default=0,
        help_text="Minimum advance booking days required"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('travel_mode', 'employee_grade', 'min_amount')
        ordering = ['travel_mode', 'employee_grade', 'min_amount']
        indexes = [
            models.Index(fields=['travel_mode', 'employee_grade']),
            models.Index(fields=['min_amount', 'max_amount']),
        ]
    
    def __str__(self):
        max_amt = f"₹{self.max_amount}" if self.max_amount else "No Limit"
        return f"{self.travel_mode.name} - {self.employee_grade.name} (₹{self.min_amount} - {max_amt})"
    
    def applies_to_amount(self, amount):
        """Check if this rule applies to the given amount"""
        if amount < self.min_amount:
            return False
        if self.max_amount and amount > self.max_amount:
            return False
        return True

class DAIncidentalMaster(models.Model):
    """
    Daily Allowance and Incidental rates by grade and city category
    """
    grade = models.ForeignKey('GradeMaster', on_delete=models.CASCADE)
    city_category = models.ForeignKey('CityCategoriesMaster', on_delete=models.CASCADE)
    
    # DA rates
    da_full_day = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="DA for travel duration > 12 hours"
    )
    da_half_day = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="DA for travel duration 8-12 hours"
    )
    
    # Incidental rates
    incidental_full_day = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Incidentals for travel duration > 12 hours"
    )
    incidental_half_day = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="Incidentals for travel duration 8-12 hours"
    )
    
    # Stay-related allowances
    stay_allowance_category_a = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="When staying with friends/relatives in Category A cities"
    )
    stay_allowance_category_b = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text="When staying with friends/relatives in Category B cities"
    )
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('grade', 'city_category', 'effective_from')
        ordering = ['grade', 'city_category', '-effective_from']
        indexes = [
            models.Index(fields=['grade', 'city_category', 'effective_from']),
            models.Index(fields=['effective_from', 'effective_to', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.grade.name} - {self.city_category.name} (DA: ₹{self.da_full_day})"
    
    def is_currently_effective(self):
        """Check if this rate is currently effective"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if not self.is_active:
            return False
            
        if today < self.effective_from:
            return False
            
        if self.effective_to and today > self.effective_to:
            return False
            
        return True

class ConveyanceRateMaster(models.Model):
    """
    Conveyance reimbursement rates
    """
    CONVEYANCE_TYPE_CHOICES = [
        ('own_vehicle', 'Own Vehicle'),
        ('taxi_with_receipt', 'Taxi with Receipt'),
        ('taxi_without_receipt', 'Taxi without Receipt (Self Declaration)'),
        ('auto_rickshaw', 'Auto Rickshaw'),
        ('public_transport', 'Public Transport'),
    ]
    
    conveyance_type = models.CharField(max_length=30, choices=CONVEYANCE_TYPE_CHOICES)
    rate_per_km = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        help_text="Rate per kilometer"
    )
    max_distance_per_day = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Maximum claimable distance per day"
    )
    requires_receipt = models.BooleanField(default=False)
    max_claim_amount = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text="Maximum claimable amount per trip"
    )
    
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('conveyance_type', 'effective_from')
        ordering = ['conveyance_type', '-effective_from']
    
    def __str__(self):
        return f"{self.get_conveyance_type_display()} - ₹{self.rate_per_km}/km"