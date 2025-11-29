from django.db import models

class EmailTemplateMaster(models.Model):
    """
    Email templates for various travel-related notifications
    """
    TEMPLATE_TYPE_CHOICES = [
        ('travel_request_submitted', 'Travel Request Submitted'),
        ('travel_request_approved', 'Travel Request Approved'),
        ('travel_request_rejected', 'Travel Request Rejected'),
        ('booking_confirmation', 'Booking Confirmation'),
        ('guest_house_confirmation', 'Guest House Booking Confirmation'),
        ('vehicle_duty_slip', 'Vehicle Duty Slip'),
        ('travel_reminder', 'Travel Reminder'),
        ('settlement_reminder', 'Settlement Reminder'),
    ]
    
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPE_CHOICES, unique=True)
    subject = models.CharField(max_length=200)
    body = models.TextField(help_text="Use {{variable}} for dynamic content")
        
    # Email settings
    cc_emails = models.JSONField(default=list, blank=True)
    bcc_emails = models.JSONField(default=list, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_template_type_display()}"
    
    def render_template(self, context_data):
        """
        Render template with provided context data
        """
        subject = self.subject
        body = self.body
        
        for key, value in context_data.items():
            placeholder = f"{{{{{key}}}}}"
            subject = subject.replace(placeholder, str(value))
            body = body.replace(placeholder, str(value))
            
        return subject, body
    
class NotificationPreference(models.Model):
    """User notification preferences"""
    
    NOTIFICATION_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
    ]
    
    user = models.OneToOneField('authentication.User', on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Travel-related notifications
    travel_submitted = models.BooleanField(default=True)
    travel_approved = models.BooleanField(default=True)
    travel_rejected = models.BooleanField(default=True)
    booking_confirmed = models.BooleanField(default=True)
    
    # Approval notifications
    approval_required = models.BooleanField(default=True)
    approval_reminder = models.BooleanField(default=True)
    
    # Settlement reminders
    settlement_due = models.BooleanField(default=True)
    settlement_overdue = models.BooleanField(default=True)
    
    # Preferred channels
    preferred_channels = models.JSONField(default=list)  # ['email', 'sms']
    
    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification preferences for {self.user.username}"
    
    def should_notify(self, notification_type, channel='email'):
        """Check if user should be notified"""
        # Check if notification type is enabled
        if not getattr(self, notification_type, True):
            return False
        
        # Check if channel is preferred
        if channel not in self.preferred_channels and self.preferred_channels:
            return False
        
        # Check quiet hours
        if self.quiet_hours_start and self.quiet_hours_end:
            from django.utils import timezone
            now = timezone.now().time()
            if self.quiet_hours_start <= now <= self.quiet_hours_end:
                return False
        
        return True