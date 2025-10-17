from django.db import models
from django.utils import timezone

class TravelApprovalFlow(models.Model):
    """
    Dynamic approval chain for each travel application
    """
    APPROVAL_LEVELS = [
        ('manager', 'Reporting Manager'),
        ('chro', 'CHRO'),
        ('ceo', 'CEO'),
        ('travel_desk', 'Travel Desk'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('skipped', 'Skipped'),
    ]
    
    travel_application = models.ForeignKey(
        'TravelApplication', 
        on_delete=models.CASCADE,
        related_name='approval_flows'
    )
    approver = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='approval_tasks'
    )
    approval_level = models.CharField(max_length=20, choices=APPROVAL_LEVELS)
    sequence = models.PositiveIntegerField()
    
    # Permissions
    can_view = models.BooleanField(default=True)
    can_approve = models.BooleanField(default=True)
    
    # Status and timing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Auto-generated based on business rules
    is_required = models.BooleanField(default=True)
    triggered_by_rule = models.CharField(max_length=100, blank=True)  # e.g., "flight_above_10k"
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('travel_application', 'approver', 'approval_level')
        ordering = ['sequence']
        indexes = [
            models.Index(fields=['travel_application', 'sequence']),
            models.Index(fields=['approver', 'status']),
        ]
    
    def __str__(self):
        return f"{self.travel_application.get_travel_request_id()} - {self.approval_level} ({self.status})"
    
    def approve(self, notes=""):
        """Approve this step and trigger next approval"""
        self.status = 'approved'
        self.approved_at = timezone.now()
        self.notes = notes
        self.save()
        
        # Update travel application status
        self.travel_application.update_status_after_approval(self)
    
    def reject(self, notes=""):
        """Reject application"""
        self.status = 'rejected'
        self.approved_at = timezone.now()
        self.notes = notes
        self.save()
        
        # Update travel application status to rejected
        self.travel_application.status = f'rejected_{self.approval_level}'
        self.travel_application.save()