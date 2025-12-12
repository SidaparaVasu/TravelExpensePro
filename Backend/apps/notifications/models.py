from django.db import models
from django.utils import timezone
from django.conf import settings

class EmailTemplateMaster(models.Model):
    """
    Dynamic HTML email templates used by NotificationCenter.
    Admin can add unlimited templates without modifying code.
    """
    template_key = models.CharField(
        max_length=150,
        unique=True,
        help_text="Unique identifier used in NotificationRule (e.g., travel.submitted)"
    )

    template_name = models.CharField(
        max_length=200,
        help_text="Readable name for admin panel (e.g., Travel Submitted Email)"
    )

    subject = models.CharField(max_length=255)

    body_html = models.TextField(
        help_text="""
        HTML body. Use template variables like {{ employee_name }}, {{ approver_name }},
        {{ request_id }}, {{ purpose }} etc.
        """
    )

    body_text = models.TextField(
        blank=True, null=True,
        help_text="Optional plain text fallback. If empty, system auto-generates."
    )

    # Email settings
    cc_emails = models.JSONField(default=list, blank=True)
    bcc_emails = models.JSONField(default=list, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["template_key"]

    def __str__(self):
        return f"{self.template_key} — {self.template_name}"
    
    def preview_text(self):
        """Short preview for admin listing."""
        return (self.subject[:50] + "...") if len(self.subject) > 50 else self.subject

    def render_template(self, context_data):
        """
        Convenience method for simple replace-style rendering.
        We will later replace with Django Template engine rendering in NotificationCenter.
        """
        subject = self.subject
        body_html = self.body_html
        body_text = self.body_text or ''


        for key, value in context_data.items():
            placeholder = f"{{{{{key}}}}}"
            subject = subject.replace(placeholder, str(value))
            body_html = body_html.replace(placeholder, str(value))
            body_text = body_text.replace(placeholder, str(value))

        return subject, body_html, body_text
    

class NotificationRule(models.Model):
    """
    Mapping of event_name -> channels, template, recipient resolver, reminder config.
    event_name example: 'travel.request.submitted'
    """
    event_name = models.CharField(max_length=150, unique=True)
    description = models.CharField(max_length=255, blank=True)

    template = models.ForeignKey(EmailTemplateMaster, null=True, blank=True, on_delete=models.SET_NULL)
    channels = models.JSONField(default=list, blank=True) # e.g. ['email','in_app']

    # 'resolver' is string key like 'employee', 'approver', 'booking_agent', interpreted by NotificationCenter
    recipient_resolver = models.CharField(max_length=100, default='default_resolver')
    is_active = models.BooleanField(default=True)

    # Reminder config
    send_reminder = models.BooleanField(default=False)
    # list of seconds or ISO-like strings; we will interpret as seconds in the service layer
    reminder_intervals = models.JSONField(default=list, blank=True)
    escalation_resolver = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.event_name}"
    

class NotificationLog(models.Model):
    """
    One row per notification attempt (per channel)
    """
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    ]

    event_name = models.CharField(max_length=150)
    channel = models.CharField(max_length=20) # email/sms/in_app
    recipient = models.CharField(max_length=255)
    subject = models.CharField(max_length=512, null=True, blank=True)
    body = models.TextField(null=True, blank=True)

    # store full payload used to render the message (avoid storing sensitive fields)
    payload = models.JSONField(default=dict, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    attempts = models.IntegerField(default=0)
    last_error = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def mark_sent(self):
        self.status = 'sent'
        self.attempts += 1
        self.sent_at = timezone.now()
        self.save()

    def mark_failed(self, error_text: str):
        self.attempts += 1
        self.last_error = error_text
        self.status = 'failed'
        self.save()


class NotificationEvent(models.Model):
    """
    Tracks higher-level event for reminders and auto-escalation.
    Example: when travel request submitted, create a NotificationEvent so reminders/esc are scheduled.
    """
    event_name = models.CharField(max_length=150)
    reference_type = models.CharField(max_length=50) # e.g. 'TravelRequest'
    reference_id = models.BigIntegerField()
    rule = models.ForeignKey(NotificationRule, null=True, on_delete=models.SET_NULL)

    # store arbitrary data needed to render reminders (user ids, urgency etc)
    data = models.JSONField(default=dict, blank=True)

    # when to send next reminder
    next_reminder_at = models.DateTimeField(null=True, blank=True)
    reminder_index = models.IntegerField(default=0)

    # mark resolved when approval/booking is done
    is_resolved = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['event_name']),
            models.Index(fields=['next_reminder_at']),
        ]

    def advance_reminder(self):
        """Advance to next reminder slot or mark resolved if finished."""
        if not self.rule:
            self.is_resolved = True
            self.save()
            return

        intervals = self.rule.reminder_intervals or []
        next_index = self.reminder_index + 1
        if next_index < len(intervals):
            # intervals are expected to be seconds; compute next_reminder_at
            seconds = intervals[next_index]
            self.reminder_index = next_index
            self.next_reminder_at = timezone.now() + timezone.timedelta(seconds=seconds)
            self.save()
        else:
            # no more reminders
            self.is_resolved = True
            self.save()