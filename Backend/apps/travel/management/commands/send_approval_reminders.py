from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.travel.models import TravelApprovalFlow

class Command(BaseCommand):
    help = 'Send reminder emails for pending approvals older than 24 hours'

    def handle(self, *args, **options):
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        pending_approvals = TravelApprovalFlow.objects.filter(
            status='pending',
            created_at__lt=cutoff_time
        ).select_related('approver', 'travel_application__employee')
        
        sent_count = 0
        for approval in pending_approvals:
            try:
                self.send_reminder(approval)
                sent_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'Sent {sent_count} reminders'))
    
    def send_reminder(self, approval):
        """Send reminder email"""
        from django.core.mail import send_mail
        from django.conf import settings
        
        subject = f'Reminder: Pending Travel Approval - {approval.travel_application.get_travel_request_id()}'
        message = f'''Dear {approval.approver.get_full_name()},

This is a reminder that the following travel request requires your approval:

Request ID: {approval.travel_application.get_travel_request_id()}
Employee: {approval.travel_application.employee.get_full_name()}
Purpose: {approval.travel_application.purpose}
Submitted: {approval.created_at.strftime('%Y-%m-%d %H:%M')}

Please review and approve/reject at your earliest convenience.

Best Regards,
TSF Travel System'''
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [approval.approver.email],
            fail_silently=False,
        )
        
        self.stdout.write(f'✅ Reminder sent to {approval.approver.email}')