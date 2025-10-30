from django.db import models

class NotificationPreference(models.Model):
    """User notification preferences"""
    
    NOTIFICATION_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('in_app', 'In-App'),
    ]
    
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='notification_preferences')
    
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